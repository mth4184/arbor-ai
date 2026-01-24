from app import models


def test_complete_job_creates_invoice(client, db_session):
    customer = models.Customer(
        name="Workflow Customer",
        company_name=None,
        phone="555-2222",
        email="workflow@example.com",
        billing_address="123 Billing",
        service_address="456 Service",
        notes="Notes",
        tags=[],
    )
    db_session.add(customer)
    db_session.commit()

    job = models.Job(
        customer_id=customer.id,
        status="in_progress",
        total=200.0,
    )
    db_session.add(job)
    db_session.commit()

    response = client.post(f"/jobs/{job.id}/complete", json={"invoice_tax": 20.0})
    assert response.status_code == 200
    payload = response.json()
    assert payload["job_id"] == job.id
    assert payload["total"] == 220.0
