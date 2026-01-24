"""add service_address to jobs and invoices

Revision ID: 0008_add_service_address_job_invoice
Revises: 0007_add_job_types
Create Date: 2026-01-24
"""
from alembic import op
import sqlalchemy as sa

revision = "0008_add_service_address_job_invoice"
down_revision = "0007_add_job_types"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    job_cols = [col["name"] for col in inspector.get_columns("jobs")]
    if "service_address" not in job_cols:
        op.add_column("jobs", sa.Column("service_address", sa.Text(), nullable=False, server_default=""))
        if bind.dialect.name != "sqlite":
            op.alter_column("jobs", "service_address", server_default=None)

    invoice_cols = [col["name"] for col in inspector.get_columns("invoices")]
    if "service_address" not in invoice_cols:
        op.add_column("invoices", sa.Column("service_address", sa.Text(), nullable=False, server_default=""))
        if bind.dialect.name != "sqlite":
            op.alter_column("invoices", "service_address", server_default=None)


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    invoice_cols = [col["name"] for col in inspector.get_columns("invoices")]
    if "service_address" in invoice_cols:
        op.drop_column("invoices", "service_address")
    job_cols = [col["name"] for col in inspector.get_columns("jobs")]
    if "service_address" in job_cols:
        op.drop_column("jobs", "service_address")
