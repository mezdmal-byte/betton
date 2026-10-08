"""Insert a pre-guarantor private event to verify backwards-compatible access.
New private creation is tested through the real guarantor workflow separately.
"""

import secrets
from app.database import SessionLocal
from app.models import Market, MarketStatus


def legacy_private(client, headers, body):
    response = client.post(
        "/markets", headers=headers, json={**body, "visibility": "public"}
    )
    assert response.status_code == 200, response.text
    mid = response.json()["id"]
    with SessionLocal() as db:
        market = db.get(Market, mid)
        market.visibility = "unlisted"
        market.share_token = secrets.token_urlsafe(24)
        market.status = MarketStatus.open
        db.commit()
    return client.get(f"/markets/{mid}", headers=headers)
