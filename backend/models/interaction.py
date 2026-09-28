"""Pydantic models for Interaction (visit/recognition event) operations."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class InteractionCreate(BaseModel):
    """Request body for logging a new interaction/visit."""
    person_id: str = Field(..., description="ID of the recognized person")
    person_name: str = Field(..., description="Name of the person (denormalized for quick access)")
    location: Optional[str] = Field("", description="Where the interaction happened")
    conversation_topics: Optional[List[str]] = Field(default_factory=list, description="Topics discussed")
    notes: Optional[str] = Field("", description="Additional notes about the visit")
    snapshot_photo: Optional[str] = Field("", description="Filename of the snapshot taken during recognition")
    confidence: Optional[float] = Field(0.0, ge=0.0, le=1.0, description="Recognition confidence score")


class InteractionResponse(BaseModel):
    """Response model for interaction data."""
    id: str
    patient_id: str
    person_id: str
    person_name: str
    timestamp: datetime
    location: str = ""
    conversation_topics: List[str] = []
    notes: str = ""
    snapshot_photo: str = ""
    confidence: float = 0.0
