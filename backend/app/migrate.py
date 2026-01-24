import os
from sqlalchemy import create_engine, inspect
from alembic import command
from alembic.config import Config


def run_migrations():
    database_url = os.getenv("DATABASE_URL", "sqlite:////data/app.db")
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    engine = create_engine(database_url, connect_args=connect_args)
    inspector = inspect(engine)
    tables = inspector.get_table_names()

    config_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
    alembic_cfg = Config(config_path)
    alembic_cfg.set_main_option("sqlalchemy.url", database_url)

    if tables and "alembic_version" not in tables:
        # Existing schema without Alembic history. Stamp to avoid create_table clashes.
        command.stamp(alembic_cfg, "head")
        return

    command.upgrade(alembic_cfg, "head")


if __name__ == "__main__":
    run_migrations()
