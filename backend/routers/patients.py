"""Patient CRUD API endpoints."""
from fastapi import APIRouter, HTTPException
from datetime import datetime
from bson import ObjectId

from database import get_db
from models.patient import PatientCreate, PatientUpdate, PatientResponse

router = APIRouter()


def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document _id (ObjectId) to string id."""
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("/", response_model=list[PatientResponse])
async def list_patients():
    """List all registered patients, newest first."""
    db = get_db()
    cursor = db.patients.find().sort("created_at", -1)
    patients = []
    async for doc in cursor:
        patients.append(serialize_doc(doc))
    return patients


@router.post("/", response_model=PatientResponse, status_code=201)
async def create_patient(patient: PatientCreate):
    """Create a new patient profile."""
    db = get_db()
    now = datetime.utcnow()
    doc = {
        **patient.model_dump(),
        "created_at": now,
        "updated_at": now,
    }
    result = await db.patients.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: str):
    """Get a single patient by ID."""
    db = get_db()
    try:
        doc = await db.patients.find_one({"_id": ObjectId(patient_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid patient ID format")
    if not doc:
        raise HTTPException(status_code=404, detail="Patient not found")
    return serialize_doc(doc)


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(patient_id: str, patient: PatientUpdate):
    """Update a patient's details. Only provided fields are updated."""
    db = get_db()
    update_data = {k: v for k, v in patient.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    update_data["updated_at"] = datetime.utcnow()

    try:
        result = await db.patients.find_one_and_update(
            {"_id": ObjectId(patient_id)},
            {"$set": update_data},
            return_document=True,
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid patient ID format")

    if not result:
        raise HTTPException(status_code=404, detail="Patient not found")
    return serialize_doc(result)


@router.delete("/{patient_id}")
async def delete_patient(patient_id: str):
    """Delete a patient and all their related people and interactions."""
    db = get_db()
    try:
        oid = ObjectId(patient_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid patient ID format")

    result = await db.patients.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Cascade delete related data
    pid_str = str(oid)
    await db.people.delete_many({"patient_id": pid_str})
    await db.interactions.delete_many({"patient_id": pid_str})

    return {"message": f"Patient and all related data deleted successfully"}
