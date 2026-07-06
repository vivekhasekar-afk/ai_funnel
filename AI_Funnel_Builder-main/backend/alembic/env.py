from logging.config import fileConfig
import os
import sys

from sqlalchemy import engine_from_config, pool
from alembic import context

# ✅ Make sure "app" is importable
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# ✅ Load Alembic Config
config = context.config

# ✅ Logging setup
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ✅ Import your SQLAlchemy Base
from app.core.database import Base
from app.core.config import settings

# ✅ Tell Alembic where models are
target_metadata = Base.metadata


# ✅ Use DATABASE_URL from .env instead of hardcoded value
def get_url():
    return str(settings.DATABASE_URL)


def run_migrations_offline():
    """Run migrations in offline mode."""
    url = get_url()

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in online mode."""
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
