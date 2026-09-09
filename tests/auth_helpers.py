import hashlib
import hmac
import json
import time
from urllib.parse import urlencode

TEST_BOT_TOKEN = "123456:TEST_BOT_TOKEN"


def make_init_data(
    user_id: int = 1001,
    *,
    auth_date: int | None = None,
    username: str | None = None,
    token: str | None = None,
    user_json: str | None = None,
    omit: set[str] | None = None,
    extra: dict[str, str] | None = None,
    include_hash: bool = True,
    first_name: str = "Test",
) -> str:
    token = TEST_BOT_TOKEN if token is None else token
    if user_json is None:
        user_obj: dict = {"id": user_id, "first_name": first_name}
        if username is not None:
            user_obj["username"] = username
        user_json = json.dumps(user_obj, separators=(",", ":"))
    fields: dict[str, str] = {
        "auth_date": str(int(time.time()) if auth_date is None else auth_date),
        "query_id": "AAEtestquery",
        "user": user_json,
    }
    if extra:
        fields.update(extra)
    if omit:
        for key in omit:
            fields.pop(key, None)
    if include_hash:
        data_check = "\n".join(f"{key}={value}" for key, value in sorted(fields.items()))
        secret = hmac.new(b"WebAppData", token.encode("utf-8"), hashlib.sha256).digest()
        fields["hash"] = hmac.new(secret, data_check.encode("utf-8"), hashlib.sha256).hexdigest()
    return urlencode(fields)


def tma_headers(user_id: int = 1001, **kwargs) -> dict[str, str]:
    return {"Authorization": f"tma {make_init_data(user_id, **kwargs)}"}
