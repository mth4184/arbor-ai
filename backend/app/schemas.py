from pydantic import BaseModel
from typing import Optional, List

class LeadCreate(BaseModel):
    name: str
    phone: str = ""
    address: str = ""
    notes: str = ""

class LeadOut(BaseModel):
    id: int
    name: str
    phone: str
    address: str
    notes: str
    class Config: from_attributes = True

class EstimateCreate(BaseModel):
    lead_id: int
    scope: str = ""
    hazards: str = ""
    equipment: str = ""
    final_price: float = 0.0

class EstimateOut(BaseModel):
    id: int
    lead_id: int
    scope: str
    hazards: str
    equipment: str
    suggested_price: float
    final_price: float
    status: str
    class Config: from_attributes = True

class JobCreate(BaseModel):
    estimate_id: int
    scheduled_for: str
    crew: str
    address: str = ""

class JobOut(BaseModel):
    id: int
    estimate_id: int
    scheduled_for: str
    crew: str
    address: str
    status: str
    class Config: from_attributes = True

class InvoiceCreate(BaseModel):
    job_id: int
    amount: float

class InvoiceOut(BaseModel):
    id: int
    job_id: int
    amount: float
    status: str
    class Config: from_attributes = True

# AI
class AiEstimateRequest(BaseModel):
    lead_id: int
    job_description: str
    tree_count: Optional[int] = None
    access_notes: Optional[str] = None
    urgency: Optional[str] = None

class AiNotesRequest(BaseModel):
    raw_notes: str

class AiScheduleRequest(BaseModel):
    estimate_id: int
    preferred_window: str  # e.g. "next 10 days"
    crew_options: List[str]  # e.g. ["A-team", "B-team"]
