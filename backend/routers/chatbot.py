"""Chatbot API endpoints.

- POST /{patient_id}/chat         — Send a message, get AI response with context
- GET  /{patient_id}/chat/status  — Check Ollama availability
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from bson import ObjectId

from database import get_db
from services.chat_service import chat_service
from services.context_service import context_service

router = APIRouter()


# ---- Request/Response Models ----

class ChatRequest(BaseModel):
    """Request body for sending a chat message."""
    message: str = Field(..., min_length=1, max_length=2000, description="The user's message")
    session_person_ids: Optional[List[str]] = Field(
        default_factory=list,
        description="IDs of people recognized during the current session (for session context)",
    )
    conversation_history: Optional[List[dict]] = Field(
        default_factory=list,
        description='Previous messages: [{"role": "user"|"assistant", "content": "..."}]',
    )
    auto_greet_person: Optional[str] = Field(
        None,
        description="If set, triggers auto-greet mode for this person name",
    )


class ChatResponse(BaseModel):
    """Response from the chatbot."""
    response: str
    auto_greet: bool = False
    session_context_used: bool = False


# ---- Endpoints ----

@router.post("/{patient_id}/chat", response_model=ChatResponse)
async def chat(patient_id: str, req: ChatRequest):
    """Send a message to the context-aware chatbot.

    The chatbot receives:
    1. **Historical context** — All known people + their interaction history from MongoDB
    2. **Session context** — People recognized during the current camera session
    3. **Conversation history** — Previous messages in the current chat session

    This gives the LLM full awareness of who the patient knows, who visited recently,
    and who is currently present (recognized by camera).
    """
    db = get_db()

    # Verify patient exists
    try:
        patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid patient ID")
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Build context from MongoDB + session
    context_str = await context_service.build_chatbot_context(
        patient_id=patient_id,
        session_person_ids=req.session_person_ids or [],
    )

    # Call the LLM
    response_text = chat_service.chat(
        user_message=req.message,
        context=context_str,
        conversation_history=req.conversation_history,
        auto_greet_person=req.auto_greet_person,
    )

    return ChatResponse(
        response=response_text,
        auto_greet=patient.get("auto_greet", False),
        session_context_used=bool(req.session_person_ids),
    )


@router.get("/{patient_id}/chat/status")
async def chat_status(patient_id: str):
    """Check Ollama connectivity and model availability.

    Returns whether Ollama is running, the target model is downloaded,
    and lists all available models.
    """
    db = get_db()

    # Verify patient exists
    try:
        patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid patient ID")
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    status = chat_service.is_available()
    status["patient_id"] = patient_id
    status["auto_greet"] = patient.get("auto_greet", False)

    return status


@router.post("/{patient_id}/chat/auto-greet")
async def auto_greet(patient_id: str, person_id: str):
    """Trigger an auto-greet message for a recognized person.

    Called by the recognition system when auto_greet is enabled
    and a known person is detected. Returns a warm greeting message
    that introduces the person to the patient.
    """
    db = get_db()

    # Verify patient
    try:
        patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid patient ID")
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if not patient.get("auto_greet", False):
        return {"response": "", "auto_greet_enabled": False}

    # Get person context
    ctx = await context_service.get_recognition_context(patient_id, person_id)
    if not ctx.get("person"):
        raise HTTPException(status_code=404, detail="Person not found")

    # Build context for just this person
    context_str = await context_service.build_chatbot_context(
        patient_id=patient_id,
        session_person_ids=[person_id],
    )

    # Generate auto-greet
    person_name = ctx["person"]["name"]
    response_text = chat_service.chat(
        user_message="",  # Will be overridden by auto_greet_person
        context=context_str,
        auto_greet_person=person_name,
    )

    return {
        "response": response_text,
        "person": ctx["person"],
        "auto_greet_enabled": True,
    }
