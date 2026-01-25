from sqlalchemy.orm import Session
from . import models

def create_lead(db: Session, name: str, phone: str, address: str, notes: str):
    lead = models.Lead(name=name, phone=phone, address=address, notes=notes)
    db.add(lead); db.commit(); db.refresh(lead)
    return lead

def list_leads(db: Session):
    return db.query(models.Lead).order_by(models.Lead.id.desc()).all()

def create_estimate(db: Session, lead_id: int, scope: str, hazards: str, equipment: str, final_price: float):
    est = models.Estimate(lead_id=lead_id, scope=scope, hazards=hazards, equipment=equipment, final_price=final_price)
    db.add(est); db.commit(); db.refresh(est)
    return est

def list_estimates(db: Session):
    return db.query(models.Estimate).order_by(models.Estimate.id.desc()).all()

def create_job(db: Session, estimate_id: int, scheduled_for: str, crew: str, address: str):
    job = models.Job(estimate_id=estimate_id, scheduled_for=scheduled_for, crew=crew, address=address)
    db.add(job); db.commit(); db.refresh(job)
    return job

def list_jobs(db: Session):
    return db.query(models.Job).order_by(models.Job.id.desc()).all()

def create_invoice(db: Session, job_id: int, amount: float):
    inv = models.Invoice(job_id=job_id, amount=amount)
    db.add(inv); db.commit(); db.refresh(inv)
    return inv

def list_invoices(db: Session):
    return db.query(models.Invoice).order_by(models.Invoice.id.desc()).all()
