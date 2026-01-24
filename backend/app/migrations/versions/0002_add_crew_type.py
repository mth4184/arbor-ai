"""add crew type

Revision ID: 0002_add_crew_type
Revises: 0001_initial
Create Date: 2026-01-24
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_add_crew_type"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col["name"] for col in inspector.get_columns("crews")]
    if "type" not in columns:
        op.add_column(
            "crews",
            sa.Column("type", sa.String(length=20), nullable=False, server_default="GTC"),
        )
        if bind.dialect.name != "sqlite":
            op.alter_column("crews", "type", server_default=None)


def downgrade():
    op.drop_column("crews", "type")
