from fastapi.testclient import TestClient
from app.maintenance import app


def test_maintenance_has_no_write_routes_and_never_acknowledges_webhook():
    with TestClient(app) as client:
        assert client.get('/health').json()=={'status':'maintenance','writes_enabled':False}
        for path in ['/webhook','/auth/telegram','/ux-v3/events','/markets/1/buy','/markets/1/orders','/orders/1/cancel']:
            response=client.post(path,json={})
            assert response.status_code==503
            assert response.headers['retry-after']=='60'
        for path in ['/','/v2/','/ready','/.env','/static/miniapp.html']:
            assert client.get(path).status_code==503
