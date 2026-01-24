import random
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from . import models
from .db import SessionLocal
from .security import hash_password


def clear_data(db: Session):
    for model in [
        models.Attachment,
        models.Payment,
        models.Invoice,
        models.JobEquipment,
        models.JobTask,
        models.Job,
        models.EstimateLineItem,
        models.Estimate,
        models.Lead,
        models.CrewMember,
        models.Crew,
        models.Equipment,
        models.Customer,
        models.User,
        models.Settings,
    ]:
        db.query(model).delete()
    db.commit()


def seed_db():
    random.seed(7)
    db = SessionLocal()
    clear_data(db)

    settings = models.Settings(company_name="ArborGold Demo", default_tax_rate=0.07)
    db.add(settings)

    users = [
        models.User(
            name="Alex Admin",
            email="admin@arborgold.demo",
            role="admin",
            password_hash=hash_password("password123"),
        ),
        models.User(
            name="Olivia Office",
            email="office@arborgold.demo",
            role="office",
            password_hash=hash_password("password123"),
        ),
        models.User(
            name="Casey Crew",
            email="crew@arborgold.demo",
            role="crew",
            password_hash=hash_password("password123"),
        ),
    ]
    db.add_all(users)
    db.flush()

    crews = [
        models.Crew(name="Evergreen Team", type="GTC", color="#3b7a57"),
        models.Crew(name="Summit Crew", type="PHC", color="#7c5e3b"),
    ]
    db.add_all(crews)
    db.flush()

    sales_reps = [
        models.SalesRep(name="Jordan Sales", email="jordan@arborgold.demo", phone="555-2001"),
        models.SalesRep(name="Taylor Sales", email="taylor@arborgold.demo", phone="555-2002"),
    ]
    db.add_all(sales_reps)
    db.flush()

    db.add_all(
        [
            models.CrewMember(crew_id=crews[0].id, user_id=users[2].id),
            models.CrewMember(crew_id=crews[1].id, user_id=users[1].id),
        ]
    )

    equipment_items = [
        models.Equipment(name="Bucket Truck", type="truck", status="available"),
        models.Equipment(name="Chipper 9000", type="chipper", status="available"),
        models.Equipment(name="Stump Grinder", type="grinder", status="maintenance"),
        models.Equipment(name="Climbing Kit", type="gear", status="available"),
        models.Equipment(name="Mini Skid Steer", type="loader", status="in_use"),
        models.Equipment(name="Chainsaw Kit", type="gear", status="available"),
    ]
    db.add_all(equipment_items)
    db.flush()

    customer_names = [
        "Pinecrest HOA",
        "Riverbend Estates",
        "Mason Family",
        "Willow Creek Church",
        "Oakline Retail",
        "Harper Residence",
        "Summit View Apartments",
        "Greenridge School",
        "Lakeside Cafe",
        "Stonebrook Farms",
    ]
    customers = []
    for idx, name in enumerate(customer_names, start=1):
        customers.append(
            models.Customer(
                name=name,
                company_name=None if "Family" in name or "Residence" in name else name,
                phone=f"555-010{idx}",
                email=f"contact{idx}@example.com",
                billing_address=f"{100+idx} Maple Ave",
                service_address=f"{200+idx} Pine St",
                notes="Seasonal pruning request.",
                tags=["priority"] if idx % 3 == 0 else ["standard"],
            )
        )
    db.add_all(customers)
    db.flush()

    leads = []
    for customer in customers:
        leads.append(
            models.Lead(
                customer_id=customer.id,
                source=random.choice(["referral", "website", "yard sign", "storm"]),
                status=random.choice(["new", "contacted", "qualified"]),
                notes="Initial inquiry logged.",
            )
        )
    db.add_all(leads)
    db.flush()

    estimates = []
    for i in range(15):
        customer = random.choice(customers)
        lead = random.choice(leads)
        status = random.choice(["draft", "sent", "approved", "rejected"])
        line_items = [
            models.EstimateLineItem(
                name="Tree removal",
                description="Remove hazard tree near driveway",
                qty=1,
                unit_price=750.0,
                total=750.0,
                sort_order=0,
            ),
            models.EstimateLineItem(
                name="Stump grind",
                description="Grind stump to 6 inches",
                qty=1,
                unit_price=180.0,
                total=180.0,
                sort_order=1,
            ),
        ]
        subtotal = sum(item.total for item in line_items)
        tax = round(subtotal * 0.07, 2)
        discount = 0.0 if status != "draft" else 50.0
        estimate = models.Estimate(
            customer_id=customer.id,
            lead_id=lead.id,
            status=status,
            service_address=customer.service_address,
            scope="Remove two mature oaks",
            hazards="Utility lines on north side",
            equipment="Bucket truck, chipper",
            suggested_price=subtotal + tax,
            total=subtotal + tax - discount,
            tax=tax,
            discount=discount,
            sent_at=datetime.utcnow() - timedelta(days=random.randint(1, 15)) if status != "draft" else None,
            approved_at=datetime.utcnow() - timedelta(days=random.randint(1, 10)) if status == "approved" else None,
            notes="Customer reviewing proposal.",
            line_items=line_items,
        )
        estimates.append(estimate)
    db.add_all(estimates)
    db.flush()

    jobs = []
    for i in range(10):
        estimate = random.choice(estimates)
        customer = db.query(models.Customer).filter(models.Customer.id == estimate.customer_id).first()
        crew = random.choice(crews)
        start = datetime.utcnow() + timedelta(days=random.randint(-2, 12))
        job = models.Job(
            customer_id=customer.id,
            estimate_id=estimate.id,
            status=random.choice(["scheduled", "in_progress", "completed"]),
            scheduled_start=start,
            scheduled_end=start + timedelta(hours=6),
            crew_id=crew.id,
            sales_rep_id=random.choice(sales_reps).id if sales_reps else None,
            service_address=customer.service_address,
            total=estimate.total,
            notes="Ensure permits on file.",
            completed_at=start + timedelta(hours=6) if random.random() > 0.6 else None,
        )
        job.tasks = [
            models.JobTask(title="Site prep", completed=random.random() > 0.4, sort_order=0),
            models.JobTask(title="Tree removal", completed=random.random() > 0.4, sort_order=1),
            models.JobTask(title="Cleanup", completed=random.random() > 0.4, sort_order=2),
        ]
        job.equipment_links = [
            models.JobEquipment(equipment_id=random.choice(equipment_items).id)
            for _ in range(2)
        ]
        jobs.append(job)
    db.add_all(jobs)
    db.flush()

    invoices = []
    for job in jobs[:8]:
        subtotal = job.total
        tax = round(subtotal * 0.07, 2)
        total = subtotal + tax
        invoice = models.Invoice(
            customer_id=job.customer_id,
            job_id=job.id,
            status="unpaid",
            subtotal=subtotal,
            tax=tax,
            total=total,
            issued_at=datetime.utcnow() - timedelta(days=random.randint(1, 7)),
            service_address=job.service_address,
            due_date=datetime.utcnow() + timedelta(days=30),
            notes="Net 30",
        )
        invoices.append(invoice)
    db.add_all(invoices)
    db.flush()

    payments = []
    for invoice in invoices[:5]:
        amount = invoice.total if random.random() > 0.5 else round(invoice.total * 0.5, 2)
        payment = models.Payment(
            invoice_id=invoice.id,
            amount=amount,
            method=random.choice(["check", "card", "ach"]),
            paid_at=datetime.utcnow() - timedelta(days=random.randint(0, 5)),
            note="Deposit received",
        )
        payments.append(payment)
        invoice.status = "paid" if amount >= invoice.total else "partial"
    db.add_all(payments)

    attachments = [
        models.Attachment(
            entity_type="job",
            entity_id=jobs[0].id,
            url="https://images.unsplash.com/photo-1501004318641-b39e6451bec6",
            caption="Before work",
        ),
        models.Attachment(
            entity_type="estimate",
            entity_id=estimates[0].id,
            url="https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
            caption="Site photo",
        ),
    ]
    db.add_all(attachments)

    db.commit()
    db.close()


if __name__ == "__main__":
    seed_db()
