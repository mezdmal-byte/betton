"""Integer-only reward planning; no database writes or balance mutations.

The existing P2P fee base is retained: positive account profit after netting
all that account's matched stakes (including hedges). Service fee remains
profit_i // 100. Percentage rewards round down once, for the whole event.
The reward is apportioned by largest remainder, with user id as a stable tie
break. Every winner must retain ceil(profit_i * minimum_keep_bps / 10000).
If exact proportional nanoTON apportionment cannot satisfy that floor, the
fund is rejected; no free balance may make up a shortfall.
"""

from dataclasses import dataclass
from decimal import Decimal, DecimalException
from typing import Literal, Mapping

BPS = 10_000
NANO = 1_000_000_000
SERVICE_BPS = 100
RewardMode = Literal["fixed", "percent", "combined", "percent_minimum"]


class InsufficientRewardFunding(ValueError):
    """The agreed reward cannot be taken from secured profit safely."""


def ceil_ratio(numerator: int, denominator: int) -> int:
    return (numerator + denominator - 1) // denominator


@dataclass(frozen=True)
class RewardTariff:
    mode: RewardMode
    fixed_nano: int = 0
    percent_bps: int = 0

    def __post_init__(self):
        if self.mode not in ("fixed", "percent", "combined", "percent_minimum"):
            raise ValueError("Неизвестный тип вознаграждения")
        if (
            type(self.fixed_nano) is not int
            or not 0 <= self.fixed_nano <= 1_000_000 * NANO
        ):
            raise ValueError("Некорректная фиксированная сумма nanoTON")
        if type(self.percent_bps) is not int or not 0 <= self.percent_bps <= BPS:
            raise ValueError("Некорректный процент гаранта")
        if self.mode == "fixed" and self.percent_bps:
            raise ValueError("Фиксированный тариф не содержит процент")
        if self.mode == "percent" and self.fixed_nano:
            raise ValueError("Процентный тариф не содержит фиксированную сумму")

    @classmethod
    def from_terms(cls, terms: dict):
        try:
            fixed_input = Decimal(str(terms.get("fixed_ton", "0")))
            rate_input = Decimal(str(terms.get("percent", "0")))
            if not fixed_input.is_finite() or not rate_input.is_finite():
                raise ValueError()
            if (
                fixed_input.as_tuple().exponent < -9
                or rate_input.as_tuple().exponent < -2
            ):
                raise ValueError()
            fixed = fixed_input * NANO
            rate = rate_input * 100
            if not 0 <= fixed <= 1_000_000 * NANO or not 0 <= rate <= BPS:
                raise ValueError()
            if fixed != fixed.to_integral_value() or rate != rate.to_integral_value():
                raise ValueError()
            return cls(terms.get("mode", "fixed"), int(fixed), int(rate))
        except (DecimalException, ValueError, TypeError, OverflowError) as exc:
            raise ValueError(
                "Проверьте сумму TON (до 9 знаков) и процент (до 2 знаков)"
            ) from exc

    def reward(self, profit_nano: int) -> int:
        if type(profit_nano) is not int or profit_nano < 0:
            raise ValueError("Прибыль должна быть неотрицательным целым nanoTON")
        percentage = profit_nano * self.percent_bps // BPS
        if self.mode == "fixed":
            return self.fixed_nano
        if self.mode == "percent":
            return percentage
        if self.mode == "combined":
            return self.fixed_nano + percentage
        return max(self.fixed_nano, percentage)


@dataclass(frozen=True)
class WinnerCharge:
    user_id: int
    profit_nano: int
    service_fee_nano: int
    guarantor_reward_nano: int
    minimum_profit_nano: int

    @property
    def net_profit_nano(self):
        return self.profit_nano - self.service_fee_nano - self.guarantor_reward_nano


@dataclass(frozen=True)
class RewardPlan:
    profit_nano: int
    reward_nano: int
    service_fee_nano: int
    winners: tuple[WinnerCharge, ...]


def plan_reward(
    profits: Mapping[int, int], tariff: RewardTariff, minimum_keep_bps: int = 2000
) -> RewardPlan:
    if (
        type(minimum_keep_bps) is not int
        or not 0 <= minimum_keep_bps <= BPS - SERVICE_BPS
    ):
        raise ValueError("Доля сохраняемой прибыли должна быть от 0 до 99%")
    if any(
        type(uid) is not int or uid <= 0 or type(p) is not int or p < 0
        for uid, p in profits.items()
    ):
        raise ValueError("Некорректные пользователь или прибыль nanoTON")
    positive = {uid: p for uid, p in profits.items() if p > 0}
    total = sum(positive.values())
    reward = tariff.reward(total)
    if not total:
        raise InsufficientRewardFunding(
            "Ожидаем достаточного объёма заключённых ставок"
        )
    # Test the agreed whole-event inequality without float or intermediate rounding.
    if (BPS - SERVICE_BPS - minimum_keep_bps) * total < BPS * reward:
        raise InsufficientRewardFunding(
            "Прибыль при этом исходе не обеспечивает вознаграждение и минимальную долю победителей"
        )
    fees = {uid: p // 100 for uid, p in positive.items()}
    floors = {uid: ceil_ratio(p * minimum_keep_bps, BPS) for uid, p in positive.items()}
    caps = {uid: p - fees[uid] - floors[uid] for uid, p in positive.items()}
    charges = {uid: reward * p // total for uid, p in positive.items()}
    if any(charges[uid] > caps[uid] for uid in positive):
        raise InsufficientRewardFunding(
            "Округление не сохраняет минимальную прибыль отдельного победителя"
        )
    remaining = reward - sum(charges.values())
    eligible = sorted(
        (
            uid
            for uid in positive
            if charges[uid] < caps[uid] and reward * positive[uid] % total
        ),
        key=lambda uid: (-(reward * positive[uid] % total), uid),
    )
    if remaining > len(eligible):
        raise InsufficientRewardFunding(
            "Недостаточно прибыли для точного распределения nanoTON"
        )
    for uid in eligible[:remaining]:
        charges[uid] += 1
    winners = tuple(
        WinnerCharge(uid, positive[uid], fees[uid], charges[uid], floors[uid])
        for uid in sorted(positive)
    )
    assert sum(w.guarantor_reward_nano for w in winners) == reward
    assert all(w.net_profit_nano >= w.minimum_profit_nano for w in winners)
    return RewardPlan(total, reward, sum(fees.values()), winners)


def funded_outcomes(
    fills, tariff: RewardTariff, pot_nano: int, minimum_keep_bps: int = 2000
):
    """Evaluate BOTH outcomes using actual fills only, never order reserves.

    Returns plans for settlement/activation callers. A missing plan means the
    event must keep collecting (or cancel at its funding deadline). No state
    transitions or money transfers happen in this function.
    """
    fills = tuple(fills)
    bank = 0
    costs: dict[int, int] = {}
    payouts: tuple[dict[int, int], dict[int, int]] = ({}, {})
    for fill in fills:
        if (
            fill.maker_outcome not in (0, 1)
            or fill.maker_user_id == fill.taker_user_id
            or type(fill.maker_stake) is not int
            or type(fill.taker_stake) is not int
            or min(fill.maker_stake, fill.taker_stake) <= 0
        ):
            raise ValueError("Некорректная исполненная сделка")
        total = fill.maker_stake + fill.taker_stake
        bank += total
        for uid, side, stake in (
            (fill.maker_user_id, fill.maker_outcome, fill.maker_stake),
            (fill.taker_user_id, 1 - fill.maker_outcome, fill.taker_stake),
        ):
            costs[uid] = costs.get(uid, 0) + stake
            payouts[side][uid] = payouts[side].get(uid, 0) + total
    if type(pot_nano) is not int or pot_nano != bank:
        raise ValueError("Банк не соответствует фонду исполненных ставок")
    plans = []
    for side in (0, 1):
        profits = {
            uid: max(0, payouts[side].get(uid, 0) - cost) for uid, cost in costs.items()
        }
        try:
            plans.append(plan_reward(profits, tariff, minimum_keep_bps))
        except InsufficientRewardFunding:
            plans.append(None)
    return tuple(plans)
