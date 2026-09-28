"""Face recognition API endpoints.

- POST /{patient_id}/recognize — Recognize faces in an uploaded image
- WS   /ws/camera/{patient_id} — Live WebSocket camera stream recognition
"""
import time
from datetime import datetime

from fastapi import APIRouter, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect
from bson import ObjectId

from database import get_db
from services.face_service import face_service
from services.context_service import context_service

router = APIRouter()


# ---- REST: Single Image Recognition ----

@router.post("/{patient_id}/recognize")
async def recognize_face(patient_id: str, file: UploadFile = File(...)):
    """Recognize faces in an uploaded image.

    1. Detects all faces in the image
    2. Matches each face against the patient's known faces database
    3. Returns match results with full context (person info, last seen, etc.)
    4. Auto-logs an interaction for each recognized person

    Returns:
        faces_detected: total faces found in the image
        matches: list of recognized people with context
        unrecognized: count of faces that didn't match anyone
        auto_greet: whether auto-greet is enabled for this patient
    """
    db = get_db()

    # Verify patient exists
    try:
        patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid patient ID")
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Read and decode the image
    content = await file.read()
    image = face_service.decode_upload_image(content)
    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image file — could not decode")

    # Step 1: Detect faces
    faces = face_service.detect_faces(image)

    # Step 2: Recognize against known faces
    matches = face_service.recognize(image, patient_id)

    # Step 3: Build response with context + auto-log interactions
    results = []
    for match in matches:
        ctx = await context_service.get_recognition_context(patient_id, match["person_id"])

        # Auto-log this recognition as an interaction
        if ctx.get("person"):
            snapshot = face_service.save_snapshot(image, patient_id)
            await db.interactions.insert_one({
                "patient_id": patient_id,
                "person_id": match["person_id"],
                "person_name": ctx["person"]["name"],
                "timestamp": datetime.utcnow(),
                "location": "",
                "conversation_topics": [],
                "notes": "Auto-logged from photo recognition",
                "snapshot_photo": snapshot,
                "confidence": match["confidence"],
            })

        results.append({
            "match": match,
            "context": ctx,
        })

    return {
        "faces_detected": len(faces),
        "matches": results,
        "unrecognized": max(0, len(faces) - len(matches)),
        "auto_greet": patient.get("auto_greet", False),
    }


# ---- WebSocket: Live Camera Recognition ----

@router.websocket("/ws/camera/{patient_id}")
async def camera_websocket(websocket: WebSocket, patient_id: str):
    """WebSocket for live camera face recognition.

    Protocol:
        Client sends:  base64-encoded JPEG frames (text messages)
        Server sends:  JSON with recognition results

    Rate limiting:
        Processes at most 1 frame every 2 seconds to avoid GPU overload.
        Frames received during cooldown get a "skipped" response.

    Interaction logging:
        Auto-logs an interaction only if the person hasn't been seen
        in the last 5 minutes (prevents spam from continuous recognition).
    """
    await websocket.accept()

    db = get_db()
    last_process_time = 0.0
    min_interval = 2.0  # seconds between frame processing

    try:
        # Verify patient
        try:
            patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
        except Exception:
            await websocket.send_json({"error": "Invalid patient ID"})
            await websocket.close()
            return

        if not patient:
            await websocket.send_json({"error": "Patient not found"})
            await websocket.close()
            return

        # Handshake: tell the client we're ready
        await websocket.send_json({
            "status": "connected",
            "patient_id": patient_id,
            "patient_name": patient["name"],
            "auto_greet": patient.get("auto_greet", False),
            "message": "Send base64 JPEG frames for recognition",
        })

        while True:
            # Receive a frame
            data = await websocket.receive_text()
            current_time = time.time()

            # Rate limit
            if current_time - last_process_time < min_interval:
                await websocket.send_json({
                    "status": "skipped",
                    "message": "Rate limited",
                })
                continue

            last_process_time = current_time

            try:
                # Decode frame
                image = face_service.decode_base64_image(data)
                if image is None:
                    await websocket.send_json({
                        "status": "error",
                        "message": "Could not decode frame",
                    })
                    continue

                # Detect + Recognize
                faces = face_service.detect_faces(image)
                matches = face_service.recognize(image, patient_id)

                # Build results with context
                results = []
                for match in matches:
                    ctx = await context_service.get_recognition_context(
                        patient_id, match["person_id"]
                    )

                    # Smart interaction logging: only log if last seen > 5 min ago
                    if ctx.get("person"):
                        should_log = True
                        last_seen = ctx.get("last_seen")
                        if last_seen and last_seen.get("timestamp"):
                            try:
                                last_ts = datetime.fromisoformat(last_seen["timestamp"])
                                elapsed = (datetime.utcnow() - last_ts).total_seconds()
                                if elapsed < 300:  # 5 minutes
                                    should_log = False
                            except (ValueError, TypeError):
                                pass

                        if should_log:
                            snapshot = face_service.save_snapshot(image, patient_id)
                            await db.interactions.insert_one({
                                "patient_id": patient_id,
                                "person_id": match["person_id"],
                                "person_name": ctx["person"]["name"],
                                "timestamp": datetime.utcnow(),
                                "location": "",
                                "conversation_topics": [],
                                "notes": "Auto-logged from live camera",
                                "snapshot_photo": snapshot,
                                "confidence": match["confidence"],
                            })

                    results.append({
                        "match": match,
                        "context": ctx,
                    })

                # Send results back
                await websocket.send_json({
                    "status": "processed",
                    "faces_detected": len(faces),
                    "matches": results,
                    "unrecognized": max(0, len(faces) - len(matches)),
                    "auto_greet": patient.get("auto_greet", False),
                    "timestamp": current_time,
                })

            except Exception as e:
                await websocket.send_json({
                    "status": "error",
                    "message": f"Processing error: {str(e)}",
                })

    except WebSocketDisconnect:
        print(f"📷 Camera disconnected — patient {patient_id}")
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        try:
            await websocket.close()
        except Exception:
            pass
