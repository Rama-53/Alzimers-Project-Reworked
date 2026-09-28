"""Application configuration loaded from environment variables."""
import os
from dotenv import load_dotenv

load_dotenv()

# ---- MongoDB ----
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "alzheimer_helper")

# ---- Ollama LLM ----
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")

# ---- Face Recognition ----
FACE_RECOGNITION_MODEL = os.getenv("FACE_RECOGNITION_MODEL", "ArcFace")
FACE_DETECTOR_BACKEND = os.getenv("FACE_DETECTOR_BACKEND", "opencv")
FACE_DISTANCE_THRESHOLD = float(os.getenv("FACE_DISTANCE_THRESHOLD", "0.68"))

# ---- Paths ----
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
FACES_DIR = os.path.join(DATA_DIR, "faces")
SNAPSHOTS_DIR = os.path.join(DATA_DIR, "snapshots")
AUDIO_DIR = os.path.join(DATA_DIR, "audio")

# Create directories
for d in [FACES_DIR, SNAPSHOTS_DIR, AUDIO_DIR]:
    os.makedirs(d, exist_ok=True)

# ---- CORS ----
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
