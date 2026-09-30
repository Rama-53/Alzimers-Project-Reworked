"""
Alzheimer Helper — FastAPI Backend Entry Point.

Provides REST API for:
- Patient management (CRUD)
- People/known faces management (CRUD + photo/audio upload)
- Interaction/visit logging and statistics
- Face recognition (DeepFace + ArcFace via REST and WebSocket)
- Context-aware chatbot (Phase 3)
"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import FRONTEND_URL, DATA_DIR, FACES_DIR, AUDIO_DIR, SNAPSHOTS_DIR
from database import connect_to_mongo, close_mongo_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: connect to MongoDB. Shutdown: close connection."""
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title="Alzheimer Helper API",
    description="Face recognition-based assistive application for Alzheimer's patients",
    version="1.0.0",
    lifespan=lifespan,
)

# ---- CORS ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Static file serving for uploaded images, audio, and snapshots ----
os.makedirs(FACES_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(SNAPSHOTS_DIR, exist_ok=True)

app.mount("/static/faces", StaticFiles(directory=FACES_DIR), name="faces")
app.mount("/static/audio", StaticFiles(directory=AUDIO_DIR), name="audio")
app.mount("/static/snapshots", StaticFiles(directory=SNAPSHOTS_DIR), name="snapshots")

# ---- Routers ----
from routers import patients, people, interactions, recognition, chatbot

app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])
app.include_router(people.router, prefix="/api/patients", tags=["People"])
app.include_router(interactions.router, prefix="/api/patients", tags=["Interactions"])
app.include_router(recognition.router, prefix="/api/patients", tags=["Recognition"])
app.include_router(chatbot.router, prefix="/api/patients", tags=["Chatbot"])


# ---- Health Check ----
@app.get("/api/health", tags=["System"])
async def health_check():
    """Check if the API is running."""
    return {"status": "healthy", "service": "alzheimer-helper-api", "version": "1.0.0"}


@app.get("/api/health/services", tags=["System"])
async def service_health():
    """Check health of all connected services (MongoDB, Ollama)."""
    from database import get_db
    import requests
    from config import OLLAMA_BASE_URL

    # MongoDB check
    mongo_ok = False
    try:
        db = get_db()
        await db.command("ping")
        mongo_ok = True
    except Exception:
        pass

    # Ollama check
    ollama_ok = False
    ollama_models = []
    try:
        resp = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if resp.status_code == 200:
            ollama_ok = True
            ollama_models = [m["name"] for m in resp.json().get("models", [])]
    except Exception:
        pass

    return {
        "mongodb": {"status": "connected" if mongo_ok else "disconnected"},
        "ollama": {
            "status": "connected" if ollama_ok else "disconnected",
            "models": ollama_models,
        },
    }
