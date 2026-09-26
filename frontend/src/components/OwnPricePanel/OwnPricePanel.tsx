import { useEffect, useMemo, useRef, useState } from 'react'
import { AmountInput } from '../AmountInput/AmountInput'
import { Button } from '../Button/Button'
import { OutcomeQuote } from '../OutcomeQuote/OutcomeQuote'
import { availableAtOdds, splitFill } from '../../lib/fill'
import { formatOdds, formatTonFull } from '../../lib/format'
import { useT } from '../../i18n'
import type { OrderBookLevel, OutcomeSide, RecentTrade } from '../../types/market'
import styles from './OwnPricePanel.module.css'

export type OwnPriceStage = 'entry' | 'preview' | 'confirm'

export type OwnPricePanelProps = {
  question: string
  outcomeALabel: string
  outcomeBLabel: string
  outcomeAOdds?: number | null
  outcomeBOdds?: number | null
  selectedSide: OutcomeSide
  odds: number
  amount: number
  book: OrderBookLevel[]
  trades: RecentTrade[]
  onSelectSide?: (side: OutcomeSide) => void
  onOddsChange?: (odds: number) => void
  onAmountChange?: (amount: number) => void
  onSubmit?: () => void
  matchedTon?: number | null
  restTon?: number | null
  previewMode?: 'local' | 'backend'
  submitting?: boolean
  disabled?: boolean
  errorMessage?: string | null
  availableTon?: number | null
  success?: boolean
  bookState?: 'ready' | 'loading' | 'error'
  tradesState?: 'ready' | 'loading' | 'error'
  onRetryBook?: () => void
  onRetryTrades?: () => void
  stage?: OwnPriceStage
  onStageChange?: (stage: OwnPriceStage) => void
}

export function OwnPricePanel({
  outcomeALabel,
  outcomeBLabel,
  outcomeAOdds = null,
  outcomeBOdds = null,
  selectedSide,
  odds,
  amount,
  book,
  onSelectSide,
  onOddsChange,
  onAmountChange,
  onSubmit,
  matchedTon = null,
  restTon = null,
  previewMode = 'local',
  submitting = false,
  disabled = false,
  errorMessage = null,
  availableTon = null,
  success = false,
  stage = 'entry',
  onStageChange,
}: OwnPricePanelProps) {
  const t = useT()
  const selectedLabel = selectedSide === 'a' ? outcomeALabel : outcomeBLabel
  const localSplit = splitFill(amount, availableAtOdds(book, odds))
  const matched = matchedTon ?? (previewMode === 'local' ? localSplit.matched : null)
  const rest = restTon ?? (previewMode === 'local' ? localSplit.rest : null)
  const payout = useMemo(() => Math.max(0, amount) * Math.max(1, odds), [amount, odds])
  const [oddsDraft, setOddsDraft] = useState(() =>
    Number.isFinite(odds) && odds > 0 ? odds.toFixed(2) : '',
  )
  const [oddsEditing, setOddsEditing] = useState(false)
  const oddsInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (oddsEditing) return
    setOddsDraft(Number.isFinite(odds) && odds > 0 ? odds.toFixed(2) : '')
  }, [odds, oddsEditing])

  const resetPreview = () => {
    if (stage !== 'entry') onStageChange?.('entry')
  }

  if (success) {
    return (
      <div className={styles.root}>
        <section className={styles.information}>
          <strong>ОРДЕР РАЗМЕЩЁН</strong>
          <p>{t('advanced.success')}</p>
        </section>
      </div>
    )
  }

  if (stage === 'preview') {
    return (
      <div className={styles.root}>
        <section className={styles.primaryMetric}>
          <strong>{formatOdds(odds)}</strong>
          <span>лимитная цена · {selectedLabel}</span>
        </section>

        <div className={styles.details}>
          <DataRow value={formatTonFull(amount) + ' @ ' + formatOdds(odds) + ' · ордер'} />
          <DataRow value={formatTonFull(matched) + ' @ ' + formatOdds(odds) + ' · сейчас'} />
          <DataRow value={formatTonFull(rest) + ' @ ' + formatOdds(odds) + ' · будет ждать'} />
          <DataRow accent value={'Потенциальная выплата · ' + formatTonFull(payout)} />
        </div>

        <section className={styles.information}>
          <strong>ВАЖНО</strong>
          <p>Только неисполненный остаток станет активным ордером.</p>
        </section>

        <Button fullWidth disabled={disabled} onClick={() => onStageChange?.('confirm')}>
          Разместить ордер
        </Button>
      </div>
    )
  }

  if (stage === 'confirm') {
    return (
      <div className={styles.root}>
        <section className={styles.primaryMetric}>
          <strong>{formatTonFull(amount)}</strong>
          <span>максимальная сумма ордера</span>
        </section>

        <div className={styles.details}>
          <DataRow value={'Купить ' + selectedLabel + ' · лимит ' + formatOdds(odds)} />
          <DataRow value={'Может исполниться сейчас · ' + formatTonFull(matched)} />
          <DataRow value={'Может остаться · ' + formatTonFull(rest)} />
          <DataRow accent value={'Резерв · ' + formatTonFull(amount)} />
        </div>

        {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}

        <Button
          fullWidth
          loading={submitting}
          disabled={disabled || submitting}
          onClick={onSubmit}
        >
          Подтвердить размещение
        </Button>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.outcomes}>
        <OutcomeQuote
          label={outcomeALabel}
          odds={outcomeAOdds}
          side="a"
          showLiquidity={false}
          state={selectedSide === 'a' ? 'selected' : 'default'}
          onClick={() => {
            resetPreview()
            onSelectSide?.('a')
          }}
        />
        <OutcomeQuote
          label={outcomeBLabel}
          odds={outcomeBOdds}
          side="b"
          showLiquidity={false}
          state={selectedSide === 'b' ? 'selected' : 'default'}
          onClick={() => {
            resetPreview()
            onSelectSide?.('b')
          }}
        />
      </div>

      <div className={styles.inputCard}>
        <label htmlFor="own-price-odds">Желаемый коэффициент</label>
        <input
          id="own-price-odds"
          ref={oddsInputRef}
          type="text"
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={oddsDraft}
          onFocus={(event) => {
            setOddsEditing(true)
            window.setTimeout(() => event.currentTarget.select(), 0)
          }}
          onBlur={() => {
            setOddsEditing(false)
            const parsed = Number(oddsDraft.replace(',', '.'))
            if (Number.isFinite(parsed) && parsed >= 1.01 && parsed <= 10000) {
              const normalized = Math.round(parsed * 100) / 100
              setOddsDraft(normalized.toFixed(2))
              onOddsChange?.(normalized)
            } else {
              setOddsDraft('')
              onOddsChange?.(0)
            }
          }}
          onChange={(event) => {
            resetPreview()
            const raw = event.target.value
              .replace(/[^0-9.,]/g, '')
              .replace(/^([.,])/, '0$1')
            const separatorIndex = raw.search(/[.,]/)
            const normalizedDraft =
              separatorIndex < 0
                ? raw
                : raw.slice(0, separatorIndex + 1) +
                  raw.slice(separatorIndex + 1).replace(/[.,]/g, '').slice(0, 2)
            setOddsDraft(normalizedDraft)
            if (!normalizedDraft) {
              onOddsChange?.(0)
              return
            }
            const parsed = Number(normalizedDraft.replace(',', '.'))
            if (Number.isFinite(parsed)) onOddsChange?.(parsed)
          }}
        />
        {oddsDraft ? (
          <button
            type="button"
            className={styles.clearOdds}
            aria-label="Очистить коэффициент"
            onPointerDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              resetPreview()
              setOddsDraft('')
              onOddsChange?.(0)
              oddsInputRef.current?.focus()
            }}
          >
            ×
          </button>
        ) : null}
      </div>

      <AmountInput
        value={String(amount)}
        label={
          availableTon == null
            ? 'Сумма ордера'
            : 'Сумма ордера · баланс ' + formatTonFull(availableTon)
        }
        onChange={(value) => {
          resetPreview()
          onAmountChange?.(Number(value.replace(',', '.')) || 0)
        }}
        error={
          errorMessage
            ? errorMessage
            : availableTon != null && amount > availableTon
              ? t('err.fundsAvail', { amt: formatTonFull(availableTon) })
              : undefined
        }
      />

      <div className={styles.quoteRows}>
        <QuoteRow label="Исход" value={selectedLabel} accent />
        <QuoteRow label="Резерв на ордер" value={formatTonFull(amount)} />
      </div>

      <p className={styles.note}>
        Часть может исполниться сразу. Остаток ожидает встречные заявки по вашим условиям. Его можно отменить.
      </p>

      <Button
        fullWidth
        disabled={disabled || amount <= 0 || odds <= 1}
        onClick={() => onStageChange?.('preview')}
      >
        Предпросмотр
      </Button>
    </div>
  )
}

function QuoteRow({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className={styles.quoteRow}>
      <span>{label}</span>
      <strong className={accent ? styles.accent : undefined}>{value}</strong>
    </div>
  )
}

function DataRow({ value, accent = false }: { value: string; accent?: boolean }) {
  return <div className={accent ? styles.dataRowAccent : styles.dataRow}>{value}</div>
}
