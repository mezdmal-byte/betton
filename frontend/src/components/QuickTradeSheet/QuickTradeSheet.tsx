import { useEffect, useState } from 'react'
import type { NavId } from '../BottomNavigation/BottomNavigation'
import { BottomNavigation } from '../BottomNavigation/BottomNavigation'
import { AmountInput } from '../AmountInput/AmountInput'
import { Button } from '../Button/Button'
import { OutcomeQuote } from '../OutcomeQuote/OutcomeQuote'
import { cx } from '../../lib/cx'
import { formatOdds, formatTon, formatTonFull } from '../../lib/format'
import { useT } from '../../i18n'
import { outcomeIsExecutable } from '../../lib/quote'
import {
  amountInputValue,
  presetExceedsBalance,
  quickTradeCtaDisabled,
} from '../../lib/quickTrade'
import type { MarketFixture, OutcomeSide } from '../../types/market'
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
  onNavChange?: (id: NavId) => void
  demoMode?: boolean
  quotesLoading?: boolean
  availableTon?: number | null
  totalAvailableTon?: number | null
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

function quoteValue(value: number | null | undefined, suffix = ''): string {
  if (value == null || Number.isNaN(value)) return '—'
  return value.toFixed(2) + suffix
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
  onNavChange,
  demoMode = false,
  quotesLoading = false,
  availableTon = null,
  totalAvailableTon = null,
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
  const [amountDraft, setAmountDraft] = useState(() => amountInputValue(amount))
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    setAmountDraft(amountInputValue(amount))
    setConfirming(false)
  }, [amount, selectedSide])

  useEffect(() => {
    if (state !== 'normal' && state !== 'partial') setConfirming(false)
  }, [state])

  const selected = outcomeOf(market, selectedSide)
  const executable = !quotesLoading && outcomeIsExecutable(selected)
  const terminalState = state === 'success' || state === 'processing' || state === 'error'
  const noLiquidity = !quotesLoading && !terminalState && (state === 'no-liquidity' || !executable)
  const stale = state === 'stale-quote'
  const insufficient =
    state === 'insufficient-balance' ||
    (amount > 0 && presetExceedsBalance(amount, availableTon))
  const amountEntered = amount > 0
  const matched = previewMatchedTon
  const rest = previewRestTon
  const hasBackendPreview = matched != null && rest != null
  const showPreview = amountEntered && executable && !stale && hasBackendPreview && (matched ?? 0) > 0
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
  const primaryIsRefresh = stale || state === 'error'
  const partialFill = state === 'success' && placeResult?.kind === 'partial'
  const primaryDisabled =
    demoMode ||
    state === 'success' ||
    (primaryIsRefresh || primaryIsOwnPrice ? false : !canPlace)

  const primaryLabel = demoMode
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
              : confirming
                ? 'Подтвердить покупку'
                : 'Проверить покупку'

  const totalNow = totalAvailableTon ?? selected.liquidityTon

  return (
    <section className={styles.screen} aria-label={t('market.quickTrade')}>
      <header className={styles.header}>
        <strong className={styles.marketQuestion}>{market.question}</strong>
        <h1>Быстрый вход</h1>
      </header>

      <main className={styles.body}>
        {stale ? <p className={styles.banner}>{errorMessage || t('market.quoteChanged')}</p> : null}
        {partialFill && placeResult ? (
          <p className={cx(styles.banner, styles.successBanner)}>
            {t('market.filledLine', { filled: formatTonFull(placeResult.filledTon) })}
            <br />
            {t('market.refundedLine', { refunded: formatTonFull(placeResult.refundedTon) })}
          </p>
        ) : null}
        {state === 'success' && !partialFill ? (
          <p className={cx(styles.banner, styles.successBanner)}>{t('market.processed')}</p>
        ) : null}
        {state === 'error' && errorMessage ? <p className={styles.banner}>{errorMessage}</p> : null}

        <div className={styles.outcomes}>
          <OutcomeQuote
            label={market.outcomeA.label}
            odds={market.outcomeA.odds}
            liquidity={market.outcomeA.liquidityTon}
            side="a"
            density="compact"
            showLiquidity={false}
            state={quotesLoading ? 'loading' : selectedSide === 'a' ? 'selected' : 'default'}
            onClick={() => onSelectSide?.('a')}
          />
          <OutcomeQuote
            label={market.outcomeB.label}
            odds={market.outcomeB.odds}
            liquidity={market.outcomeB.liquidityTon}
            side="b"
            density="compact"
            showLiquidity={false}
            state={quotesLoading ? 'loading' : selectedSide === 'b' ? 'selected' : 'default'}
            onClick={() => onSelectSide?.('b')}
          />
        </div>

        <AmountInput
          value={amountDraft}
          placeholder="0"
          label={
            availableTon == null
              ? 'Сумма покупки'
              : 'Сумма покупки · баланс ' + formatTonFull(availableTon)
          }
          onChange={(value) => {
            let normalized = value.replace(',', '.')
            if (normalized.startsWith('.')) normalized = '0' + normalized
            if (!/^\d*(?:\.\d{0,4})?$/.test(normalized)) return
            setAmountDraft(normalized)
            setConfirming(false)
            onAmountChange?.(Number(normalized) || 0)
          }}
          error={
            insufficient
              ? t('err.fundsAvail', { amt: formatTonFull(availableTon) })
              : undefined
          }
        />

        <div className={styles.quote}>
          <QuoteRow label="Лучший коэффициент" value={quotesLoading ? '…' : formatOdds(selected.odds) + '×'} />
          <QuoteRow label="Доступно по лучшему" value={quotesLoading ? '…' : formatTon(selected.liquidityTon)} />
          <QuoteRow label="Всего доступно сейчас" value={quotesLoading ? '…' : formatTon(totalNow)} />
          <QuoteRow
            label="Средний коэффициент исполнения"
            value={showPreview ? quoteValue(previewAverageOdds) + '×' : '—'}
          />
          <QuoteRow
            label="Худший коэффициент исполнения"
            value={showPreview ? formatOdds(previewWorstOdds) + '×' : '—'}
          />
          <QuoteRow label="Исполнится сейчас" value={showPreview ? formatTon(matched) : '—'} />
          <QuoteRow label="Выплата до комиссии" value={showPreview ? formatTon(previewPayoutTon) : '—'} />
        </div>

        {previewFills && previewFills.length > 1 ? (
          <div className={styles.fillBreakdown}>
            {previewFills.map((leg, index) => (
              <span key={String(leg.odds) + '-' + index}>
                {formatTon(leg.matchedTon)} по {formatOdds(leg.odds)}×
              </span>
            ))}
          </div>
        ) : null}

        <p className={styles.note}>
          Доступная часть исполнится сразу. Неисполненный остаток отменится и не останется в стакане.
        </p>

        {confirming && showPreview ? (
          <div className={styles.confirmation}>
            <strong>Проверьте покупку</strong>
            <span>
              {selected.label} · {formatTon(amount)} · средний коэффициент {quoteValue(previewAverageOdds)}×
            </span>
          </div>
        ) : null}

        <Button
          fullWidth
          loading={!demoMode && state === 'processing'}
          disabled={primaryDisabled}
          onClick={
            state === 'success'
              ? undefined
              : demoMode
                ? undefined
                : primaryIsRefresh
                  ? onRefreshQuote
                  : primaryIsOwnPrice
                    ? onOwnPrice
                    : confirming
                      ? onPlace
                      : () => setConfirming(true)
          }
        >
          {primaryLabel}
        </Button>

        <div className={styles.destinations}>
          <Button variant="secondary" fullWidth disabled={demoMode} onClick={demoMode ? undefined : onOwnPrice}>
            Своя цена
          </Button>
          <Button variant="secondary" fullWidth onClick={onClose}>
            Назад к рынку
          </Button>
        </div>
      </main>

      <BottomNavigation active="markets" onChange={onNavChange} />
    </section>
  )
}

function QuoteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.quoteRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
