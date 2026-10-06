# 🧠 Alzheimer Helper

A face-recognition-based assistive application designed to help Alzheimer's patients identify people and support memory recall through last-seen context tracking and a context-aware chatbot.

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Ollama](https://img.shields.io/badge/Ollama-Llama_3.1-000000?style=for-the-badge)](https://ollama.com)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
  - [Docker Setup (Recommended)](#docker-setup-recommended)
  - [Local Development Setup](#local-development-setup)
- [API Documentation](#-api-documentation)
- [Development Phases](#-development-phases)
- [Configuration](#-configuration)
- [Privacy & Security](#-privacy--security)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

Alzheimer Helper is built to support patients with memory impairment by providing:

1. **Face Recognition** — Identifies known people (family, caregivers, friends) using a webcam or uploaded photo
2. **Context Tracking** — Automatically logs when and where a person was last seen, what they talked about, and caregiver notes
3. **Context-Aware Chatbot** — An AI chatbot that uses all recognized-person context to help the patient recall memories

The application is designed with **privacy first** — all data stays local. No cloud APIs, no external data sharing. MongoDB runs locally, and the LLM (Llama 3.1) runs on your own GPU via Ollama.

### How It Works

```
📷 Camera detects face
       ↓
🔍 DeepFace identifies person (ArcFace model)
       ↓
📝 Interaction logged to MongoDB (who, when, where)
       ↓
🤖 Chatbot receives context automatically
       ↓
💬 Patient can ask: "Who is this?" → "This is Rahul, your son..."
```

---

## ✨ Features

### Core
| Feature | Description |
|---|---|
| 📸 **Face Recognition** | Real-time via WebRTC or photo upload. Uses DeepFace + ArcFace for high accuracy. GPU-accelerated. |
| 🤖 **Context-Aware Chatbot** | Powered by Ollama (Llama 3.1 8B). Knows who visited, when, and what was discussed. |
| 📝 **Interaction Logging** | Auto-logs every recognition event with timestamp, location, conversation topics, and notes. |
| 👤 **People Management** | Register faces with multiple photos, relationship info, and caregiver notes. |
| 🎙️ **Voice Notes** | Caregivers can record audio notes about each person. |
| 📷 **Photo Gallery** | Chronological timeline of all visits with photos and context. |
| 📊 **Dashboard** | Daily/weekly visit summaries, visitor stats, and system health. |

### Chatbot Intelligence
| Feature | Description |
|---|---|
| 🔄 **Auto-Greet (Toggleable)** | When enabled, chatbot automatically introduces recognized people. Can be toggled per patient. |
| 🧠 **Session Memory** | Remembers ALL faces recognized during the current session, not just the latest. |
| 📚 **Historical Context** | Pulls full interaction history from MongoDB for rich, accurate responses. |
| 💬 **Natural Conversation** | Patient can ask "Who visited today?", "When did I last see [name]?", etc. |

### UI/UX
| Feature | Description |
|---|---|
| 🌗 **Dark/Light Mode** | Toggle between themes. Dark mode with glassmorphism design. |
| 💬 **Floating Chatbot** | Always-accessible chat drawer that slides in from the side. |
| 📱 **Responsive Design** | Works on desktop and tablet screens. |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Compose                          │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend    │    │   Backend    │    │   MongoDB    │  │
│  │  React/Vite   │───▶│   FastAPI    │───▶│   mongo:7    │  │
│  │  Port 5173    │    │  Port 8000   │    │  Port 27017  │  │
│  └──────────────┘    └──────┬───────┘    └──────────────┘  │
│                             │                               │
│                             │ REST + WebSocket              │
│                             ▼                               │
│                      ┌──────────────┐                       │
│                      │   Ollama     │                       │
│                      │ Llama 3.1   │                       │
│                      │ Port 11434   │                       │
│                      └──────────────┘                       │
│                                                             │
│  GPU: NVIDIA RTX 3060 (shared by Backend + Ollama)          │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
WebRTC Camera ──▶ WebSocket ──▶ FastAPI ──▶ DeepFace (GPU)
                                   │              │
                                   │         Face Match
                                   │              │
                                   ▼              ▼
                              MongoDB ◀── Log Interaction
                                   │
                                   ▼
                           Context Builder ──▶ Ollama LLM
                                                  │
                                                  ▼
                                          Chatbot Response
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 (Vite) | Premium UI with dark/light themes |
| **Camera** | WebRTC | Low-latency live face detection from browser |
| **Backend** | FastAPI (Python 3.11) | Async REST API + WebSocket |
| **Database** | MongoDB 7 (Motor async driver) | Document storage with aggregation pipelines |
| **Face Detection** | OpenCV DNN | Fast face detection |
| **Face Recognition** | DeepFace + ArcFace | State-of-the-art accuracy, GPU-accelerated |
| **LLM** | Ollama (Llama 3.1 8B) | Local, private, context-aware chatbot |
| **Containerization** | Docker Compose | One-command deployment with GPU passthrough |
| **Styling** | Vanilla CSS + CSS Variables | Glassmorphism, gradients, theme toggle |

---

## 📁 Project Structure

```
alzheimer-helper/
├── docker-compose.yml              # Orchestrates all services
├── .env                            # Environment variables
├── .gitignore
├── README.md                       # This file
│
├── backend/                        # FastAPI Backend
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                     # App entry point, CORS, health checks
│   ├── config.py                   # Centralized configuration
│   ├── database.py                 # MongoDB connection (Motor async)
│   ├── models/                     # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   ├── patient.py              # Patient model (with auto_greet toggle)
│   │   ├── person.py               # Person/known face model
│   │   └── interaction.py          # Visit/recognition event model
│   ├── routers/                    # API endpoint handlers
│   │   ├── __init__.py
│   │   ├── patients.py             # Patient CRUD
│   │   ├── people.py               # People CRUD + photo/audio upload
│   │   └── interactions.py         # Interaction logging + statistics
│   ├── services/                   # Business logic layer
│   │   ├── __init__.py
│   │   ├── face_service.py         # DeepFace recognition (Phase 2)
│   │   ├── chat_service.py         # Ollama chatbot (Phase 3)
│   │   └── context_service.py      # LLM context builder (Phase 3)
│   └── data/                       # Mounted volume for uploaded files
│       ├── faces/                  # Face photos organized by patient/person
│       ├── snapshots/              # Recognition snapshots
│       └── audio/                  # Voice notes
│
├── frontend/                       # React (Vite) Frontend (Phase 4)
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                 # Root + routing
│       ├── index.css               # Design system + themes
│       ├── api/                    # API service layer (axios)
│       ├── components/             # Reusable UI components
│       ├── pages/                  # Application pages
│       ├── hooks/                  # Custom React hooks
│       └── context/                # Global state providers
│
└── scripts/
    ├── setup.sh                    # Initial setup script
    └── pull_models.sh              # Pull Ollama models
```

---

## 📋 Prerequisites

### For Docker Setup (Recommended)

| Requirement | Installation |
|---|---|
| **Docker Desktop** | [Download](https://www.docker.com/products/docker-desktop/) |
| **NVIDIA GPU Driver** | [Download](https://www.nvidia.com/Download/index.aspx) |
| **NVIDIA Container Toolkit** | See [installation guide](#nvidia-container-toolkit-setup) |

### For Local Development

| Requirement | Version | Installation |
|---|---|---|
| **Python** | 3.11+ | [Download](https://python.org/downloads/) |
| **Node.js** | 20+ | [Download](https://nodejs.org/) |
| **MongoDB** | 7+ | [Download](https://www.mongodb.com/try/download/community) |
| **Ollama** | Latest | [Download](https://ollama.com/download) |
| **CUDA Toolkit** | 12+ | [Download](https://developer.nvidia.com/cuda-downloads) |
| **Git** | Latest | [Download](https://git-scm.com/) |

### NVIDIA Container Toolkit Setup

Required for GPU passthrough in Docker (face recognition + LLM).

**Windows (WSL2):**
```bash
# In WSL2 terminal:
distribution=$(. /etc/os-release; echo $ID$VERSION_ID)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
  sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

**Verify GPU access:**
```bash
docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi
```

---

## 🚀 Getting Started

### Docker Setup (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/Rama-53/Alzimers-Project-Reworked.git
cd Alzimers-Project-Reworked

# 2. Start all services
docker-compose up --build

# 3. Pull the LLM model (first time only)
docker exec -it alzheimer-ollama ollama pull llama3.1

# 4. Access the application
#    Frontend:  http://localhost:5173
#    Backend:   http://localhost:8000
#    API Docs:  http://localhost:8000/docs
```

### Local Development Setup

#### Backend

```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start MongoDB (must be running)
# If installed locally, it usually runs as a service
# Or start with: mongod --dbpath ./data/db

# 5. Start Ollama (must be running)
ollama serve
# In another terminal:
ollama pull llama3.1

# 6. Run the backend
uvicorn main:app --reload --port 8000
```

#### Frontend

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```

### Verify Setup

```bash
# Check API health
curl http://localhost:8000/api/health

# Check all services
curl http://localhost:8000/api/health/services

# View interactive API docs
open http://localhost:8000/docs
```

---

## 📚 API Documentation

FastAPI auto-generates interactive docs at **`http://localhost:8000/docs`** (Swagger UI).

### Endpoints Summary

#### System
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | API health check |
| `GET` | `/api/health/services` | MongoDB + Ollama status |

#### Patients
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/patients/` | List all patients |
| `POST` | `/api/patients/` | Create new patient |
| `GET` | `/api/patients/{id}` | Get patient by ID |
| `PUT` | `/api/patients/{id}` | Update patient |
| `DELETE` | `/api/patients/{id}` | Delete patient (cascades to people & interactions) |

#### People (per patient)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/patients/{id}/people` | List known people |
| `POST` | `/api/patients/{id}/people` | Register new person |
| `GET` | `/api/patients/{id}/people/{pid}` | Get person details |
| `PUT` | `/api/patients/{id}/people/{pid}` | Update person |
| `DELETE` | `/api/patients/{id}/people/{pid}` | Delete person (cascades) |
| `POST` | `/api/patients/{id}/people/{pid}/photos` | Upload face photo(s) |
| `POST` | `/api/patients/{id}/people/{pid}/audio` | Upload voice note |

#### Face Recognition ✅
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/patients/{id}/recognize` | Recognize faces in an uploaded image. Returns matches with full context. Auto-logs interaction. |
| `WS` | `/ws/camera/{patient_id}` | Live WebSocket camera stream. Rate-limited (1 frame/2s). Smart interaction logging (5min debounce). |

#### Chatbot ✅
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/patients/{id}/chat` | Send message with session context. Returns AI response with memory-aiding context. |
| `GET` | `/api/patients/{id}/chat/status` | Check Ollama connectivity and model availability. |
| `POST` | `/api/patients/{id}/chat/auto-greet` | Trigger auto-greet for a recognized person (when enabled). |

#### Interactions
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/patients/{id}/interactions` | List interactions (filterable by `person_id`, `limit`) |
| `POST` | `/api/patients/{id}/interactions` | Log new interaction |
| `GET` | `/api/patients/{id}/interactions/today` | Today's interactions |
| `GET` | `/api/patients/{id}/interactions/stats` | Aggregated statistics |

### Example: Create a Patient

```bash
curl -X POST http://localhost:8000/api/patients/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "age": 72,
    "condition_notes": "Early-stage Alzheimer'\''s",
    "auto_greet": true
  }'
```

**Response:**
```json
{
  "id": "66f8a1b2c3d4e5f6a7b8c9d0",
  "name": "John",
  "age": 72,
  "condition_notes": "Early-stage Alzheimer's",
  "auto_greet": true,
  "created_at": "2026-09-28T14:30:00",
  "updated_at": "2026-09-28T14:30:00"
}
```

### Example: Register a Person & Upload Photos

```bash
# Step 1: Register the person
curl -X POST http://localhost:8000/api/patients/{patient_id}/people \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rahul",
    "relationship": "Son",
    "notes": "Lives in Bangalore. Software engineer."
  }'

# Step 2: Upload face photos
curl -X POST http://localhost:8000/api/patients/{patient_id}/people/{person_id}/photos \
  -F "files=@rahul_front.jpg" \
  -F "files=@rahul_side.jpg"
```

### Example: Get Interaction Stats

```bash
curl http://localhost:8000/api/patients/{patient_id}/interactions/stats
```

**Response:**
```json
{
  "today_count": 3,
  "week_count": 12,
  "total_count": 47,
  "today_visitors": [
    {"person_id": "...", "name": "Rahul", "visits": 2, "last_seen": "2026-09-28T14:30:00"}
  ],
  "last_interaction": { ... },
  "weekly_breakdown": [
    {"date": "2026-09-22", "visits": 2, "unique_visitors": 1},
    {"date": "2026-09-23", "visits": 5, "unique_visitors": 3}
  ]
}
```

---

## 📅 Development Phases

| Phase | Description | Status |
|---|---|---|
| **Phase 1** | Docker + FastAPI backend + MongoDB CRUD | ✅ Complete |
| **Phase 2** | Face recognition (DeepFace + WebSocket) | ✅ Complete |
| **Phase 3** | Chatbot (Ollama + context builder) | ✅ Complete |
| **Phase 4** | React frontend foundation + design system | ✅ Complete |
| **Phase 5** | Frontend pages (Home, Recognize, Chat, etc.) | 🔲 Pending |
| **Phase 6** | Polish, animations, error handling, testing | 🔲 Pending |

### Phase 1 — Docker + Backend Foundation ✅
- Docker Compose with 3 services (backend, MongoDB, Ollama) + NVIDIA GPU support
- FastAPI application with async MongoDB connection via Motor
- Pydantic models for request/response validation
- Full CRUD endpoints for patients, people, and interactions
- File upload endpoints for face photos and audio notes
- Interaction statistics with MongoDB aggregation pipelines
- Health check endpoints for MongoDB and Ollama connectivity
- CORS configured for React frontend

### Phase 2 — Face Recognition ✅
- **FaceService** singleton: lazy-loads DeepFace + ArcFace model, keeps it warm in GPU memory
- `POST /api/patients/{id}/recognize`: upload an image → detect faces → match against known faces → return results with full context
- `WS /ws/camera/{patient_id}`: WebSocket for live camera frames, rate-limited to 1 frame every 2 seconds
- **Smart interaction logging**: auto-logs recognition events but debounces (5-minute cooldown per person to prevent spam)
- **ContextService**: pulls person profiles + interaction history from MongoDB, formats for display and chatbot
- Snapshot saving: every recognition saves a JPEG snapshot for the gallery timeline
- DeepFace `.pkl` cache cleanup on new photo uploads for accurate re-indexing
- Base64 and file upload image decoding with error handling

### Phase 3 — Chatbot Integration ✅
- **ChatService** singleton: connects to Ollama REST API (`/api/chat` endpoint)
- Compassionate system prompt engineering: warm, patient tone with strict rules against hallucination
- **3-layer context injection**: historical (MongoDB) + session (camera-recognized people) + conversation history
- `POST /api/patients/{id}/chat`: main chat endpoint accepting message + session_person_ids + conversation_history
- `GET /api/patients/{id}/chat/status`: Ollama health check with model availability
- `POST /api/patients/{id}/chat/auto-greet`: triggers auto-greet when a face is recognized (toggleable per patient)
- Conversation history capped at last 20 messages to manage LLM context window
- Graceful error handling: connection errors, timeouts, and model unavailability

### Phase 4 — React Frontend Foundation ✅
- Vite + React 18 project structure setup with `react-router-dom` v6
- Comprehensive Design System (`index.css`): CSS variables, dark/light theme switching, glassmorphic card design, responsive navbar/sidebar
- **ThemeContext** & **PatientContext**: global state management with `localStorage` persistence
- **API Service Layer**: Axios instance with automatic Vite dev server proxying to FastAPI backend (`/api`)
- Reusable UI components: `Navbar`, `Sidebar`, `Layout`, `ThemeToggle`, `PatientSelector`, `Modal`, `Badge`
- Application pages scaffolded: Home, Recognize, Chatbot, Manage People, Gallery, and Analytics Dashboard

### Phase 5 — Frontend Pages
- **Home** — Patient selection, quick stats, navigation cards
- **Recognize** — Live WebRTC camera + photo upload, result cards
- **Chatbot** — Floating chat drawer with message bubbles
- **Manage People** — Register/edit faces, upload photos, record audio
- **Gallery** — Chronological interaction timeline with filters
- **Dashboard** — Daily/weekly stats, visitor charts

### Phase 6 — Polish & Testing
- Loading states, error boundaries, toast notifications
- Micro-animations and hover effects
- Responsive design for tablet screens
- Performance optimization (lazy loading, memoization)
- End-to-end testing
- README finalization

---

## ⚙️ Configuration

All configuration is managed through environment variables. See [`.env`](.env) for defaults.

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URL` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGODB_DB` | `alzheimer_helper` | Database name |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API URL |
| `OLLAMA_MODEL` | `llama3.1` | LLM model name |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin |
| `FACE_RECOGNITION_MODEL` | `ArcFace` | DeepFace recognition model |
| `FACE_DETECTOR_BACKEND` | `opencv` | Face detection backend |
| `FACE_DISTANCE_THRESHOLD` | `0.68` | Match threshold (lower = stricter) |

> **Note:** Docker Compose overrides these via its `environment` section. The `.env` file is used for local development.

---

## 🔒 Privacy & Security

This application is designed with **patient privacy as the top priority**:

- **🏠 100% Local** — All data stays on your machine. No cloud APIs, no external data sharing.
- **🗄️ Local Database** — MongoDB runs in a Docker container on your hardware.
- **🤖 Local LLM** — Ollama runs Llama 3.1 locally on your GPU. No API keys needed.
- **📸 Local Face Data** — Face photos are stored on the local filesystem, never uploaded anywhere.
- **🔐 No Authentication to External Services** — The app works entirely offline after initial model download.

> **⚠️ Important:** The `.env` file is included in the repo for convenience during development. In a production deployment, use proper secrets management.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- [DeepFace](https://github.com/serengil/deepface) — Face recognition library
- [Ollama](https://ollama.com) — Local LLM runtime
- [FastAPI](https://fastapi.tiangolo.com) — Modern Python web framework
- [MongoDB](https://mongodb.com) — Document database
- [React](https://react.dev) — Frontend library

---

<p align="center">
  Built with ❤️ for making life easier for Alzheimer's patients and their caregivers.
</p>
