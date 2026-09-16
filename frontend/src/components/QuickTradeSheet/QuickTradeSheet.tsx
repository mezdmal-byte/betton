import { X } from 'lucide-react'
import { AMOUNT_PRESETS, FEE_COPY } from '../../lib/constants'
import { formatOdds, formatPayout, formatTon } from '../../lib/format'
import type { MarketFixture, OutcomeSide } from '../../types/market'
import { AmountInput } from '../AmountInput/AmountInput'
import { Button } from '../Button/Button'
import { Chip } from '../Chip/Chip'
import { IconButton } from '../IconButton/IconButton'
import { OutcomeQuote } from '../OutcomeQuote/OutcomeQuote'
import styles from './QuickTradeSheet.module.css'

export type QuickTradeState =
  | 'normal'
  | 'partial'
  | 'no-liquidity'
  | 'processing'
  | 'stale-quote'
  | 'insufficient-balance'

export type QuickTradeSheetProps = {
  market: MarketFixture
  selectedSide: OutcomeSide
  amount: number
  state?: QuickTradeState
  onSelectSide?: (side: OutcomeSide) => void
  onAmountChange?: (amount: number) => void
  onClose?: () => void
  onOwnPrice?: () => void
}

function outcomeOf(market: MarketFixture, side: OutcomeSide) {
  return side === 'a' ? market.outcomeA : market.outcomeB
}

export function QuickTradeSheet({
  market,
  selectedSide,
  amount,
  state = 'normal',
  onSelectSide,
  onAmountChange,
  onClose,
  onOwnPrice,
}: QuickTradeSheetProps) {
  const selected = outcomeOf(market, selectedSide)
  const otherSide: OutcomeSide = selectedSide === 'a' ? 'b' : 'a'
  const other = outcomeOf(market, otherSide)
  const odds = selected.odds
  const liquidity = selected.liquidityTon
  const noLiquidity = state === 'no-liquidity' || odds == null || liquidity == null
  const canPlace = !noLiquidity && state !== 'insufficient-balance' && state !== 'processing'
  const payout = odds != null ? formatPayout(amount, odds) : '—'
  const cta =
    state === 'processing'
      ? 'Ставим…'
      : noLiquidity
        ? 'Нет ликвидности'
        : `Поставить ${amount} TON`

  return (
    <section className={styles.sheet} aria-label="Быстрая ставка">
      <div className={styles.handle} aria-hidden="true" />
      <header className={styles.header}>
        <h2 className={styles.question}>{market.question}</h2>
        <IconButton label="Закрыть" size="md" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </header>

      {state === 'stale-quote' ? (
        <p className={styles.banner}>Коэффициент обновился. Проверьте цену перед ставкой.</p>
      ) : null}
      {state === 'partial' ? (
        <p className={styles.note}>
          Сейчас доступно {formatTon(40)}. Остаток можно выставить своей ценой.
        </p>
      ) : null}
      {state === 'no-liquidity' ? (
        <p className={styles.note}>Нет встречных заявок по этой цене.</p>
      ) : null}

      <div className={styles.outcomes}>
        <OutcomeQuote
          label={market.outcomeA.label}
          odds={market.outcomeA.odds}
          liquidity={market.outcomeA.liquidityTon}
          side="a"
          state={
            state === 'no-liquidity' && selectedSide === 'a'
              ? 'no-liquidity'
              : selectedSide === 'a'
                ? 'selected'
                : 'default'
          }
          onClick={() => onSelectSide?.('a')}
        />
        <OutcomeQuote
          label={market.outcomeB.label}
          odds={market.outcomeB.odds}
          liquidity={market.outcomeB.liquidityTon}
          side="b"
          state={
            state === 'no-liquidity' && selectedSide === 'b'
              ? 'no-liquidity'
              : selectedSide === 'b'
                ? 'selected'
                : market.outcomeB.liquidityTon == null
                  ? 'no-liquidity'
                  : 'default'
          }
          onClick={() => onSelectSide?.('b')}
        />
      </div>

      <p className={styles.liquidity}>
        Доступно {noLiquidity ? '—' : formatTon(liquidity)} · {other.label} {formatOdds(other.odds)}
      </p>

      <AmountInput
        value={String(amount)}
        onChange={(value) => onAmountChange?.(Number(value) || 0)}
        error={
          state === 'insufficient-balance' ? 'Недостаточно средств · доступно 1 240 TON' : undefined
        }
      />

      <div className={styles.presets}>
        {AMOUNT_PRESETS.map((preset) => (
          <Chip key={preset} selected={preset === amount} onClick={() => onAmountChange?.(preset)}>
            {preset}
          </Chip>
        ))}
      </div>

      <div className={styles.payout}>
        <span>Потенциальная выплата</span>
        <b>{payout}</b>
      </div>

      <Button fullWidth loading={state === 'processing'} disabled={!canPlace}>
        {cta}
      </Button>
      <Button variant="secondary" fullWidth onClick={onOwnPrice}>
        Своя цена →
      </Button>
      <p className={styles.fee}>{FEE_COPY}</p>
    </section>
  )
}
