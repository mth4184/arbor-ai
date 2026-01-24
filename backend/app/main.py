from datetime import date, datetime, timedelta

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session

from . import ai, crud, models, schemas
from .db import get_db
from .security import create_access_token, get_current_user, hash_password, require_roles, verify_password

app = FastAPI(title="ArborGold Core")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_or_404(db: Session, model, entity_id: int, label: str):
    entity = db.query(model).filter(model.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail=f"{label} not found")
    return entity


def validate_status(value: str, allowed: set[str], field_name: str):
    if value not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid {field_name} status")


@app.get("/health")
def health():
    return {"ok": True}


# Auth
@app.post("/auth/login", response_model=schemas.TokenOut)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return schemas.TokenOut(access_token=token)


@app.post("/auth/logout")
def logout():
    return {"ok": True}


@app.get("/auth/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user)):
    return user


# Users (admin only)
@app.get("/users", response_model=list[schemas.UserOut], dependencies=[Depends(require_roles(["admin"]))])
def list_users(db: Session = Depends(get_db)):
    return crud.list_users(db)


@app.post("/users", response_model=schemas.UserOut, dependencies=[Depends(require_roles(["admin"]))])
def create_user(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = crud.get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use")
    return crud.create_user(
        db,
        name=payload.name,
        email=payload.email,
        role=payload.role,
        password_hash=hash_password(payload.password),
    )


@app.put("/users/{user_id}", response_model=schemas.UserOut, dependencies=[Depends(require_roles(["admin"]))])
def update_user(user_id: int, payload: schemas.UserUpdate, db: Session = Depends(get_db)):
    user = get_or_404(db, models.User, user_id, "User")
    updates = payload.model_dump(exclude_unset=True)
    if "password" in updates:
        updates["password_hash"] = hash_password(updates.pop("password"))
    return crud.update_user(db, user, **updates)


# Customers
@app.post("/customers", response_model=schemas.CustomerOut)
def create_customer(payload: schemas.CustomerCreate, db: Session = Depends(get_db)):
    return crud.create_customer(db, **payload.model_dump())


@app.get("/customers", response_model=list[schemas.CustomerOut])
def list_customers(
    q: str | None = None,
    tag: str | None = None,
    db: Session = Depends(get_db),
):
    return crud.list_customers(db, q=q, tag=tag)


@app.get("/customers/{customer_id}", response_model=schemas.CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    return get_or_404(db, models.Customer, customer_id, "Customer")


@app.put("/customers/{customer_id}", response_model=schemas.CustomerOut)
def update_customer(customer_id: int, payload: schemas.CustomerUpdate, db: Session = Depends(get_db)):
    customer = get_or_404(db, models.Customer, customer_id, "Customer")
    return crud.update_customer(db, customer, **payload.model_dump(exclude_unset=True))


# Leads
@app.post("/leads", response_model=schemas.LeadOut)
def create_lead(payload: schemas.LeadCreate, db: Session = Depends(get_db)):
    get_or_404(db, models.Customer, payload.customer_id, "Customer")
    return crud.create_lead(db, **payload.model_dump())


@app.get("/leads", response_model=list[schemas.LeadOut])
def list_leads(
    q: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    customer_id: int | None = None,
    db: Session = Depends(get_db),
):
    return crud.list_leads(db, q=q, status=status_filter, customer_id=customer_id)


@app.get("/leads/{lead_id}", response_model=schemas.LeadOut)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    return get_or_404(db, models.Lead, lead_id, "Lead")


@app.put("/leads/{lead_id}", response_model=schemas.LeadOut)
def update_lead(lead_id: int, payload: schemas.LeadUpdate, db: Session = Depends(get_db)):
    lead = get_or_404(db, models.Lead, lead_id, "Lead")
    updates = payload.model_dump(exclude_unset=True)
    if updates.get("status"):
        validate_status(updates["status"], {"new", "contacted", "qualified", "lost"}, "lead")
    return crud.update_lead(db, lead, **updates)


# Estimates
@app.post("/estimates", response_model=schemas.EstimateOut)
def create_estimate(payload: schemas.EstimateCreate, db: Session = Depends(get_db)):
    get_or_404(db, models.Customer, payload.customer_id, "Customer")
    if payload.lead_id:
        lead = get_or_404(db, models.Lead, payload.lead_id, "Lead")
        if lead.customer_id != payload.customer_id:
            raise HTTPException(status_code=400, detail="Lead does not match customer")
    validate_status(payload.status, {"draft", "sent", "approved", "rejected"}, "estimate")
    if payload.status == "sent" and payload.sent_at is None:
        payload = payload.model_copy(update={"sent_at": datetime.utcnow()})
    if payload.status == "approved" and payload.approved_at is None:
        payload = payload.model_copy(update={"approved_at": datetime.utcnow()})
    return crud.create_estimate(db, payload, payload.line_items)


@app.get("/estimates", response_model=list[schemas.EstimateOut])
def list_estimates(
    q: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    customer_id: int | None = None,
    db: Session = Depends(get_db),
):
    return crud.list_estimates(db, q=q, status=status_filter, customer_id=customer_id)


@app.get("/estimates/{estimate_id}", response_model=schemas.EstimateOut)
def get_estimate(estimate_id: int, db: Session = Depends(get_db)):
    return get_or_404(db, models.Estimate, estimate_id, "Estimate")


@app.put("/estimates/{estimate_id}", response_model=schemas.EstimateOut)
def update_estimate(estimate_id: int, payload: schemas.EstimateUpdate, db: Session = Depends(get_db)):
    estimate = get_or_404(db, models.Estimate, estimate_id, "Estimate")
    updates = payload.model_dump(exclude_unset=True)
    updates.pop("line_items", None)
    if updates.get("status"):
        validate_status(updates["status"], {"draft", "sent", "approved", "rejected"}, "estimate")
        if updates["status"] == "approved" and not estimate.approved_at:
            updates["approved_at"] = datetime.utcnow()
        if updates["status"] == "sent" and not estimate.sent_at:
            updates["sent_at"] = datetime.utcnow()
    return crud.update_estimate(db, estimate, updates, payload.line_items)


@app.post("/estimates/{estimate_id}/convert", response_model=schemas.JobOut)
def convert_estimate_to_job(
    estimate_id: int,
    payload: schemas.EstimateConvertRequest,
    db: Session = Depends(get_db),
):
    estimate = get_or_404(db, models.Estimate, estimate_id, "Estimate")
    if estimate.status != "approved":
        estimate.status = "approved"
        if not estimate.approved_at:
            estimate.approved_at = datetime.utcnow()
    validate_status(payload.status, {"scheduled", "in_progress", "completed", "canceled"}, "job")
    job_payload = schemas.JobCreate(
        customer_id=estimate.customer_id,
        estimate_id=estimate.id,
        status=payload.status,
        scheduled_start=payload.scheduled_start,
        scheduled_end=payload.scheduled_end,
        crew_id=payload.crew_id,
        total=estimate.total,
        notes=payload.notes,
        tasks=payload.tasks,
        equipment_ids=payload.equipment_ids,
    )
    return crud.create_job(db, job_payload, payload.tasks, payload.equipment_ids)


@app.post("/estimates/{estimate_id}/approve-invoice", response_model=schemas.InvoiceOut)
def approve_estimate_and_invoice(
    estimate_id: int,
    payload: schemas.EstimateInvoiceRequest,
    db: Session = Depends(get_db),
):
    estimate = get_or_404(db, models.Estimate, estimate_id, "Estimate")
    if estimate.status != "approved":
        estimate.status = "approved"
        if not estimate.approved_at:
            estimate.approved_at = datetime.utcnow()
    job = (
        db.query(models.Job)
        .filter(models.Job.estimate_id == estimate.id)
        .order_by(models.Job.id.desc())
        .first()
    )
    if not job:
        job = models.Job(
            customer_id=estimate.customer_id,
            estimate_id=estimate.id,
            status="scheduled",
            total=estimate.total,
            notes=estimate.notes,
        )
        db.add(job)
        db.flush()
    if job.invoice:
        db.commit()
        db.refresh(job.invoice)
        return job.invoice

    subtotal = max(estimate.total - estimate.tax, 0.0)
    invoice = models.Invoice(
        customer_id=estimate.customer_id,
        job_id=job.id,
        status="unpaid",
        subtotal=subtotal,
        tax=estimate.tax,
        total=estimate.total,
        issued_at=payload.issued_at or datetime.utcnow(),
        due_date=payload.due_date,
        notes=estimate.notes,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


# Jobs
@app.post("/jobs", response_model=schemas.JobOut)
def create_job(payload: schemas.JobCreate, db: Session = Depends(get_db)):
    get_or_404(db, models.Customer, payload.customer_id, "Customer")
    if payload.estimate_id:
        estimate = get_or_404(db, models.Estimate, payload.estimate_id, "Estimate")
        if estimate.customer_id != payload.customer_id:
            raise HTTPException(status_code=400, detail="Estimate does not match customer")
    if payload.crew_id:
        get_or_404(db, models.Crew, payload.crew_id, "Crew")
    validate_status(payload.status, {"scheduled", "in_progress", "completed", "canceled"}, "job")
    return crud.create_job(db, payload, payload.tasks, payload.equipment_ids)


@app.get("/jobs", response_model=list[schemas.JobOut])
def list_jobs(
    q: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    crew_id: int | None = None,
    customer_id: int | None = None,
    start: datetime | None = None,
    end: datetime | None = None,
    db: Session = Depends(get_db),
):
    return crud.list_jobs(
        db,
        q=q,
        status=status_filter,
        crew_id=crew_id,
        customer_id=customer_id,
        start=start,
        end=end,
    )


@app.get("/jobs/{job_id}", response_model=schemas.JobOut)
def get_job(job_id: int, db: Session = Depends(get_db)):
    return get_or_404(db, models.Job, job_id, "Job")


@app.put("/jobs/{job_id}", response_model=schemas.JobOut)
def update_job(job_id: int, payload: schemas.JobUpdate, db: Session = Depends(get_db)):
    job = get_or_404(db, models.Job, job_id, "Job")
    updates = payload.model_dump(exclude_unset=True)
    if updates.get("status"):
        validate_status(updates["status"], {"scheduled", "in_progress", "completed", "canceled"}, "job")
    return crud.update_job(db, job, **updates)


@app.post("/jobs/{job_id}/tasks", response_model=schemas.JobTaskOut)
def add_job_task(job_id: int, payload: schemas.JobTaskCreate, db: Session = Depends(get_db)):
    job = get_or_404(db, models.Job, job_id, "Job")
    task = models.JobTask(
        job_id=job.id,
        title=payload.title,
        completed=payload.completed,
        sort_order=payload.sort_order,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@app.put("/jobs/{job_id}/tasks/{task_id}", response_model=schemas.JobTaskOut)
def update_job_task(job_id: int, task_id: int, payload: schemas.JobTaskUpdate, db: Session = Depends(get_db)):
    task = get_or_404(db, models.JobTask, task_id, "Task")
    if task.job_id != job_id:
        raise HTTPException(status_code=400, detail="Task does not belong to job")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


@app.delete("/jobs/{job_id}/tasks/{task_id}")
def delete_job_task(job_id: int, task_id: int, db: Session = Depends(get_db)):
    task = get_or_404(db, models.JobTask, task_id, "Task")
    if task.job_id != job_id:
        raise HTTPException(status_code=400, detail="Task does not belong to job")
    db.delete(task)
    db.commit()
    return {"ok": True}


@app.post("/jobs/{job_id}/equipment", response_model=schemas.JobOut)
def assign_job_equipment(job_id: int, payload: schemas.JobEquipmentAssign, db: Session = Depends(get_db)):
    job = get_or_404(db, models.Job, job_id, "Job")
    get_or_404(db, models.Equipment, payload.equipment_id, "Equipment")
    existing = (
        db.query(models.JobEquipment)
        .filter(
            models.JobEquipment.job_id == job.id,
            models.JobEquipment.equipment_id == payload.equipment_id,
        )
        .first()
    )
    if not existing:
        db.add(models.JobEquipment(job_id=job.id, equipment_id=payload.equipment_id))
        db.commit()
    db.refresh(job)
    return job


@app.delete("/jobs/{job_id}/equipment/{equipment_id}", response_model=schemas.JobOut)
def remove_job_equipment(job_id: int, equipment_id: int, db: Session = Depends(get_db)):
    job = get_or_404(db, models.Job, job_id, "Job")
    link = (
        db.query(models.JobEquipment)
        .filter(models.JobEquipment.job_id == job.id, models.JobEquipment.equipment_id == equipment_id)
        .first()
    )
    if link:
        db.delete(link)
        db.commit()
    db.refresh(job)
    return job


@app.post("/jobs/{job_id}/complete", response_model=schemas.InvoiceOut)
def complete_job(job_id: int, payload: schemas.JobCompleteRequest, db: Session = Depends(get_db)):
    job = get_or_404(db, models.Job, job_id, "Job")
    job.status = "completed"
    if not job.completed_at:
        job.completed_at = datetime.utcnow()
    if job.invoice:
        db.commit()
        db.refresh(job.invoice)
        return job.invoice
    subtotal = job.total
    tax = payload.invoice_tax
    total = max(subtotal + tax, 0.0)
    invoice = models.Invoice(
        customer_id=job.customer_id,
        job_id=job.id,
        status="unpaid",
        subtotal=subtotal,
        tax=tax,
        total=total,
        due_date=payload.invoice_due_date,
        notes=payload.invoice_notes,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


# Invoices
@app.post("/invoices", response_model=schemas.InvoiceOut)
def create_invoice(payload: schemas.InvoiceCreate, db: Session = Depends(get_db)):
    job = get_or_404(db, models.Job, payload.job_id, "Job")
    if payload.customer_id != job.customer_id:
        raise HTTPException(status_code=400, detail="Invoice customer does not match job")
    validate_status(payload.status, {"unpaid", "partial", "paid"}, "invoice")
    subtotal = payload.subtotal or job.total
    total = payload.total or max(subtotal + payload.tax, 0.0)
    if payload.issued_at is None:
        payload = payload.model_copy(update={"issued_at": datetime.utcnow()})
    payload = payload.model_copy(update={"subtotal": subtotal, "total": total})
    return crud.create_invoice(db, payload)


@app.get("/invoices", response_model=list[schemas.InvoiceOut])
def list_invoices(
    q: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    customer_id: int | None = None,
    job_id: int | None = None,
    db: Session = Depends(get_db),
):
    return crud.list_invoices(db, q=q, status=status_filter, customer_id=customer_id, job_id=job_id)


@app.get("/invoices/{invoice_id}", response_model=schemas.InvoiceOut)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    return get_or_404(db, models.Invoice, invoice_id, "Invoice")


@app.put("/invoices/{invoice_id}", response_model=schemas.InvoiceOut)
def update_invoice(invoice_id: int, payload: schemas.InvoiceUpdate, db: Session = Depends(get_db)):
    invoice = get_or_404(db, models.Invoice, invoice_id, "Invoice")
    updates = payload.model_dump(exclude_unset=True)
    if updates.get("status"):
        validate_status(updates["status"], {"unpaid", "partial", "paid"}, "invoice")
    if "total" not in updates and ("subtotal" in updates or "tax" in updates):
        subtotal = updates.get("subtotal", invoice.subtotal)
        tax = updates.get("tax", invoice.tax)
        updates["total"] = max(subtotal + tax, 0.0)
    return crud.update_invoice(db, invoice, **updates)


@app.post("/invoices/{invoice_id}/payments", response_model=schemas.InvoiceOut)
def add_payment(invoice_id: int, payload: schemas.PaymentCreate, db: Session = Depends(get_db)):
    invoice = get_or_404(db, models.Invoice, invoice_id, "Invoice")
    if payload.invoice_id != invoice_id:
        raise HTTPException(status_code=400, detail="Payment invoice mismatch")
    payment, invoice = crud.record_payment(db, invoice, payload)
    return invoice


# Crews
@app.post("/crews", response_model=schemas.CrewOut)
def create_crew(payload: schemas.CrewCreate, db: Session = Depends(get_db)):
    if payload.type not in {"GTC", "PHC"}:
        raise HTTPException(status_code=400, detail="Invalid crew type")
    return crud.create_crew(db, payload)


@app.get("/crews", response_model=list[schemas.CrewOut])
def list_crews(db: Session = Depends(get_db)):
    return crud.list_crews(db)


@app.get("/crews/{crew_id}", response_model=schemas.CrewOut)
def get_crew(crew_id: int, db: Session = Depends(get_db)):
    return get_or_404(db, models.Crew, crew_id, "Crew")


@app.put("/crews/{crew_id}", response_model=schemas.CrewOut)
def update_crew(crew_id: int, payload: schemas.CrewUpdate, db: Session = Depends(get_db)):
    crew = get_or_404(db, models.Crew, crew_id, "Crew")
    if payload.type and payload.type not in {"GTC", "PHC"}:
        raise HTTPException(status_code=400, detail="Invalid crew type")
    return crud.update_crew(db, crew, payload)


@app.delete("/crews/{crew_id}")
def delete_crew(crew_id: int, db: Session = Depends(get_db)):
    crew = get_or_404(db, models.Crew, crew_id, "Crew")
    db.delete(crew)
    db.commit()
    return {"ok": True}


# Equipment
@app.post("/equipment", response_model=schemas.EquipmentOut)
def create_equipment(payload: schemas.EquipmentCreate, db: Session = Depends(get_db)):
    return crud.create_equipment(db, payload)


@app.get("/equipment", response_model=list[schemas.EquipmentOut])
def list_equipment(
    q: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    return crud.list_equipment(db, status=status_filter, q=q)


@app.get("/equipment/{equipment_id}", response_model=schemas.EquipmentOut)
def get_equipment(equipment_id: int, db: Session = Depends(get_db)):
    return get_or_404(db, models.Equipment, equipment_id, "Equipment")


@app.put("/equipment/{equipment_id}", response_model=schemas.EquipmentOut)
def update_equipment(equipment_id: int, payload: schemas.EquipmentUpdate, db: Session = Depends(get_db)):
    equipment = get_or_404(db, models.Equipment, equipment_id, "Equipment")
    return crud.update_equipment(db, equipment, payload)


@app.delete("/equipment/{equipment_id}")
def delete_equipment(equipment_id: int, db: Session = Depends(get_db)):
    equipment = get_or_404(db, models.Equipment, equipment_id, "Equipment")
    db.delete(equipment)
    db.commit()
    return {"ok": True}


# Attachments
@app.post("/attachments", response_model=schemas.AttachmentOut)
def create_attachment(payload: schemas.AttachmentCreate, db: Session = Depends(get_db)):
    return crud.create_attachment(db, payload)


@app.get("/attachments", response_model=list[schemas.AttachmentOut])
def list_attachments(entity_type: str, entity_id: int, db: Session = Depends(get_db)):
    return crud.list_attachments(db, entity_type, entity_id)


# Calendar
@app.get("/calendar", response_model=list[schemas.JobOut])
def calendar(
    start: datetime | None = None,
    end: datetime | None = None,
    db: Session = Depends(get_db),
):
    return crud.list_jobs(db, start=start, end=end)


# Reports
@app.get("/reports/revenue", response_model=schemas.RevenueReportOut)
def revenue_report(start: datetime, end: datetime, db: Session = Depends(get_db)):
    total = (
        db.query(func.coalesce(func.sum(models.Payment.amount), 0.0))
        .filter(models.Payment.paid_at >= start, models.Payment.paid_at <= end)
        .scalar()
    )
    return schemas.RevenueReportOut(start=start, end=end, total_revenue=total or 0.0)


@app.get("/reports/outstanding-invoices", response_model=list[schemas.OutstandingInvoiceOut])
def outstanding_invoices(db: Session = Depends(get_db)):
    invoices = db.query(models.Invoice).filter(models.Invoice.status != "paid").all()
    results = []
    for inv in invoices:
        paid = sum(p.amount for p in inv.payments)
        results.append(
            schemas.OutstandingInvoiceOut(
                invoice_id=inv.id,
                customer_id=inv.customer_id,
                total=inv.total,
                balance=max(inv.total - paid, 0.0),
                status=inv.status,
            )
        )
    return results


@app.get("/reports/estimate-conversion", response_model=schemas.EstimateConversionOut)
def estimate_conversion(start: datetime, end: datetime, db: Session = Depends(get_db)):
    total = (
        db.query(func.count(models.Estimate.id))
        .filter(models.Estimate.created_at >= start, models.Estimate.created_at <= end)
        .scalar()
    )
    approved = (
        db.query(func.count(models.Estimate.id))
        .filter(
            models.Estimate.created_at >= start,
            models.Estimate.created_at <= end,
            models.Estimate.status == "approved",
        )
        .scalar()
    )
    total = total or 0
    approved = approved or 0
    rate = (approved / total) if total else 0.0
    return schemas.EstimateConversionOut(
        start=start,
        end=end,
        total_estimates=total,
        approved_estimates=approved,
        conversion_rate=rate,
    )


# Dashboard
@app.get("/dashboard", response_model=schemas.DashboardOut)
def dashboard(db: Session = Depends(get_db)):
    today = date.today()
    tomorrow = today + timedelta(days=1)
    month_start = date(today.year, today.month, 1)
    todays_jobs = (
        db.query(func.count(models.Job.id))
        .filter(models.Job.scheduled_start >= today, models.Job.scheduled_start < tomorrow)
        .scalar()
    )
    upcoming_jobs = (
        db.query(func.count(models.Job.id))
        .filter(models.Job.scheduled_start >= tomorrow)
        .scalar()
    )
    open_estimates = (
        db.query(func.count(models.Estimate.id))
        .filter(models.Estimate.status.in_(["draft", "sent"]))
        .scalar()
    )
    unpaid_invoices = (
        db.query(func.count(models.Invoice.id))
        .filter(models.Invoice.status.in_(["unpaid", "partial"]))
        .scalar()
    )
    month_revenue = (
        db.query(func.coalesce(func.sum(models.Payment.amount), 0.0))
        .filter(models.Payment.paid_at >= month_start)
        .scalar()
    )
    jobs_completed = (
        db.query(func.count(models.Job.id))
        .filter(models.Job.status == "completed", models.Job.completed_at >= month_start)
        .scalar()
    )
    avg_job_value = (
        db.query(func.coalesce(func.avg(models.Job.total), 0.0))
        .filter(models.Job.status == "completed", models.Job.completed_at >= month_start)
        .scalar()
    )
    return schemas.DashboardOut(
        todays_jobs=todays_jobs or 0,
        upcoming_jobs=upcoming_jobs or 0,
        open_estimates=open_estimates or 0,
        unpaid_invoices=unpaid_invoices or 0,
        month_revenue=month_revenue or 0.0,
        jobs_completed=jobs_completed or 0,
        avg_job_value=avg_job_value or 0.0,
    )


# Settings
@app.get("/settings", response_model=schemas.SettingsOut)
def get_settings(db: Session = Depends(get_db)):
    return crud.ensure_settings(db)


@app.put("/settings", response_model=schemas.SettingsOut)
def update_settings(payload: schemas.SettingsUpdate, db: Session = Depends(get_db)):
    settings = crud.ensure_settings(db)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings


# AI endpoints
@app.post("/ai/estimate")
def ai_estimate(payload: schemas.AiEstimateRequest, db: Session = Depends(get_db)):
    hist = db.query(models.Estimate).order_by(models.Estimate.id.desc()).limit(50).all()
    historical_jobs = [
        {
            "scope": e.scope,
            "hazards": e.hazards,
            "equipment": e.equipment,
            "final_price": e.total,
            "suggested_price": e.suggested_price,
        }
        for e in hist
        if (e.total or 0) > 0
    ]
    return ai.suggest_estimate(payload.model_dump(), historical_jobs)


@app.post("/ai/notes")
def ai_notes(payload: schemas.AiNotesRequest):
    return ai.structure_notes(payload.raw_notes)


@app.post("/ai/schedule")
def ai_schedule(payload: schemas.AiScheduleRequest, db: Session = Depends(get_db)):
    est = db.query(models.Estimate).filter(models.Estimate.id == payload.estimate_id).first()
    if not est:
        raise HTTPException(status_code=404, detail="Estimate not found")
    estimate_dict = {
        "id": est.id,
        "scope": est.scope,
        "hazards": est.hazards,
        "equipment": est.equipment,
        "suggested_price": est.suggested_price,
        "final_price": est.total,
        "status": est.status,
    }
    return ai.suggest_schedule(estimate_dict, payload.preferred_window, payload.crew_options)
