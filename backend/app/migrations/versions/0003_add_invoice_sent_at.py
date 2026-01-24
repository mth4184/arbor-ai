"""add invoice sent_at

Revision ID: 0003_add_invoice_sent_at
Revises: 0002_add_crew_type
Create Date: 2026-01-24
"""
from alembic import op
import sqlalchemy as sa

revision = "0003_add_invoice_sent_at"
down_revision = "0002_add_crew_type"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col["name"] for col in inspector.get_columns("invoices")]
    if "sent_at" not in columns:
        op.add_column("invoices", sa.Column("sent_at", sa.DateTime(), nullable=True))


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col["name"] for col in inspector.get_columns("invoices")]
    if "sent_at" in columns:
        op.drop_column("invoices", "sent_at")
