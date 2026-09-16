import { X } from 'lucide-react'
import { AMOUNT_PRESETS } from '../../lib/constants'
import { splitFill } from '../../lib/fill'
import { formatInteger, formatOdds, formatPayout, formatTon, formatTonFull } from '../../lib/format'
import { useT } from '../../i18n'
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
  | 'success'
  | 'error'

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
  onPlace?: () => void
  demoMode?: boolean
  quotesLoading?: boolean
  availableTon?: number | null
  previewMatchedTon?: number | null
  previewRestTon?: number | null
  previewPayoutTon?: number | null
  errorMessage?: string | null
  placeResult?: {
    kind: 'empty' | 'partial' | 'full'
    filledTon: number
    refundedTon: number
  } | null
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
  onPlace,
  demoMode = false,
  quotesLoading = false,
  availableTon = null,
  previewMatchedTon = null,
  previewRestTon = null,
  previewPayoutTon = null,
  errorMessage = null,
  placeResult = null,
}: QuickTradeSheetProps) {
  const t = useT()
  const selected = outcomeOf(market, selectedSide)
  const other = outcomeOf(market, selectedSide === 'a' ? 'b' : 'a')
  const executable = !quotesLoading && outcomeIsExecutable(selected)
  const noLiquidity = !quotesLoading && (state === 'no-liquidity' || !executable)
  const stale = state === 'stale-quote'
  const localSplit = splitFill(amount, selected.liquidityTon)
  const matched = previewMatchedTon ?? localSplit.matched
  const rest = previewRestTon ?? localSplit.rest
  const canPlace =
    !demoMode &&
    !quotesLoading &&
    executable &&
    !stale &&
    state !== 'insufficient-balance' &&
    state !== 'processing' &&
    state !== 'no-liquidity' &&
    state !== 'success'
  const payout =
    quotesLoading || !executable || stale
      ? '—'
      : previewPayoutTon != null
        ? formatTon(previewPayoutTon)
        : formatPayout(amount, selected.odds as number)
  const partialFill = state === 'success' && placeResult?.kind === 'partial'
  const cta = demoMode
    ? t('demo.unavailable')
    : state === 'processing'
      ? t('market.processing')
      : partialFill
        ? t('market.partialFilled')
        : state === 'success'
          ? t('market.filled')
          : stale
            ? t('market.refreshQuote')
            : noLiquidity
              ? t('market.noLiq')
              : t('market.betCtaAmount', { amt: amount })

  return (
    <section className={styles.sheet} aria-label={t('market.quickTrade')}>
      <div className={styles.handle} aria-hidden="true" />
      <header className={styles.header}>
        <h2 className={styles.question}>{market.question}</h2>
        <IconButton label={t('close')} size="md" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </header>

      {stale ? (
        <p className={styles.banner}>
          {errorMessage || t('market.quoteChanged')}
        </p>
      ) : null}
      {partialFill && placeResult ? (
        <p className={styles.banner}>
          {t('market.filledLine', { filled: formatTonFull(placeResult.filledTon) })}
          <br />
          {t('market.refundedLine', { refunded: formatTonFull(placeResult.refundedTon) })}
        </p>
      ) : null}
      {state === 'success' && !partialFill ? (
        <p className={styles.banner}>{t('market.processed')}</p>
      ) : null}
      {state === 'error' && errorMessage ? <p className={styles.banner}>{errorMessage}</p> : null}
      {state === 'partial' && executable ? (
        <p className={styles.note}>
          {t('market.partialNote', {
            available: formatTon(selected.liquidityTon),
            matched: formatInteger(matched),
            rest: formatInteger(rest),
          })}
        </p>
      ) : null}
      {noLiquidity && !stale ? <p className={styles.note}>{t('market.takeAvailable')}</p> : null}

      <div className={styles.outcomes}>
        <OutcomeQuote
          label={market.outcomeA.label}
          odds={market.outcomeA.odds}
          liquidity={market.outcomeA.liquidityTon}
          side="a"
          density="compact"
          state={quotesLoading ? 'loading' : selectedSide === 'a' ? 'selected' : 'default'}
          onClick={() => onSelectSide?.('a')}
        />
        <OutcomeQuote
          label={market.outcomeB.label}
          odds={market.outcomeB.odds}
          liquidity={market.outcomeB.liquidityTon}
          side="b"
          density="compact"
          state={quotesLoading ? 'loading' : selectedSide === 'b' ? 'selected' : 'default'}
          onClick={() => onSelectSide?.('b')}
        />
      </div>

      <p className={styles.liquidity}>
        {t('market.availableLine', { amt: quotesLoading ? '…' : executable ? formatTon(selected.liquidityTon) : '—' })} · {other.label}{' '}
        {quotesLoading ? '—' : formatOdds(other.odds)}
      </p>

      <AmountInput
        value={String(amount)}
        onChange={(value) => onAmountChange?.(Number(value) || 0)}
        error={
          state === 'insufficient-balance'
            ? t('err.fundsAvail', { amt: formatTonFull(availableTon) })
            : undefined
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
        <span>{t('preview.payout')}</span>
        <b>{payout}</b>
      </div>

      <Button
        fullWidth
        loading={!demoMode && state === 'processing'}
        disabled={demoMode || (stale ? false : !canPlace)}
        onClick={demoMode ? undefined : stale ? onRefreshQuote : onPlace}
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
        {t('market.ownPriceCta')}
      </Button>
      <p className={styles.fee}>{t('account.fee')}</p>
    </section>
  )
}
