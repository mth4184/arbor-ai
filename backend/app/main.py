from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .db import Base, engine, get_db
from . import crud, schemas, models, ai

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Arbor AI MVP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

# CRUD
@app.post("/leads", response_model=schemas.LeadOut)
def create_lead(payload: schemas.LeadCreate, db: Session = Depends(get_db)):
    return crud.create_lead(db, **payload.model_dump())

@app.get("/leads", response_model=list[schemas.LeadOut])
def list_leads(db: Session = Depends(get_db)):
    return crud.list_leads(db)

@app.post("/estimates", response_model=schemas.EstimateOut)
def create_estimate(payload: schemas.EstimateCreate, db: Session = Depends(get_db)):
    return crud.create_estimate(db, **payload.model_dump())

@app.get("/estimates", response_model=list[schemas.EstimateOut])
def list_estimates(db: Session = Depends(get_db)):
    return crud.list_estimates(db)

@app.post("/jobs", response_model=schemas.JobOut)
def create_job(payload: schemas.JobCreate, db: Session = Depends(get_db)):
    return crud.create_job(db, **payload.model_dump())

@app.get("/jobs", response_model=list[schemas.JobOut])
def list_jobs(db: Session = Depends(get_db)):
    return crud.list_jobs(db)

@app.post("/invoices", response_model=schemas.InvoiceOut)
def create_invoice(payload: schemas.InvoiceCreate, db: Session = Depends(get_db)):
    return crud.create_invoice(db, **payload.model_dump())

@app.get("/invoices", response_model=list[schemas.InvoiceOut])
def list_invoices(db: Session = Depends(get_db)):
    return crud.list_invoices(db)

# AI endpoints
@app.post("/ai/estimate")
def ai_estimate(payload: schemas.AiEstimateRequest, db: Session = Depends(get_db)):
    # pull lightweight "historical jobs" from estimates table as pricing context
    hist = db.query(models.Estimate).order_by(models.Estimate.id.desc()).limit(50).all()
    historical_jobs = [
        {
            "scope": e.scope,
            "hazards": e.hazards,
            "equipment": e.equipment,
            "final_price": e.final_price,
            "suggested_price": e.suggested_price,
        }
        for e in hist
        if (e.final_price or 0) > 0
    ]

    result = ai.suggest_estimate(payload.model_dump(), historical_jobs)
    return result

@app.post("/ai/notes")
def ai_notes(payload: schemas.AiNotesRequest):
    return ai.structure_notes(payload.raw_notes)

@app.post("/ai/schedule")
def ai_schedule(payload: schemas.AiScheduleRequest, db: Session = Depends(get_db)):
    est = db.query(models.Estimate).filter(models.Estimate.id == payload.estimate_id).first()
    if not est:
        return {"error": "Estimate not found"}

    estimate_dict = {
        "id": est.id,
        "scope": est.scope,
        "hazards": est.hazards,
        "equipment": est.equipment,
        "suggested_price": est.suggested_price,
        "final_price": est.final_price,
        "status": est.status,
    }
    return ai.suggest_schedule(estimate_dict, payload.preferred_window, payload.crew_options)
