from itertools import product
from types import SimpleNamespace

import pytest

from app.services.guarantor_rewards import (
    NANO,
    InsufficientRewardFunding,
    RewardTariff,
    plan_reward,
    funded_outcomes,
)


@pytest.mark.parametrize(
    "mode,fixed,rate,expected",
    [
        ("fixed", 100, 0, 100),
        ("percent", 0, 300, 30),
        ("combined", 100, 300, 130),
        ("percent_minimum", 100, 300, 100),
        ("percent_minimum", 20, 300, 30),
    ],
)
def test_four_event_tariffs(mode, fixed, rate, expected):
    plan = plan_reward(
        {1: 400 * NANO, 2: 600 * NANO}, RewardTariff(mode, fixed * NANO, rate)
    )
    assert plan.reward_nano == expected * NANO
    assert plan.service_fee_nano == 10 * NANO
    assert sum(w.guarantor_reward_nano for w in plan.winners) == expected * NANO
    assert plan.winners[0].guarantor_reward_nano == expected * NANO * 4 // 10


def test_fixed_is_charged_once_not_per_winner():
    plan = plan_reward(
        {uid: 100 * NANO for uid in range(1, 101)}, RewardTariff("fixed", 100 * NANO)
    )
    assert plan.reward_nano == 100 * NANO
    assert all(w.guarantor_reward_nano == NANO for w in plan.winners)


def test_twenty_percent_is_configurable_and_inclusive():
    tariff = RewardTariff("percent", 0, 7900)
    plan = plan_reward({1: 100 * NANO}, tariff)
    assert plan.winners[0].net_profit_nano == 20 * NANO
    with pytest.raises(InsufficientRewardFunding):
        plan_reward({1: 100 * NANO}, tariff, minimum_keep_bps=2001)
    assert plan_reward({1: 100 * NANO}, tariff, minimum_keep_bps=1000)


@pytest.mark.parametrize(
    "tariff",
    [
        RewardTariff("fixed", 100 * NANO),
        RewardTariff("percent", 0, 8000),
        RewardTariff("combined", NANO, 7900),
        RewardTariff("percent_minimum", 100 * NANO, 300),
    ],
)
def test_insufficient_fund_never_borrows_from_balances(tariff):
    with pytest.raises(InsufficientRewardFunding):
        plan_reward({1: 10 * NANO, 2: 10 * NANO}, tariff)


def test_zero_or_empty_fund_is_not_active_even_for_free_guarantor():
    with pytest.raises(InsufficientRewardFunding):
        plan_reward({1: 0}, RewardTariff("fixed"))


def test_nano_rounding_stable_ties_and_individual_floor():
    plan = plan_reward({3: 100, 2: 100, 1: 100}, RewardTariff("fixed", 2))
    assert [w.guarantor_reward_nano for w in plan.winners] == [1, 1, 0]
    plan = plan_reward({1: 1, 2: 4}, RewardTariff("fixed", 3))
    assert [w.guarantor_reward_nano for w in plan.winners] == [0, 3]
    assert [w.net_profit_nano for w in plan.winners] == [1, 1]


def test_exhaustive_small_nano_conservation_and_rounding_bounds():
    for amounts in product(range(1, 10), repeat=3):
        profits = dict(enumerate(amounts, 1))
        for reward in range(sum(amounts) + 1):
            try:
                plan = plan_reward(profits, RewardTariff("fixed", reward))
            except InsufficientRewardFunding:
                continue
            assert plan.reward_nano == reward
            assert sum(w.guarantor_reward_nano for w in plan.winners) == reward
            assert sum(
                w.net_profit_nano + w.service_fee_nano for w in plan.winners
            ) + reward == sum(amounts)
            for winner in plan.winners:
                assert winner.net_profit_nano * 10000 >= winner.profit_nano * 2000
                quota, remainder = divmod(reward * winner.profit_nano, plan.profit_nano)
                assert winner.guarantor_reward_nano in {quota, quota + bool(remainder)}


@pytest.mark.parametrize(
    "terms",
    [
        {"fixed_ton": "NaN"},
        {"fixed_ton": "1e100000000"},
        {"fixed_ton": "-1"},
        {"fixed_ton": "0.0000000001"},
        {"fixed_ton": "1.00000000000000000000000000001"},
        {"fixed_ton": "1e-1000000000000000"},
        {"percent": "0.001"},
        {"percent": "101"},
        {"mode": "unknown"},
        {"mode": "fixed", "percent": "3"},
    ],
)
def test_invalid_tariff_rejected_without_float(terms):
    with pytest.raises(ValueError):
        RewardTariff.from_terms(terms)


def test_exact_decimal_input_and_large_integer_profit():
    tariff = RewardTariff.from_terms(
        {"mode": "combined", "fixed_ton": "0.000000001", "percent": "3.01"}
    )
    plan = plan_reward({1: 10**25 + 7, 2: 10**24 + 13}, tariff)
    assert plan.reward_nano == 1 + (11 * 10**24 + 20) * 301 // 10000


def fill(maker, taker, side, maker_ton, taker_ton):
    return SimpleNamespace(
        maker_user_id=maker,
        taker_user_id=taker,
        maker_outcome=side,
        maker_stake=maker_ton * NANO,
        taker_stake=taker_ton * NANO,
    )


def test_both_outcomes_not_just_larger_profit_must_secure_reward():
    a = fill(1, 2, 0, 100, 200)  # One fully secured fill at odds 3 / 1.5.
    plans = funded_outcomes([a], RewardTariff("fixed", 100 * NANO), 300 * NANO)
    assert plans[0] is not None and plans[0].profit_nano == 200 * NANO
    assert plans[1] is None
    b = fill(3, 4, 0, 100, 100)
    plans = funded_outcomes([a, b], RewardTariff("fixed", 100 * NANO), 500 * NANO)
    assert all(plans)
    assert [p.profit_nano for p in plans] == [300 * NANO, 200 * NANO]
    assert all(p.reward_nano == 100 * NANO for p in plans)


def test_hedging_nets_all_account_costs_preserving_existing_fee_base():
    fills = [fill(1, 2, 0, 100, 100), fill(1, 3, 1, 100, 100)]
    plans = funded_outcomes(fills, RewardTariff("percent", 0, 300), 400 * NANO)
    assert [p.profit_nano for p in plans] == [100 * NANO, 100 * NANO]
    assert all(1 not in [w.user_id for w in p.winners] for p in plans)
    assert all(p.reward_nano == 3 * NANO for p in plans)


def test_no_offers_or_future_opposing_volume_can_secure_a_reward():
    assert funded_outcomes([], RewardTariff("fixed"), 0) == (None, None)
    with pytest.raises(ValueError, match="Банк"):
        funded_outcomes([fill(1, 2, 0, 100, 100)], RewardTariff("fixed"), 300 * NANO)


def test_additional_hedged_fill_can_break_an_already_secure_fixed_reward():
    initial = [fill(1, 2, 0, 100, 100)]
    tariff = RewardTariff("fixed", 50 * NANO)
    assert all(funded_outcomes(initial, tariff, 200 * NANO))
    # The original pair trades back the opposite exposure: net profits vanish.
    plans = funded_outcomes(initial + [fill(1, 2, 1, 100, 100)], tariff, 400 * NANO)
    assert plans == (None, None)
