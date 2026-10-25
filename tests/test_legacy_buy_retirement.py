from app.config import settings
from tests.test_order_recovery import legacy_ready, totals


def test_unkeyed_buy_rejected_before_any_debit_and_explicit_compatibility(client, monkeypatch):
    mid,a,h,_=legacy_ready(client,monkeypatch)
    monkeypatch.setattr(settings,'allow_unkeyed_legacy_buy',False)
    before=totals(mid,a['id'])
    rejected=client.post(f'/markets/{mid}/buy',headers=h,json={'outcome':0,'money':10})
    assert rejected.status_code==428
    assert 'request_id' in rejected.json()['detail']
    assert totals(mid,a['id'])==before
    monkeypatch.setattr(settings,'allow_unkeyed_legacy_buy',True)
    assert client.post(f'/markets/{mid}/buy',headers=h,json={'outcome':0,'money':10}).status_code==200
    assert totals(mid,a['id'])[0]<before[0]
    monkeypatch.setattr(settings,'allow_unkeyed_legacy_buy',False)
    after=totals(mid,a['id'])
    assert client.post(f'/markets/{mid}/buy',headers=h,json={'outcome':0,'money':10}).status_code==428
    assert totals(mid,a['id'])==after
