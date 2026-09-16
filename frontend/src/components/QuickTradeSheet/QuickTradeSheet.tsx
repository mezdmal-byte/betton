import { X } from 'lucide-react'
import { AMOUNT_PRESETS, FEE_COPY } from '../../lib/constants'
import { splitFill } from '../../lib/fill'
import { formatInteger, formatOdds, formatPayout, formatTon } from '../../lib/format'
import { outcomeIsExecutable } from '../../lib/quote'
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
  onRefreshQuote?: () => void
  demoMode?: boolean
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
  onRefreshQuote,
  demoMode = false,
}: QuickTradeSheetProps) {
  const selected = outcomeOf(market, selectedSide)
  const other = outcomeOf(market, selectedSide === 'a' ? 'b' : 'a')
  const executable = outcomeIsExecutable(selected)
  const noLiquidity = state === 'no-liquidity' || !executable
  const stale = state === 'stale-quote'
  const { matched, rest } = splitFill(amount, selected.liquidityTon)
  const canPlace =
    !demoMode &&
    executable &&
    !stale &&
    state !== 'insufficient-balance' &&
    state !== 'processing' &&
    state !== 'no-liquidity'
  const payout = !executable || stale ? '—' : formatPayout(amount, selected.odds as number)
  const cta = demoMode
    ? 'Ставки пока недоступны'
    : state === 'processing'
      ? 'Ставим…'
      : stale
        ? 'Обновить предложение'
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

      {stale ? <p className={styles.banner}>Коэффициент изменился. Обновите предложение.</p> : null}
      {state === 'partial' && executable ? (
        <p className={styles.note}>
          Сейчас доступно {formatTon(selected.liquidityTon)}. Исполнится {formatInteger(matched)}{' '}
          TON, остаток {formatInteger(rest)} TON — своей ценой.
        </p>
      ) : null}
      {noLiquidity && !stale ? <p className={styles.note}>Нет встречных заявок по этой цене.</p> : null}

      <div className={styles.outcomes}>
        <OutcomeQuote
          label={market.outcomeA.label}
          odds={market.outcomeA.odds}
          liquidity={market.outcomeA.liquidityTon}
          side="a"
          density="compact"
          state={selectedSide === 'a' ? 'selected' : 'default'}
          onClick={() => onSelectSide?.('a')}
        />
        <OutcomeQuote
          label={market.outcomeB.label}
          odds={market.outcomeB.odds}
          liquidity={market.outcomeB.liquidityTon}
          side="b"
          density="compact"
          state={selectedSide === 'b' ? 'selected' : 'default'}
          onClick={() => onSelectSide?.('b')}
        />
      </div>

      <p className={styles.liquidity}>
        Доступно {executable ? formatTon(selected.liquidityTon) : '—'} · {other.label}{' '}
        {formatOdds(other.odds)}
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
          <Chip
            key={preset}
            compact
            selected={preset === amount}
            onClick={() => onAmountChange?.(preset)}
          >
            {preset}
          </Chip>
        ))}
      </div>

      <div className={styles.payout}>
        <span>Потенциальная выплата</span>
        <b>{payout}</b>
      </div>

      <Button
        fullWidth
        loading={!demoMode && state === 'processing'}
        disabled={demoMode || (stale ? false : !canPlace)}
        onClick={demoMode ? undefined : stale ? onRefreshQuote : undefined}
      >
        {cta}
      </Button>
      <Button
        variant="ghost"
        size="md"
        fullWidth
        className={styles.ownPrice}
        disabled={demoMode}
        onClick={demoMode ? undefined : onOwnPrice}
      >
        Своя цена →
      </Button>
      <p className={styles.fee}>{FEE_COPY}</p>
    </section>
  )
}
