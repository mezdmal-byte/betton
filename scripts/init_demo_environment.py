"""Initialize only a NEW dedicated demo database before starting the server.

Never clears data. The normal application cannot manufacture this marker via API.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


def main():
    from app.services.demo_guarantors import require_environment, initialize_empty_database
    from app.database import ensure_schema, SessionLocal
    # Fail before create_all/ALTER statements if the environment/name is unsafe.
    require_environment()
    ensure_schema()
    with SessionLocal() as db:
        initialize_empty_database(db)
    print('Empty isolated demo database initialized. No users, balances or events created.')


if __name__ == '__main__':
    main()
