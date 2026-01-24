"""add sales reps

Revision ID: 0006_add_sales_reps
Revises: 0005_add_estimate_service_address
Create Date: 2026-01-24
"""
from alembic import op
import sqlalchemy as sa

revision = "0006_add_sales_reps"
down_revision = "0005_add_estimate_service_address"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    tables = inspector.get_table_names()
    if "sales_reps" not in tables:
        op.create_table(
            "sales_reps",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(length=200), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=False),
            sa.Column("phone", sa.String(length=50), nullable=False),
            sa.Column("notes", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
        )

    columns = [col["name"] for col in inspector.get_columns("jobs")]
    if "sales_rep_id" not in columns:
        op.add_column("jobs", sa.Column("sales_rep_id", sa.Integer(), nullable=True))


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col["name"] for col in inspector.get_columns("jobs")]
    if "sales_rep_id" in columns:
        op.drop_column("jobs", "sales_rep_id")
    tables = inspector.get_table_names()
    if "sales_reps" in tables:
        op.drop_table("sales_reps")
