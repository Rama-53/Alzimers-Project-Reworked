"""MongoDB connection management using Motor (async driver)."""
from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGODB_URL, MONGODB_DB

client: AsyncIOMotorClient = None
db = None


async def connect_to_mongo():
    """Initialize MongoDB connection and create indexes."""
    global client, db
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DB]

    # Create indexes for fast queries
    await db.people.create_index("patient_id")
    await db.interactions.create_index([("patient_id", 1), ("timestamp", -1)])
    await db.interactions.create_index([("patient_id", 1), ("person_id", 1)])

    print(f"✅ Connected to MongoDB: {MONGODB_URL}/{MONGODB_DB}")


async def close_mongo_connection():
    """Close MongoDB connection on shutdown."""
    global client
    if client:
        client.close()
        print("🔌 MongoDB connection closed.")


def get_db():
    """Get the database instance. Must be called after connect_to_mongo()."""
    return db
