"""Integer monetary storage; floats are confined to LMSR math and display."""
from decimal import Decimal, ROUND_DOWN, ROUND_HALF_EVEN, localcontext

from fastapi import HTTPException
from sqlalchemy import text

NANO = 1_000_000_000
MAX_NANO = 2**63 - 1


def to_nano(value, *, rounding=ROUND_HALF_EVEN):
    try:
        amount = Decimal(str(value))
        if not amount.is_finite() or abs(amount) > Decimal(MAX_NANO) / NANO:
            raise ValueError()
        with localcontext() as ctx:
            ctx.prec = 80
            result = int((amount * NANO).to_integral_value(rounding=rounding))
        if abs(result) > MAX_NANO:
            raise ValueError()
        return result
    except (ValueError, ArithmeticError):
        raise HTTPException(422, 'Некорректная денежная сумма') from None


def nonnegative_nano(value):
    result = to_nano(value)
    if Decimal(str(value)) < 0:
        raise HTTPException(422, 'Денежная сумма не может быть отрицательной')
    return result


def as_ton(nano):
    if nano is None:
        raise RuntimeError('Integer money migration required')
    return nano / NANO


def tip_nano(profit_nano, rate=0.01):
    rate = Decimal(str(rate))
    if not rate.is_finite() or not 0 <= rate <= Decimal('0.01'):
        raise HTTPException(422, 'Некорректная доля чаевых')
    return int((max(0, profit_nano) * rate).to_integral_value(rounding=ROUND_DOWN))


def adjust_balance_nano(db, user_id, delta, detail='Недостаточно средств'):
    if not isinstance(delta, int) or abs(delta) > MAX_NANO:
        raise HTTPException(422, 'Некорректная денежная сумма')
    if not delta:
        return
    # Bound before addition: SQLite would otherwise promote overflowing INTEGER
    # arithmetic to REAL. SQL increment also prevents lost updates.
    result = db.execute(text(
        'UPDATE users SET balance_nano = balance_nano + :delta '
        'WHERE id = :id AND balance_nano >= :low AND balance_nano <= :high'),
        dict(delta=delta, id=user_id, low=max(0, -delta), high=MAX_NANO-max(0, delta)))
    if result.rowcount != 1:
        raise HTTPException(409 if delta > 0 else 400, detail)
    from app.models import User
    user = db.get(User, user_id)
    if user is not None:
        db.expire(user)


def add_pot_nano(market, delta):
    value = market.pot_nano + delta
    if not isinstance(value, int) or not 0 <= value <= MAX_NANO:
        raise HTTPException(409, 'Недопустимый остаток банка')
    market.pot_nano = value
