"""add job types

Revision ID: 0007_add_job_types
Revises: 0006_add_sales_reps
Create Date: 2026-01-24
"""
from alembic import op
import sqlalchemy as sa

revision = "0007_add_job_types"
down_revision = "0006_add_sales_reps"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()
    if "job_types" not in tables:
        op.create_table(
            "job_types",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(length=200), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.UniqueConstraint("name", name="uq_job_types_name"),
        )

    columns = [col["name"] for col in inspector.get_columns("jobs")]
    if "job_type_id" not in columns:
        op.add_column("jobs", sa.Column("job_type_id", sa.Integer(), nullable=True))


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col["name"] for col in inspector.get_columns("jobs")]
    if "job_type_id" in columns:
        op.drop_column("jobs", "job_type_id")
    tables = inspector.get_table_names()
    if "job_types" in tables:
        op.drop_table("job_types")
