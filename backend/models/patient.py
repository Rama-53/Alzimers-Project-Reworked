"""Pydantic models for Patient CRUD operations."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PatientCreate(BaseModel):
    """Request body for creating a new patient."""
    name: str = Field(..., min_length=1, max_length=100, description="Patient's full name")
    age: int = Field(..., ge=1, le=120, description="Patient's age")
    condition_notes: Optional[str] = Field("", description="Notes about the patient's condition")
    auto_greet: bool = Field(False, description="Enable auto-greet when a face is recognized")


class PatientUpdate(BaseModel):
    """Request body for updating a patient (all fields optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=1, le=120)
    condition_notes: Optional[str] = None
    auto_greet: Optional[bool] = None


class PatientResponse(BaseModel):
    """Response model for patient data."""
    id: str
    name: str
    age: int
    condition_notes: str = ""
    auto_greet: bool = False
    created_at: datetime
    updated_at: datetime
