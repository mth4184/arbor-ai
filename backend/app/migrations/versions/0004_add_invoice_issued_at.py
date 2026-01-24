"""add invoice issued_at

Revision ID: 0004_add_invoice_issued_at
Revises: 0003_add_invoice_sent_at
Create Date: 2026-01-24
"""
from alembic import op
import sqlalchemy as sa

revision = "0004_add_invoice_issued_at"
down_revision = "0003_add_invoice_sent_at"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col["name"] for col in inspector.get_columns("invoices")]
    if "issued_at" not in columns:
        op.add_column("invoices", sa.Column("issued_at", sa.DateTime(), nullable=True))


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col["name"] for col in inspector.get_columns("invoices")]
    if "issued_at" in columns:
        op.drop_column("invoices", "issued_at")
