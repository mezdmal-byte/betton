"""LMSR (Logarithmic Market Scoring Rule) — автоматический маркетмейкер.

Стоимостная функция:
    C(q) = b * ln(Σ_i exp(q_i / b))

Цена исхода i — частная производная C по q_i:
    p_i(q) = exp(q_i / b) / Σ_j exp(q_j / b)

Количество акций x исхода i за сумму m (комиссия входа 0%):
    x = b * ln(exp((C(q) + m) / b) - Σ_{j≠i} exp(q_j / b)) - q_i
"""

from __future__ import annotations

import math
from typing import Sequence

YES = 0
NO = 1
BINARY_OUTCOMES = ("yes", "no")


def _require_positive_b(b: float) -> None:
    if not math.isfinite(b) or b <= 0:
        raise ValueError("Параметр ликвидности b должен быть конечным и > 0")


def _require_quantities(q: Sequence[float]) -> tuple[float, ...]:
    if len(q) < 2:
        raise ValueError("Нужно как минимум два исхода")
    values = tuple(float(x) for x in q)
    if any(not math.isfinite(v) for v in values):
        raise ValueError("Количества акций должны быть конечными")
    return values


def log_sum_exp(values: Sequence[float]) -> float:
    """Численно устойчивый ln(Σ exp(v_i))."""
    if not values:
        raise ValueError("Пустой вектор для log-sum-exp")
    peak = max(values)
    if not math.isfinite(peak):
        return peak
    total = sum(math.exp(v - peak) for v in values)
    return peak + math.log(total)


def cost(q: Sequence[float], b: float) -> float:
    """C(q) = b * ln(Σ exp(q_i / b))."""
    _require_positive_b(b)
    quantities = _require_quantities(q)
    return b * log_sum_exp([qi / b for qi in quantities])


def prices(q: Sequence[float], b: float) -> list[float]:
    """Вектор мгновенных цен p_i ∈ (0, 1), Σ p_i = 1."""
    _require_positive_b(b)
    quantities = _require_quantities(q)
    scaled = [qi / b for qi in quantities]
    lse = log_sum_exp(scaled)
    return [math.exp(s - lse) for s in scaled]


def price(q: Sequence[float], b: float, outcome: int) -> float:
    """Цена одной бесконечно малой акции исхода (Yes=0 / No=1)."""
    probs = prices(q, b)
    if outcome < 0 or outcome >= len(probs):
        raise IndexError("Неизвестный исход")
    return probs[outcome]


def price_yes(q: Sequence[float], b: float) -> float:
    return price(q, b, YES)


def price_no(q: Sequence[float], b: float) -> float:
    return price(q, b, NO)


def cost_of_shares(q: Sequence[float], b: float, outcome: int, shares: float) -> float:
    """Сколько денег нужно заплатить, чтобы купить `shares` акций исхода."""
    quantities = _require_quantities(q)
    if outcome < 0 or outcome >= len(quantities):
        raise IndexError("Неизвестный исход")
    if shares < 0:
        raise ValueError("Количество акций не может быть отрицательным")
    if shares == 0:
        return 0.0
    before = list(quantities)
    after = list(quantities)
    after[outcome] += shares
    return cost(after, b) - cost(before, b)


def shares_for_cost(q: Sequence[float], b: float, outcome: int, money: float) -> float:
    """Сколько акций исхода получит пользователь за `money` (комиссия 0%).

    Численно устойчивая форма:
        rest = Σ_{j≠i} exp(q_j / b)
        inner = rest * (e^{m/b} - 1) + exp((q_i + m) / b)
        x = b * ln(inner) - q_i
    """
    _require_positive_b(b)
    quantities = _require_quantities(q)
    if outcome < 0 or outcome >= len(quantities):
        raise IndexError("Неизвестный исход")
    if not math.isfinite(money) or money < 0:
        raise ValueError("Сумма ставки должна быть конечной и ≥ 0")
    if money == 0:
        return 0.0

    qi = quantities[outcome]
    others = [qj / b for j, qj in enumerate(quantities) if j != outcome]
    m_over_b = money / b
    log_term_self = (qi + money) / b  # ln exp((q_i + m) / b)

    if not others:
        return b * log_term_self - qi

    log_rest = log_sum_exp(others)
    # rest * (e^{m/b} - 1); при m→0 это ~ rest * m/b
    expm1_m = math.expm1(m_over_b)
    if expm1_m <= 0:
        return 0.0
    log_term_rest = log_rest + math.log(expm1_m)
    ln_inner = log_sum_exp([log_term_rest, log_term_self])
    shares = b * ln_inner - qi
    if shares < 0:
        # Численный шум на крошечных суммах
        return 0.0
    return shares


def apply_buy(
    q: Sequence[float],
    b: float,
    outcome: int,
    money: float,
) -> tuple[list[float], float, float]:
    """Покупка: новые q, число акций, фактическая стоимость (равна money при 0% комиссии)."""
    shares = shares_for_cost(q, b, outcome, money)
    new_q = list(_require_quantities(q))
    new_q[outcome] += shares
    paid = cost(new_q, b) - cost(q, b)
    return new_q, shares, paid


def max_tip(net_profit: float, tip_cap: float = 0.01) -> float:
    """Потолок чаевых: до tip_cap от чистой прибыли победителя (по умолчанию 1%)."""
    if tip_cap < 0 or tip_cap > 0.01:
        raise ValueError("Доля чаевых должна быть в диапазоне [0, 0.01]")
    profit = max(0.0, float(net_profit))
    return profit * tip_cap


def outcome_index(name: str) -> int:
    key = name.strip().lower()
    if key in ("yes", "да", "true", "1"):
        return YES
    if key in ("no", "нет", "false", "0"):
        return NO
    raise ValueError("Исход должен быть yes или no")
