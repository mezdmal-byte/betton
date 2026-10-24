import math

from app.lmsr import (
    apply_buy,
    cost,
    cost_of_shares,
    max_tip,
    price,
    prices,
    shares_for_cost,
)


def test_initial_binary_prices_are_even():
    q = [0.0, 0.0]
    b = 100.0
    p = prices(q, b)
    assert math.isclose(p[0], 0.5, rel_tol=1e-12)
    assert math.isclose(p[1], 0.5, rel_tol=1e-12)
    assert math.isclose(cost(q, b), b * math.log(2), rel_tol=1e-12)


def test_prices_sum_to_one_after_trade():
    q = [0.0, 0.0]
    b = 50.0
    q, shares, paid = apply_buy(q, b, 0, 10.0)
    p = prices(q, b)
    assert shares > 0
    assert math.isclose(paid, 10.0, rel_tol=1e-9)
    assert math.isclose(sum(p), 1.0, rel_tol=1e-12)
    assert p[0] > p[1]


def test_shares_for_cost_inverts_cost_of_shares():
    q = [12.0, 8.0]
    b = 40.0
    money = 7.5
    x = shares_for_cost(q, b, 1, money)
    back = cost_of_shares(q, b, 1, x)
    assert math.isclose(back, money, rel_tol=1e-9)


def test_price_is_partial_derivative():
    q = [3.0, 5.0]
    b = 25.0
    eps = 1e-6
    analytic = price(q, b, 0)
    numeric = (cost([q[0] + eps, q[1]], b) - cost(q, b)) / eps
    assert math.isclose(analytic, numeric, rel_tol=1e-5)


def test_tip_cap_is_one_percent():
    assert math.isclose(max_tip(200.0), 2.0)
    assert max_tip(-10.0) == 0.0
