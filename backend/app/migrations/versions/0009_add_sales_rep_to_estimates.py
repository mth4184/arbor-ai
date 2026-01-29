"""add sales rep to estimates

Revision ID: 0009_add_sales_rep_to_estimates
Revises: 0008_add_service_address_job_invoice
Create Date: 2026-01-25
"""
from alembic import op
import sqlalchemy as sa

revision = "0009_add_sales_rep_to_estimates"
down_revision = "0008_add_service_address_job_invoice"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col["name"] for col in inspector.get_columns("estimates")]
    if "sales_rep_id" not in columns:
        op.add_column("estimates", sa.Column("sales_rep_id", sa.Integer(), nullable=True))


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col["name"] for col in inspector.get_columns("estimates")]
    if "sales_rep_id" in columns:
        op.drop_column("estimates", "sales_rep_id")
