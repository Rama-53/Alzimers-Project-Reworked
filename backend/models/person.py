"""Pydantic models for Person (known face) CRUD operations."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class PersonCreate(BaseModel):
    """Request body for registering a new known person."""
    name: str = Field(..., min_length=1, max_length=100, description="Person's name")
    relationship: str = Field(..., min_length=1, max_length=100, description="Relationship to patient (e.g. Son, Daughter, Nurse)")
    notes: Optional[str] = Field("", description="Additional notes about this person")


class PersonUpdate(BaseModel):
    """Request body for updating a person's details."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    relationship: Optional[str] = Field(None, min_length=1, max_length=100)
    notes: Optional[str] = None


class PersonResponse(BaseModel):
    """Response model for person data."""
    id: str
    patient_id: str
    name: str
    relationship: str
    notes: str = ""
    photos: List[str] = []
    audio_notes: List[str] = []
    created_at: datetime
