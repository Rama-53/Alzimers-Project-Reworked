"""Interaction (visit/recognition event) API endpoints."""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from bson import ObjectId

from database import get_db
from models.interaction import InteractionCreate, InteractionResponse

router = APIRouter()


def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document _id (ObjectId) to string id."""
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("/{patient_id}/interactions", response_model=list[InteractionResponse])
async def list_interactions(patient_id: str, limit: int = 50, person_id: str = None):
    """List interactions for a patient, optionally filtered by person. Newest first."""
    db = get_db()
    query = {"patient_id": patient_id}
    if person_id:
        query["person_id"] = person_id

    cursor = db.interactions.find(query).sort("timestamp", -1).limit(limit)
    interactions = []
    async for doc in cursor:
        interactions.append(serialize_doc(doc))
    return interactions


@router.get("/{patient_id}/interactions/today", response_model=list[InteractionResponse])
async def today_interactions(patient_id: str):
    """Get all interactions that happened today."""
    db = get_db()
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    cursor = db.interactions.find({
        "patient_id": patient_id,
        "timestamp": {"$gte": today_start},
    }).sort("timestamp", -1)

    interactions = []
    async for doc in cursor:
        interactions.append(serialize_doc(doc))
    return interactions


@router.post("/{patient_id}/interactions", response_model=InteractionResponse, status_code=201)
async def create_interaction(patient_id: str, interaction: InteractionCreate):
    """Log a new interaction/recognition event."""
    db = get_db()

    doc = {
        **interaction.model_dump(),
        "patient_id": patient_id,
        "timestamp": datetime.utcnow(),
    }
    result = await db.interactions.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


@router.get("/{patient_id}/interactions/stats")
async def interaction_stats(patient_id: str):
    """Get aggregated interaction statistics for a patient."""
    db = get_db()
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)

    # Counts
    today_count = await db.interactions.count_documents({
        "patient_id": patient_id,
        "timestamp": {"$gte": today_start},
    })
    week_count = await db.interactions.count_documents({
        "patient_id": patient_id,
        "timestamp": {"$gte": week_start},
    })
    total_count = await db.interactions.count_documents({"patient_id": patient_id})

    # Unique visitors today (aggregation pipeline)
    pipeline = [
        {"$match": {"patient_id": patient_id, "timestamp": {"$gte": today_start}}},
        {"$group": {
            "_id": "$person_id",
            "name": {"$first": "$person_name"},
            "count": {"$sum": 1},
            "last_seen": {"$max": "$timestamp"},
        }},
        {"$sort": {"last_seen": -1}},
    ]
    today_visitors = []
    async for doc in db.interactions.aggregate(pipeline):
        today_visitors.append({
            "person_id": doc["_id"],
            "name": doc["name"],
            "visits": doc["count"],
            "last_seen": doc["last_seen"].isoformat(),
        })

    # Most recent interaction
    last = await db.interactions.find_one(
        {"patient_id": patient_id},
        sort=[("timestamp", -1)],
    )

    # Weekly breakdown (visits per day for the last 7 days)
    weekly_pipeline = [
        {"$match": {"patient_id": patient_id, "timestamp": {"$gte": week_start}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
            "count": {"$sum": 1},
            "unique_visitors": {"$addToSet": "$person_id"},
        }},
        {"$sort": {"_id": 1}},
    ]
    weekly_data = []
    async for doc in db.interactions.aggregate(weekly_pipeline):
        weekly_data.append({
            "date": doc["_id"],
            "visits": doc["count"],
            "unique_visitors": len(doc["unique_visitors"]),
        })

    return {
        "today_count": today_count,
        "week_count": week_count,
        "total_count": total_count,
        "today_visitors": today_visitors,
        "last_interaction": serialize_doc(last) if last else None,
        "weekly_breakdown": weekly_data,
    }
