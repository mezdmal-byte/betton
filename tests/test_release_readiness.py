from app import main
from app.config import settings
from app.database import SessionLocal
from app.migrations import CURRENT_REVISION
from sqlalchemy import text


def test_readiness_checks_schema_and_secret_without_changing_money(client,monkeypatch):
    monkeypatch.setattr(settings,'telegram_webhook_secret','a'*43)
    response=client.get('/ready')
    assert response.status_code==200
    assert response.json()['schema_revision']==CURRENT_REVISION
    monkeypatch.setattr(settings,'telegram_webhook_secret','')
    assert client.get('/ready').status_code==503
    monkeypatch.setattr(settings,'telegram_webhook_secret','a'*43)
    with SessionLocal() as db:
        db.execute(text('UPDATE betton_schema_version SET revision=999 WHERE id=1'));db.commit()
    try: assert client.get('/ready').status_code==503
    finally:
        with SessionLocal() as db:
            db.execute(text('UPDATE betton_schema_version SET revision=:v WHERE id=1'),{'v':CURRENT_REVISION});db.commit()


def test_readiness_database_failure_does_not_expose_details(client):
    class Broken:
        def execute(self,*args,**kwargs): raise RuntimeError('synthetic-secret-must-not-leak')
    main.app.dependency_overrides[main.get_db]=lambda:Broken()
    try:
        response=client.get('/ready')
        assert response.status_code==503
        assert response.json()=={'status':'not_ready'}
    finally: main.app.dependency_overrides.pop(main.get_db)
