"""People (known faces) CRUD API endpoints with photo/audio upload."""
import os
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, File
from datetime import datetime
from bson import ObjectId

from database import get_db
from models.person import PersonCreate, PersonUpdate, PersonResponse
from config import FACES_DIR, AUDIO_DIR

router = APIRouter()


def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document _id (ObjectId) to string id."""
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


# ---- CRUD ----

@router.get("/{patient_id}/people", response_model=list[PersonResponse])
async def list_people(patient_id: str):
    """List all known people for a patient."""
    db = get_db()
    cursor = db.people.find({"patient_id": patient_id}).sort("created_at", -1)
    people = []
    async for doc in cursor:
        people.append(serialize_doc(doc))
    return people


@router.post("/{patient_id}/people", response_model=PersonResponse, status_code=201)
async def create_person(patient_id: str, person: PersonCreate):
    """Register a new known person for a patient."""
    db = get_db()

    # Verify patient exists
    try:
        patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid patient ID format")
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    doc = {
        **person.model_dump(),
        "patient_id": patient_id,
        "photos": [],
        "audio_notes": [],
        "created_at": datetime.utcnow(),
    }
    result = await db.people.insert_one(doc)
    doc["_id"] = result.inserted_id

    # Create face directory for this person's photos
    person_face_dir = os.path.join(FACES_DIR, patient_id, str(result.inserted_id))
    os.makedirs(person_face_dir, exist_ok=True)

    return serialize_doc(doc)


@router.get("/{patient_id}/people/{person_id}", response_model=PersonResponse)
async def get_person(patient_id: str, person_id: str):
    """Get a single person's details."""
    db = get_db()
    try:
        doc = await db.people.find_one({"_id": ObjectId(person_id), "patient_id": patient_id})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    if not doc:
        raise HTTPException(status_code=404, detail="Person not found")
    return serialize_doc(doc)


@router.put("/{patient_id}/people/{person_id}", response_model=PersonResponse)
async def update_person(patient_id: str, person_id: str, person: PersonUpdate):
    """Update a person's details."""
    db = get_db()
    update_data = {k: v for k, v in person.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        result = await db.people.find_one_and_update(
            {"_id": ObjectId(person_id), "patient_id": patient_id},
            {"$set": update_data},
            return_document=True,
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    if not result:
        raise HTTPException(status_code=404, detail="Person not found")
    return serialize_doc(result)


@router.delete("/{patient_id}/people/{person_id}")
async def delete_person(patient_id: str, person_id: str):
    """Delete a person and their related interactions."""
    db = get_db()
    try:
        oid = ObjectId(person_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    result = await db.people.delete_one({"_id": oid, "patient_id": patient_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Person not found")

    # Delete related interactions
    await db.interactions.delete_many({"patient_id": patient_id, "person_id": person_id})

    # Clean up face images directory
    person_face_dir = os.path.join(FACES_DIR, patient_id, person_id)
    if os.path.exists(person_face_dir):
        import shutil
        shutil.rmtree(person_face_dir, ignore_errors=True)

    return {"message": "Person and related data deleted successfully"}


# ---- Photo Upload ----

@router.post("/{patient_id}/people/{person_id}/photos")
async def upload_photos(patient_id: str, person_id: str, files: list[UploadFile] = File(...)):
    """Upload one or more face photos for recognition training."""
    db = get_db()

    # Verify person exists
    try:
        person = await db.people.find_one({"_id": ObjectId(person_id), "patient_id": patient_id})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    person_face_dir = os.path.join(FACES_DIR, patient_id, person_id)
    os.makedirs(person_face_dir, exist_ok=True)

    uploaded = []
    for file in files:
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            continue

        # Generate unique filename preserving extension
        ext = os.path.splitext(file.filename or "photo.jpg")[1] or ".jpg"
        filename = f"{uuid.uuid4().hex[:8]}{ext}"
        filepath = os.path.join(person_face_dir, filename)

        # Save file to disk
        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)

        uploaded.append(filename)

    if uploaded:
        # Update person's photo list in DB
        await db.people.update_one(
            {"_id": ObjectId(person_id)},
            {"$push": {"photos": {"$each": uploaded}}},
        )

        # Clear any cached face representations so DeepFace re-computes
        import glob
        db_path = os.path.join(FACES_DIR, patient_id)
        for pkl in glob.glob(os.path.join(db_path, "*.pkl")):
            try:
                os.remove(pkl)
            except OSError:
                pass

    return {"uploaded": uploaded, "count": len(uploaded)}


# ---- Audio Note Upload ----

@router.post("/{patient_id}/people/{person_id}/audio")
async def upload_audio(patient_id: str, person_id: str, file: UploadFile = File(...)):
    """Upload a voice/audio note about a person."""
    db = get_db()

    # Verify person exists
    try:
        person = await db.people.find_one({"_id": ObjectId(person_id), "patient_id": patient_id})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    # Save audio file
    audio_dir = os.path.join(AUDIO_DIR, patient_id, person_id)
    os.makedirs(audio_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "note.webm")[1] or ".webm"
    filename = f"note_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(audio_dir, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    # Update person's audio notes list in DB
    await db.people.update_one(
        {"_id": ObjectId(person_id)},
        {"$push": {"audio_notes": filename}},
    )

    return {"filename": filename, "path": f"/static/audio/{patient_id}/{person_id}/{filename}"}
