"""Face recognition service using DeepFace + ArcFace.

Handles face detection, recognition against a patient's known faces database,
snapshot saving, and cache management. Uses a singleton pattern for model reuse.
"""
import os
import cv2
import numpy as np
import glob
import uuid
import base64
import time

from config import (
    FACES_DIR, SNAPSHOTS_DIR,
    FACE_RECOGNITION_MODEL, FACE_DETECTOR_BACKEND, FACE_DISTANCE_THRESHOLD,
)


class FaceService:
    """GPU-accelerated face detection and recognition using DeepFace."""

    def __init__(self):
        self.model_name = FACE_RECOGNITION_MODEL
        self.detector_backend = FACE_DETECTOR_BACKEND
        self.distance_threshold = FACE_DISTANCE_THRESHOLD
        self._model_loaded = False

    def _ensure_model(self):
        """Lazy-load the DeepFace model on first use to avoid slow startup."""
        if not self._model_loaded:
            from deepface import DeepFace

            try:
                # Warm up with a dummy image so the first real call isn't slow
                dummy = np.zeros((100, 100, 3), dtype=np.uint8)
                DeepFace.represent(
                    dummy,
                    model_name=self.model_name,
                    detector_backend="skip",
                    enforce_detection=False,
                )
                self._model_loaded = True
                print(f"✅ Face recognition model loaded: {self.model_name}")
            except Exception as e:
                print(f"⚠️ Model warm-up note: {e}")
                self._model_loaded = True  # Don't retry on every call

    # ---- Image Decoding ----

    def decode_base64_image(self, base64_string: str) -> np.ndarray | None:
        """Decode a base64 string (optionally with data URL prefix) to BGR numpy array."""
        try:
            if "," in base64_string:
                base64_string = base64_string.split(",", 1)[1]

            image_bytes = base64.b64decode(base64_string)
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return image
        except Exception as e:
            print(f"Base64 decode error: {e}")
            return None

    def decode_upload_image(self, file_bytes: bytes) -> np.ndarray | None:
        """Decode uploaded file bytes to BGR numpy array."""
        try:
            nparr = np.frombuffer(file_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return image
        except Exception as e:
            print(f"Upload decode error: {e}")
            return None

    # ---- Face Detection ----

    def detect_faces(self, image: np.ndarray) -> list[dict]:
        """Detect faces in an image.

        Returns:
            List of dicts with keys: face, facial_area, confidence
        """
        from deepface import DeepFace

        self._ensure_model()

        try:
            faces = DeepFace.extract_faces(
                img_path=image,
                detector_backend=self.detector_backend,
                enforce_detection=False,
                align=True,
            )
            # Filter out low-confidence or no-face detections
            valid = [f for f in faces if f.get("confidence", 0) > 0.5]
            return valid
        except Exception as e:
            print(f"Face detection error: {e}")
            return []

    # ---- Face Recognition ----

    def recognize(self, image: np.ndarray, patient_id: str) -> list[dict]:
        """Recognize faces in an image against a patient's known faces.

        Searches data/faces/{patient_id}/ which contains subdirectories
        per person_id, each with their face photos.

        Args:
            image: BGR numpy array from camera or upload
            patient_id: Patient whose face database to search

        Returns:
            Deduplicated list sorted by confidence (best first):
            [{"person_id", "distance", "confidence", "identity"}]
        """
        from deepface import DeepFace

        self._ensure_model()

        db_path = os.path.join(FACES_DIR, patient_id)

        # Don't call DeepFace if there are no images to match against
        if not os.path.exists(db_path) or not self._has_images(db_path):
            return []

        try:
            results = DeepFace.find(
                img_path=image,
                db_path=db_path,
                model_name=self.model_name,
                detector_backend=self.detector_backend,
                enforce_detection=False,
                silent=True,
            )

            matches = []
            for df in results:
                if df is None or len(df) == 0:
                    continue

                for _, row in df.iterrows():
                    identity_path = str(row.get("identity", ""))

                    # Distance column name varies by model (e.g. "distance", "ArcFace_cosine")
                    distance = None
                    for col in df.columns:
                        if "distance" in col.lower() or "cosine" in col.lower():
                            distance = float(row[col])
                            break

                    if distance is None:
                        continue

                    person_id = self._extract_person_id(identity_path)

                    if person_id and distance <= self.distance_threshold:
                        confidence = round(max(0.0, min(1.0, 1.0 - distance)), 4)
                        matches.append({
                            "person_id": person_id,
                            "distance": round(distance, 4),
                            "confidence": confidence,
                            "identity": identity_path,
                        })

            # Sort by distance (lower = better), deduplicate by person_id
            matches.sort(key=lambda x: x["distance"])
            seen = set()
            unique = []
            for m in matches:
                if m["person_id"] not in seen:
                    seen.add(m["person_id"])
                    unique.append(m)

            return unique

        except Exception as e:
            print(f"Face recognition error: {e}")
            return []

    # ---- Snapshot ----

    def save_snapshot(self, image: np.ndarray, patient_id: str) -> str:
        """Save a recognition snapshot. Returns the filename."""
        snapshot_dir = os.path.join(SNAPSHOTS_DIR, patient_id)
        os.makedirs(snapshot_dir, exist_ok=True)

        filename = f"snap_{uuid.uuid4().hex[:8]}.jpg"
        filepath = os.path.join(snapshot_dir, filename)
        cv2.imwrite(filepath, image)
        return filename

    # ---- Cache Management ----

    def clear_representations(self, patient_id: str):
        """Clear cached DeepFace .pkl representations so they're recomputed."""
        db_path = os.path.join(FACES_DIR, patient_id)
        for pkl in glob.glob(os.path.join(db_path, "**", "*.pkl"), recursive=True):
            try:
                os.remove(pkl)
            except OSError:
                pass

    # ---- Helpers ----

    def _has_images(self, directory: str) -> bool:
        """Check if a directory tree contains any image files."""
        for ext in ("*.jpg", "*.jpeg", "*.png"):
            if glob.glob(os.path.join(directory, "**", ext), recursive=True):
                return True
        return False

    def _extract_person_id(self, filepath: str) -> str | None:
        """Extract person_id from a face image path.

        Expected: .../faces/{patient_id}/{person_id}/photo.jpg
        """
        parts = filepath.replace("\\", "/").split("/")
        for i, part in enumerate(parts):
            if part == "faces" and i + 2 < len(parts):
                return parts[i + 2]  # [faces]/[patient_id]/[person_id]
        return None


# Singleton — reuse across requests to keep the model in memory
face_service = FaceService()
