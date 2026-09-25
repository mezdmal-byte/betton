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
    requestedTon?: number
    status?: string
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
  const [editingAfterInsufficient, setEditingAfterInsufficient] = useState(false)

  useEffect(() => {
    setAmountDraft(amountInputValue(amount))
    setConfirming(false)
  }, [amount, selectedSide])

  useEffect(() => {
    if (state !== 'normal' && state !== 'partial') setConfirming(false)
    if (state !== 'insufficient-balance') setEditingAfterInsufficient(false)
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
  const specialState =
    state === 'processing' ||
    state === 'stale-quote' ||
    state === 'no-liquidity' ||
    state === 'insufficient-balance' ||
    state === 'success' ||
    state === 'error'
  const showSpecialState = specialState && !(state === 'insufficient-balance' && editingAfterInsufficient)

  if (showSpecialState) {
    const resultPartial = state === 'success' && placeResult?.kind === 'partial'
    const resultFull = state === 'success' && placeResult?.kind === 'full'
    const requestedTon = placeResult?.requestedTon ?? amount

    let title = 'Быстрый вход'
    let metric = formatTonFull(amount)
    let metricCaption = ''
    let tone: 'success' | 'warning' | 'danger' | 'default' = 'default'
    let rows: string[] = []
    let primaryLabel = 'Назад к рынку'
    let primaryAction: (() => void) | undefined = onClose
    let loading = false

    if (state === 'processing') {
      title = 'Покупка обрабатывается'
      metric = formatTonFull(amount)
      metricCaption = 'исполняем по лучшим доступным ценам'
      rows = ['Проверяем котировку', 'Сопоставляем встречные заявки', 'Не закрывайте приложение']
      primaryLabel = 'Обработка…'
      primaryAction = undefined
      loading = true
    } else if (state === 'stale-quote') {
      title = 'Цена изменилась'
      metric = previewAverageOdds != null ? formatOdds(previewAverageOdds) + '×' : 'Котировка'
      metricCaption = 'проверьте обновлённую цену перед подтверждением'
      tone = 'warning'
      rows = [
        'Сумма · ' + formatTonFull(amount),
        previewPayoutTon != null ? 'Новая выплата · ' + formatTonFull(previewPayoutTon) : 'Котировка требует обновления',
        errorMessage || 'Проверьте обновлённую котировку',
      ]
      primaryLabel = 'Обновить котировку'
      primaryAction = onRefreshQuote
    } else if (state === 'no-liquidity') {
      title = 'Нет встречных заявок'
      metric = '0.00 TON'
      metricCaption = 'сейчас нельзя исполнить'
      rows = ['Встречных заявок нет', 'Баланс не изменён', 'Попробуйте позже или задайте свою цену']
      primaryLabel = 'Перейти к своей цене'
      primaryAction = onOwnPrice
    } else if (state === 'insufficient-balance') {
      title = 'Недостаточно TON'
      metric = formatTonFull(availableTon ?? 0)
      metricCaption = 'доступно · требуется ' + formatTonFull(amount)
      tone = 'danger'
      rows = [
        'Не хватает · ' + formatTonFull(Math.max(0, amount - (availableTon ?? 0))),
        'Сумма сделки · ' + formatTonFull(amount),
        'Измените сумму и повторите',
      ]
      primaryLabel = 'Изменить сумму'
      primaryAction = () => setEditingAfterInsufficient(true)
    } else if (state === 'success' && (resultPartial || resultFull) && placeResult) {
      title = resultPartial ? 'Исполнено частично' : 'Покупка исполнена'
      metric = formatTonFull(placeResult.filledTon)
      metricCaption = resultPartial
        ? 'исполнено из ' + formatTonFull(requestedTon)
        : 'исполнено полностью'
      tone = 'success'
      rows = [
        'Исполнено · ' + formatTonFull(placeResult.filledTon),
        ...(placeResult.refundedTon > 0
          ? ['Возвращено · ' + formatTonFull(placeResult.refundedTon)]
          : []),
        resultPartial
          ? 'Остаток не размещён в стакане'
          : 'IOC завершён без активного остатка',
      ]
      primaryLabel = resultPartial ? 'Готово' : 'В портфель'
      primaryAction = onNavChange ? () => onNavChange('portfolio') : onClose
    } else if (state === 'error') {
      title = 'Покупка не выполнена'
      metric = 'Не исполнено'
      metricCaption = 'операция не подтверждена'
      tone = 'danger'
      rows = [
        errorMessage || 'Не удалось подтвердить исполнение',
        'Повторите с новой котировкой',
      ]
      primaryLabel = 'Повторить'
      primaryAction = onRefreshQuote
    }

    return (
      <section className={styles.screen} aria-label={t('market.quickTrade')}>
        <header className={styles.header}>
          <strong className={styles.marketQuestion}>{market.question}</strong>
          <div className={styles.titleRow}>
            <button type="button" className={styles.backButton} onClick={onClose} aria-label={t('back')}>←</button>
            <h1>{title}</h1>
          </div>
        </header>
        <main className={styles.body}>
          <section
            className={cx(
              styles.stateMetric,
              tone === 'success' && styles.stateMetricSuccess,
              tone === 'warning' && styles.stateMetricWarning,
              tone === 'danger' && styles.stateMetricDanger,
            )}
          >
            <strong>{metric}</strong>
            <span>{metricCaption}</span>
          </section>

          <div className={styles.stateRows}>
            {rows.map((row, index) => (
              <div key={String(index) + row}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{row}</p>
              </div>
            ))}
          </div>

          {resultPartial ? (
            <section className={styles.stateNotice}>
              <strong>ВАЖНО</strong>
              <p>IOC завершён: неисполненная часть уже доступна на балансе.</p>
            </section>
          ) : null}

          <Button
            fullWidth
            loading={loading}
            disabled={loading || !primaryAction}
            onClick={primaryAction}
          >
            {primaryLabel}
          </Button>

          {state !== 'processing' && state !== 'success' ? (
            <Button variant="secondary" fullWidth onClick={onClose}>
              Назад к рынку
            </Button>
          ) : null}
        </main>
        <BottomNavigation active="markets" onChange={onNavChange} />
      </section>
    )
  }

  if (state === 'partial' && showPreview && !confirming) {
    return (
      <section className={styles.screen} aria-label={t('market.quickTrade')}>
        <header className={styles.header}>
          <strong className={styles.marketQuestion}>{market.question}</strong>
          <div className={styles.titleRow}>
            <button type="button" className={styles.backButton} onClick={onClose} aria-label={t('back')}>←</button>
            <h1>Частичное исполнение</h1>
          </div>
        </header>
        <main className={styles.body}>
          <section className={styles.stateMetric}>
            <strong>{formatTonFull(matched ?? 0)}</strong>
            <span>исполнится из {formatTonFull(amount)}</span>
          </section>

          <div className={styles.stateRows}>
            {(previewFills ?? []).map((leg, index) => (
              <div key={String(leg.odds) + '-' + index}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{formatTonFull(leg.matchedTon)} @ {formatOdds(leg.odds)}×</p>
              </div>
            ))}
            <div>
              <span>{String((previewFills?.length ?? 0) + 1).padStart(2, '0')}</span>
              <p>Не исполнится · {formatTonFull(rest ?? 0)}</p>
            </div>
            <div>
              <span>{String((previewFills?.length ?? 0) + 2).padStart(2, '0')}</span>
              <p>Возврат остатка · {formatTonFull(rest ?? 0)}</p>
            </div>
          </div>

          <section className={styles.stateNotice}>
            <strong>ВАЖНО</strong>
            <p>Quick Trade — IOC. Остаток возвращается на баланс и не размещается в стакане.</p>
          </section>

          <Button fullWidth disabled={!canPlace} onClick={onPlace}>
            Подтвердить IOC
          </Button>
          <Button variant="secondary" fullWidth onClick={onClose}>
            Назад к рынку
          </Button>
        </main>
        <BottomNavigation active="markets" onChange={onNavChange} />
      </section>
    )
  }

  return (
    <section className={styles.screen} aria-label={t('market.quickTrade')}>
      <header className={styles.header}>
        <strong className={styles.marketQuestion}>{market.question}</strong>
        <div className={styles.titleRow}>
          <button type="button" className={styles.backButton} onClick={onClose} aria-label={t('back')}>←</button>
          <h1>Быстрый вход</h1>
        </div>
      </header>

      <main className={styles.body}>
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
          disabled={primaryDisabled}
          onClick={
            demoMode
              ? undefined
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
