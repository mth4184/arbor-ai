"""add estimate service_address

Revision ID: 0005_add_estimate_service_address
Revises: 0004_add_invoice_issued_at
Create Date: 2026-01-24
"""
from alembic import op
import sqlalchemy as sa

revision = "0005_add_estimate_service_address"
down_revision = "0004_add_invoice_issued_at"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col["name"] for col in inspector.get_columns("estimates")]
    if "service_address" not in columns:
        op.add_column("estimates", sa.Column("service_address", sa.Text(), nullable=False, server_default=""))
        if bind.dialect.name != "sqlite":
            op.alter_column("estimates", "service_address", server_default=None)


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col["name"] for col in inspector.get_columns("estimates")]
    if "service_address" in columns:
        op.drop_column("estimates", "service_address")
