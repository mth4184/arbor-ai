from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserBase(BaseModel):
    name: str
    email: str
    role: str = "office"


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None


class UserOut(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustomerBase(BaseModel):
    name: str
    company_name: Optional[str] = None
    phone: str = ""
    email: str = ""
    billing_address: str = ""
    service_address: str = ""
    notes: str = ""
    tags: List[str] = []


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    billing_address: Optional[str] = None
    service_address: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class CustomerOut(CustomerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LeadBase(BaseModel):
    customer_id: int
    source: Optional[str] = None
    status: str = "new"
    notes: str = ""


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    source: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    customer_id: Optional[int] = None


class LeadOut(LeadBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EstimateLineItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    qty: float = 1.0
    unit_price: float = 0.0
    total: float = 0.0
    sort_order: int = 0


class EstimateLineItemCreate(EstimateLineItemBase):
    pass


class EstimateLineItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    qty: Optional[float] = None
    unit_price: Optional[float] = None
    total: Optional[float] = None
    sort_order: Optional[int] = None


class EstimateLineItemOut(EstimateLineItemBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EstimateBase(BaseModel):
    customer_id: int
    lead_id: Optional[int] = None
    status: str = "draft"
    scope: str = ""
    hazards: str = ""
    equipment: str = ""
    suggested_price: float = 0.0
    total: float = 0.0
    tax: float = 0.0
    discount: float = 0.0
    sent_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    notes: str = ""


class EstimateCreate(EstimateBase):
    line_items: List[EstimateLineItemCreate] = []


class EstimateUpdate(BaseModel):
    customer_id: Optional[int] = None
    lead_id: Optional[int] = None
    status: Optional[str] = None
    scope: Optional[str] = None
    hazards: Optional[str] = None
    equipment: Optional[str] = None
    suggested_price: Optional[float] = None
    total: Optional[float] = None
    tax: Optional[float] = None
    discount: Optional[float] = None
    sent_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    notes: Optional[str] = None
    line_items: Optional[List[EstimateLineItemCreate]] = None


class EstimateOut(EstimateBase):
    id: int
    created_at: datetime
    updated_at: datetime
    line_items: List[EstimateLineItemOut] = []

    class Config:
        from_attributes = True


class JobTaskBase(BaseModel):
    title: str
    completed: bool = False
    sort_order: int = 0


class JobTaskCreate(JobTaskBase):
    pass


class EstimateConvertRequest(BaseModel):
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    crew_id: Optional[int] = None
    notes: str = ""
    status: str = "scheduled"
    tasks: List[JobTaskCreate] = []
    equipment_ids: List[int] = []


class EstimateInvoiceRequest(BaseModel):
    issued_at: Optional[datetime] = None
    due_date: Optional[datetime] = None


class JobTaskUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None
    sort_order: Optional[int] = None


class JobTaskOut(JobTaskBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JobBase(BaseModel):
    customer_id: int
    estimate_id: Optional[int] = None
    status: str = "scheduled"
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    crew_id: Optional[int] = None
    total: float = 0.0
    notes: str = ""


class JobCreate(JobBase):
    tasks: List[JobTaskCreate] = []
    equipment_ids: List[int] = []


class JobUpdate(BaseModel):
    customer_id: Optional[int] = None
    estimate_id: Optional[int] = None
    status: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    crew_id: Optional[int] = None
    total: Optional[float] = None
    notes: Optional[str] = None


class JobCompleteRequest(BaseModel):
    invoice_tax: float = 0.0
    invoice_due_date: Optional[datetime] = None
    invoice_notes: str = ""


class JobEquipmentAssign(BaseModel):
    equipment_id: int


class JobOut(JobBase):
    id: int
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    tasks: List[JobTaskOut] = []
    equipment_ids: List[int] = []

    class Config:
        from_attributes = True


class InvoiceBase(BaseModel):
    customer_id: int
    job_id: int
    status: str = "unpaid"
    subtotal: float = 0.0
    tax: float = 0.0
    total: float = 0.0
    issued_at: Optional[datetime] = None
    due_date: Optional[datetime] = None
    notes: str = ""


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    total: Optional[float] = None
    issued_at: Optional[datetime] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None


class PaymentBase(BaseModel):
    invoice_id: int
    amount: float
    method: str = "other"
    paid_at: Optional[datetime] = None
    note: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    method: Optional[str] = None
    paid_at: Optional[datetime] = None
    note: Optional[str] = None


class PaymentOut(PaymentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InvoiceOut(InvoiceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    payments: List[PaymentOut] = []

    class Config:
        from_attributes = True


class CrewMemberBase(BaseModel):
    user_id: int


class CrewMemberCreate(CrewMemberBase):
    pass


class CrewMemberOut(CrewMemberBase):
    id: int
    created_at: datetime
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True


class CrewBase(BaseModel):
    name: str
    type: str = "GTC"
    color: Optional[str] = None
    notes: str = ""


class CrewCreate(CrewBase):
    member_ids: List[int] = []


class CrewUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    color: Optional[str] = None
    notes: Optional[str] = None
    member_ids: Optional[List[int]] = None


class CrewOut(CrewBase):
    id: int
    created_at: datetime
    updated_at: datetime
    members: List[CrewMemberOut] = []

    class Config:
        from_attributes = True


class EquipmentBase(BaseModel):
    name: str
    type: str = ""
    status: str = "available"
    notes: str = ""


class EquipmentCreate(EquipmentBase):
    pass


class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class EquipmentOut(EquipmentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AttachmentCreate(BaseModel):
    entity_type: str
    entity_id: int
    url: str
    caption: Optional[str] = None


class AttachmentOut(AttachmentCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SettingsOut(BaseModel):
    id: int
    company_name: str
    company_logo_url: str
    default_tax_rate: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    company_logo_url: Optional[str] = None
    default_tax_rate: Optional[float] = None


class DashboardOut(BaseModel):
    todays_jobs: int
    upcoming_jobs: int
    open_estimates: int
    unpaid_invoices: int
    month_revenue: float
    jobs_completed: int
    avg_job_value: float


class RevenueReportOut(BaseModel):
    start: datetime
    end: datetime
    total_revenue: float


class OutstandingInvoiceOut(BaseModel):
    invoice_id: int
    customer_id: int
    total: float
    balance: float
    status: str


class EstimateConversionOut(BaseModel):
    start: datetime
    end: datetime
    total_estimates: int
    approved_estimates: int
    conversion_rate: float


# AI
class AiEstimateRequest(BaseModel):
    lead_id: Optional[int] = None
    customer_id: Optional[int] = None
    job_description: str
    tree_count: Optional[int] = None
    access_notes: Optional[str] = None
    urgency: Optional[str] = None


class AiNotesRequest(BaseModel):
    raw_notes: str


class AiScheduleRequest(BaseModel):
    estimate_id: int
    preferred_window: str
    crew_options: List[str]
