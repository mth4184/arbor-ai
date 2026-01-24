from app import crud, models, schemas


def test_estimate_total_calculation(db_session):
    customer = models.Customer(
        name="Test Customer",
        company_name="Test Co",
        phone="555-0001",
        email="test@example.com",
        billing_address="123 Billing",
        service_address="456 Service",
        notes="Notes",
        tags=["priority"],
    )
    db_session.add(customer)
    db_session.commit()

    payload = schemas.EstimateCreate(
        customer_id=customer.id,
        status="draft",
        tax=10.0,
        discount=5.0,
        line_items=[
            schemas.EstimateLineItemCreate(name="Item A", qty=1, unit_price=100.0, total=100.0),
            schemas.EstimateLineItemCreate(name="Item B", qty=2, unit_price=50.0, total=100.0),
        ],
    )
    estimate = crud.create_estimate(db_session, payload, payload.line_items)
    assert estimate.total == 205.0
