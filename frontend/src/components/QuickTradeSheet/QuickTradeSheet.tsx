import { X } from 'lucide-react'
import { QUICK_TRADE_AMOUNT_PRESETS } from '../../lib/constants'
import { formatOdds, formatTon, formatTonFull } from '../../lib/format'
import { useT } from '../../i18n'
import { outcomeIsExecutable } from '../../lib/quote'
import {
  amountInputValue,
  formatMaxPreset,
  presetExceedsBalance,
  quickTradeCtaDisabled,
  topExecutableTon,
} from '../../lib/quickTrade'
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

export type QuickTradeFillLeg = {
  odds: number
  matchedTon: number
}

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
  previewAverageOdds?: number | null
  previewWorstOdds?: number | null
  previewFills?: QuickTradeFillLeg[] | null
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

function formatAverageOdds(odds: number | null | undefined): string {
  if (odds == null || Number.isNaN(odds)) return '—'
  return odds.toFixed(3)
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
  previewAverageOdds = null,
  previewWorstOdds = null,
  previewFills = null,
  errorMessage = null,
  placeResult = null,
}: QuickTradeSheetProps) {
  const t = useT()
  const selected = outcomeOf(market, selectedSide)
  const executable = !quotesLoading && outcomeIsExecutable(selected)
  const noLiquidity = !quotesLoading && (state === 'no-liquidity' || !executable)
  const stale = state === 'stale-quote'
  const insufficient = state === 'insufficient-balance' || (amount > 0 && presetExceedsBalance(amount, availableTon))
  const amountEntered = amount > 0
  const matched = previewMatchedTon
  const rest = previewRestTon
  const hasBackendPreview = matched != null && rest != null
  const showPreview = amountEntered && executable && !stale && hasBackendPreview && (matched ?? 0) > 0
  const maxTon = topExecutableTon(selected)
  const canPlace = !quickTradeCtaDisabled({
    amount,
    executable,
    quotesLoading,
    insufficient,
    matchedTon: previewMatchedTon,
    demoMode,
    state,
  })
  const primaryIsOwnPrice = noLiquidity && !stale
  const primaryIsRefresh = stale
  const partialFill = state === 'success' && placeResult?.kind === 'partial'
  const cta = demoMode
    ? t('demo.unavailable')
    : state === 'processing'
      ? t('market.processing')
      : partialFill
        ? t('market.partialFilled')
        : state === 'success'
          ? t('market.filled')
          : primaryIsRefresh
            ? t('market.refreshQuote')
            : primaryIsOwnPrice
              ? t('market.ownOdds')
              : amountEntered
                ? t('market.betCtaAmount', { amt: amount })
                : t('market.betCta')

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
      {noLiquidity && !stale ? <p className={styles.note}>{t('market.noLiquidityNow')}</p> : null}

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
        {quotesLoading
          ? t('market.atOddsAvailable', { odds: '…', amt: '…' })
          : executable
            ? t('market.atOddsAvailable', {
                odds: formatOdds(selected.odds),
                amt: formatTon(selected.liquidityTon),
              })
            : t('market.noLiquidityNow')}
      </p>

      <AmountInput
        value={amountInputValue(amount)}
        placeholder="0"
        onChange={(value) => onAmountChange?.(Number(value) || 0)}
        error={
          insufficient
            ? t('err.fundsAvail', { amt: formatTonFull(availableTon) })
            : undefined
        }
      />

      <div className={styles.presets}>
        {QUICK_TRADE_AMOUNT_PRESETS.map((preset) => (
          <Chip
            key={preset}
            compact
            selected={preset === amount}
            disabled={presetExceedsBalance(preset, availableTon)}
            onClick={() => onAmountChange?.(preset)}
          >
            {preset}
          </Chip>
        ))}
        {maxTon > 0 ? (
          <Chip
            compact
            selected={Math.abs(amount - maxTon) < 1e-9}
            disabled={presetExceedsBalance(maxTon, availableTon)}
            onClick={() => onAmountChange?.(maxTon)}
          >
            {t('market.maxPreset', { amt: formatMaxPreset(maxTon) })}
          </Chip>
        ) : null}
      </div>

      {showPreview ? (
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>{t('preview.entered')}</span>
            <b>{formatTon(amount)}</b>
          </div>
          <div className={styles.summaryRow}>
            <span>{t('preview.willFillNow')}</span>
            <b>{formatTon(matched)}</b>
          </div>
          {(rest ?? 0) > 0.0001 ? (
            <div className={styles.summaryRow}>
              <span>{t('preview.wontFill')}</span>
              <b>{formatTon(rest)}</b>
            </div>
          ) : null}
          <div className={styles.summaryRow}>
            <span>{t('preview.avgOdds')}</span>
            <b>{formatAverageOdds(previewAverageOdds)}</b>
          </div>
          <div className={styles.summaryRow}>
            <span>{t('preview.worstOdds')}</span>
            <b>{formatOdds(previewWorstOdds)}</b>
          </div>
          <div className={styles.summaryRow}>
            <span>{t('preview.expectedPayout')}</span>
            <b>~{formatTon(previewPayoutTon)}</b>
          </div>
          {previewFills && previewFills.length > 0
            ? previewFills.map((leg, index) => (
                <div className={styles.summaryRow} key={`${leg.odds}-${index}`}>
                  <span>{formatTon(leg.matchedTon)}</span>
                  <b>× {formatOdds(leg.odds)}</b>
                </div>
              ))
            : null}
        </div>
      ) : (
        <div className={styles.payout}>
          <span>{t('preview.expectedPayout')}</span>
          <b>—</b>
        </div>
      )}

      <Button
        fullWidth
        loading={!demoMode && state === 'processing'}
        disabled={demoMode || (primaryIsRefresh || primaryIsOwnPrice ? false : !canPlace)}
        onClick={
          demoMode ? undefined : primaryIsRefresh ? onRefreshQuote : primaryIsOwnPrice ? onOwnPrice : onPlace
        }
      >
        {cta}
      </Button>
      {primaryIsOwnPrice ? null : (
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
      )}
      <p className={styles.fee}>{t('account.fee')}</p>
    </section>
  )
}
