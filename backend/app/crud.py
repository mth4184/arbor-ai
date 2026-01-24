from datetime import datetime
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from . import models


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, name: str, email: str, role: str, password_hash: str):
    user = models.User(name=name, email=email, role=role, password_hash=password_hash)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: models.User, **updates):
    for key, value in updates.items():
        if value is not None and hasattr(user, key):
            setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


def list_users(db: Session):
    return db.query(models.User).order_by(models.User.id.desc()).all()


def create_customer(db: Session, **payload):
    customer = models.Customer(**payload)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def update_customer(db: Session, customer: models.Customer, **updates):
    for key, value in updates.items():
        if value is not None and hasattr(customer, key):
            setattr(customer, key, value)
    db.commit()
    db.refresh(customer)
    return customer


def list_customers(db: Session, q: str | None = None, tag: str | None = None):
    query = db.query(models.Customer)
    if q:
        like = f"%{q.lower()}%"
        query = query.filter(
            or_(
                func.lower(models.Customer.name).like(like),
                func.lower(models.Customer.company_name).like(like),
                func.lower(models.Customer.email).like(like),
            )
        )
    if tag:
        query = query.filter(models.Customer.tags.contains([tag]))
    return query.order_by(models.Customer.id.desc()).all()


def create_lead(db: Session, **payload):
    lead = models.Lead(**payload)
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


def update_lead(db: Session, lead: models.Lead, **updates):
    for key, value in updates.items():
        if value is not None and hasattr(lead, key):
            setattr(lead, key, value)
    db.commit()
    db.refresh(lead)
    return lead


def list_leads(db: Session, q: str | None = None, status: str | None = None, customer_id: int | None = None):
    query = db.query(models.Lead)
    if customer_id:
        query = query.filter(models.Lead.customer_id == customer_id)
    if status:
        query = query.filter(models.Lead.status == status)
    if q:
        like = f"%{q.lower()}%"
        query = query.join(models.Customer).filter(
            or_(
                func.lower(models.Customer.name).like(like),
                func.lower(models.Customer.company_name).like(like),
                func.lower(models.Customer.email).like(like),
            )
        )
    return query.order_by(models.Lead.id.desc()).all()


def _build_line_items(line_items):
    items = []
    for idx, item in enumerate(line_items or []):
        total = item.total or (item.qty * item.unit_price)
        items.append(
            models.EstimateLineItem(
                name=item.name,
                description=item.description,
                qty=item.qty,
                unit_price=item.unit_price,
                total=total,
                sort_order=item.sort_order if item.sort_order is not None else idx,
            )
        )
    return items


def _calculate_total_from_items(line_items, tax: float = 0.0, discount: float = 0.0):
    subtotal = sum((item.total or 0.0) for item in line_items)
    total = max(subtotal + tax - discount, 0.0)
    return subtotal, total


def create_estimate(db: Session, payload, line_items):
    items = _build_line_items(line_items)
    subtotal, total = _calculate_total_from_items(items, payload.tax, payload.discount)
    estimate = models.Estimate(
        customer_id=payload.customer_id,
        lead_id=payload.lead_id,
        status=payload.status,
        scope=payload.scope,
        hazards=payload.hazards,
        equipment=payload.equipment,
        suggested_price=payload.suggested_price,
        total=total if items else payload.total,
        tax=payload.tax,
        discount=payload.discount,
        sent_at=payload.sent_at,
        approved_at=payload.approved_at,
        notes=payload.notes,
        line_items=items,
    )
    db.add(estimate)
    db.commit()
    db.refresh(estimate)
    return estimate


def update_estimate(db: Session, estimate: models.Estimate, payload, line_items):
    for key, value in payload.items():
        if value is not None and hasattr(estimate, key):
            setattr(estimate, key, value)
    if line_items is not None:
        estimate.line_items = _build_line_items(line_items)
        _, total = _calculate_total_from_items(estimate.line_items, estimate.tax, estimate.discount)
        estimate.total = total
    db.commit()
    db.refresh(estimate)
    return estimate


def list_estimates(db: Session, q: str | None = None, status: str | None = None, customer_id: int | None = None):
    query = db.query(models.Estimate)
    if customer_id:
        query = query.filter(models.Estimate.customer_id == customer_id)
    if status:
        query = query.filter(models.Estimate.status == status)
    if q:
        like = f"%{q.lower()}%"
        query = query.join(models.Customer).filter(
            or_(
                func.lower(models.Customer.name).like(like),
                func.lower(models.Customer.company_name).like(like),
            )
        )
    return query.order_by(models.Estimate.id.desc()).all()


def create_job(db: Session, payload, tasks, equipment_ids):
    job = models.Job(
        customer_id=payload.customer_id,
        estimate_id=payload.estimate_id,
        status=payload.status,
        scheduled_start=payload.scheduled_start,
        scheduled_end=payload.scheduled_end,
        crew_id=payload.crew_id,
        total=payload.total,
        notes=payload.notes,
    )
    if payload.status == "completed":
        job.completed_at = datetime.utcnow()
    job.tasks = [
        models.JobTask(title=t.title, completed=t.completed, sort_order=t.sort_order)
        for t in (tasks or [])
    ]
    if equipment_ids:
        job.equipment_links = [
            models.JobEquipment(equipment_id=e_id) for e_id in equipment_ids
        ]
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def update_job(db: Session, job: models.Job, **updates):
    for key, value in updates.items():
        if value is not None and hasattr(job, key):
            setattr(job, key, value)
    if job.status == "completed" and job.completed_at is None:
        job.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(job)
    return job


def list_jobs(
    db: Session,
    q: str | None = None,
    status: str | None = None,
    crew_id: int | None = None,
    customer_id: int | None = None,
    start: datetime | None = None,
    end: datetime | None = None,
):
    query = db.query(models.Job)
    if status:
        query = query.filter(models.Job.status == status)
    if crew_id:
        query = query.filter(models.Job.crew_id == crew_id)
    if customer_id:
        query = query.filter(models.Job.customer_id == customer_id)
    if start:
        query = query.filter(models.Job.scheduled_start >= start)
    if end:
        query = query.filter(models.Job.scheduled_start <= end)
    if q:
        like = f"%{q.lower()}%"
        query = query.join(models.Customer).filter(
            or_(
                func.lower(models.Customer.name).like(like),
                func.lower(models.Customer.company_name).like(like),
            )
        )
    return query.order_by(models.Job.id.desc()).all()


def create_invoice(db: Session, payload):
    invoice = models.Invoice(
        customer_id=payload.customer_id,
        job_id=payload.job_id,
        status=payload.status,
        subtotal=payload.subtotal,
        tax=payload.tax,
        total=payload.total,
        issued_at=payload.issued_at,
        sent_at=payload.sent_at,
        due_date=payload.due_date,
        notes=payload.notes,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


def update_invoice(db: Session, invoice: models.Invoice, **updates):
    for key, value in updates.items():
        if value is not None and hasattr(invoice, key):
            setattr(invoice, key, value)
    db.commit()
    db.refresh(invoice)
    return invoice


def list_invoices(
    db: Session,
    q: str | None = None,
    status: str | None = None,
    customer_id: int | None = None,
    job_id: int | None = None,
):
    query = db.query(models.Invoice)
    if status:
        query = query.filter(models.Invoice.status == status)
    if customer_id:
        query = query.filter(models.Invoice.customer_id == customer_id)
    if job_id:
        query = query.filter(models.Invoice.job_id == job_id)
    if q:
        like = f"%{q.lower()}%"
        query = query.join(models.Customer).filter(
            or_(
                func.lower(models.Customer.name).like(like),
                func.lower(models.Customer.company_name).like(like),
            )
        )
    issued_order = models.Invoice.issued_at.desc()
    if db.bind and db.bind.dialect.name == "sqlite":
        return query.order_by(issued_order, models.Invoice.id.desc()).all()
    return query.order_by(issued_order.nullslast(), models.Invoice.id.desc()).all()


def record_payment(db: Session, invoice: models.Invoice, payload):
    payment = models.Payment(
        invoice_id=invoice.id,
        amount=payload.amount,
        method=payload.method,
        paid_at=payload.paid_at or datetime.utcnow(),
        note=payload.note,
    )
    db.add(payment)
    db.flush()
    total_paid = (
        db.query(func.coalesce(func.sum(models.Payment.amount), 0.0))
        .filter(models.Payment.invoice_id == invoice.id)
        .scalar()
    )
    if total_paid >= invoice.total:
        invoice.status = "paid"
    elif total_paid > 0:
        invoice.status = "partial"
    db.commit()
    db.refresh(invoice)
    return payment, invoice


def create_crew(db: Session, payload):
    crew = models.Crew(name=payload.name, type=payload.type, color=payload.color, notes=payload.notes)
    if payload.member_ids:
        crew.members = [models.CrewMember(user_id=uid) for uid in payload.member_ids]
    db.add(crew)
    db.commit()
    db.refresh(crew)
    return crew


def update_crew(db: Session, crew: models.Crew, payload):
    for key in ["name", "type", "color", "notes"]:
        value = getattr(payload, key, None)
        if value is not None:
            setattr(crew, key, value)
    if payload.member_ids is not None:
        crew.members = [models.CrewMember(user_id=uid) for uid in payload.member_ids]
    db.commit()
    db.refresh(crew)
    return crew


def list_crews(db: Session):
    return db.query(models.Crew).order_by(models.Crew.id.desc()).all()


def create_equipment(db: Session, payload):
    equipment = models.Equipment(
        name=payload.name,
        type=payload.type,
        status=payload.status,
        notes=payload.notes,
    )
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    return equipment


def update_equipment(db: Session, equipment: models.Equipment, payload):
    for key in ["name", "type", "status", "notes"]:
        value = getattr(payload, key, None)
        if value is not None:
            setattr(equipment, key, value)
    db.commit()
    db.refresh(equipment)
    return equipment


def list_equipment(db: Session, status: str | None = None, q: str | None = None):
    query = db.query(models.Equipment)
    if status:
        query = query.filter(models.Equipment.status == status)
    if q:
        like = f"%{q.lower()}%"
        query = query.filter(func.lower(models.Equipment.name).like(like))
    return query.order_by(models.Equipment.id.desc()).all()


def create_attachment(db: Session, payload):
    attachment = models.Attachment(
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        url=payload.url,
        caption=payload.caption,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment


def list_attachments(db: Session, entity_type: str, entity_id: int):
    return (
        db.query(models.Attachment)
        .filter(models.Attachment.entity_type == entity_type, models.Attachment.entity_id == entity_id)
        .order_by(models.Attachment.id.desc())
        .all()
    )


def ensure_settings(db: Session):
    settings = db.query(models.Settings).first()
    if not settings:
        settings = models.Settings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings
