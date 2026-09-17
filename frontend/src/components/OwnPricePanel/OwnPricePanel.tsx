import { Bookmark, Minus, Plus, Zap } from 'lucide-react'
import { AmountInput } from '../AmountInput/AmountInput'
import { Button } from '../Button/Button'
import { Chip } from '../Chip/Chip'
import { IconButton } from '../IconButton/IconButton'
import { OutcomeQuote } from '../OutcomeQuote/OutcomeQuote'
import { OrderBookRow } from '../OrderBookRow/OrderBookRow'
import { availableAtOdds, splitFill } from '../../lib/fill'
import { formatInteger, formatOdds, formatTon, formatTonFull } from '../../lib/format'
import { QUICK_TRADE_AMOUNT_PRESETS } from '../../lib/constants'
import { useT } from '../../i18n'
import { cx } from '../../lib/cx'
import type { OrderBookLevel, OutcomeSide, RecentTrade } from '../../types/market'
import styles from './OwnPricePanel.module.css'

export type OwnPricePanelProps = {
  question: string
  outcomeALabel: string
  outcomeBLabel: string
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
}

export function OwnPricePanel({
  question,
  outcomeALabel,
  outcomeBLabel,
  selectedSide,
  odds,
  amount,
  book,
  trades,
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
}: OwnPricePanelProps) {
  const t = useT()
  const maxAvailable = Math.max(...book.map((level) => level.availableTon), 1)
  const selectedLabel = selectedSide === 'a' ? outcomeALabel : outcomeBLabel
  const localSplit = splitFill(amount, availableAtOdds(book, odds))
  const matched = matchedTon ?? (previewMode === 'local' ? localSplit.matched : null)
  const rest = restTon ?? (previewMode === 'local' ? localSplit.rest : null)

  return (
    <div className={styles.root}>
      <p className={styles.question}>{question}</p>
      <div className={styles.outcomes}>
        <OutcomeQuote
          label={outcomeALabel}
          side="a"
          showMetrics={false}
          state={selectedSide === 'a' ? 'selected' : 'default'}
          onClick={() => onSelectSide?.('a')}
        />
        <OutcomeQuote
          label={outcomeBLabel}
          side="b"
          showMetrics={false}
          state={selectedSide === 'b' ? 'selected' : 'default'}
          onClick={() => onSelectSide?.('b')}
        />
      </div>

      <div className={styles.oddsBlock}>
        <span className={styles.label}>{t('advanced.yourOdds', { name: selectedLabel })}</span>
        <div className={styles.stepper}>
          <IconButton
            label={t('advanced.less')}
            variant="plain"
            size="md"
            onClick={() => onOddsChange?.(Number((odds - 0.01).toFixed(2)))}
          >
            <Minus size={16} />
          </IconButton>
          <span className={styles.oddsValue}>{formatOdds(odds)}</span>
          <IconButton
            label={t('advanced.more')}
            variant="plain"
            size="md"
            onClick={() => onOddsChange?.(Number((odds + 0.01).toFixed(2)))}
          >
            <Plus size={16} />
          </IconButton>
        </div>
      </div>

      <AmountInput
        value={String(amount)}
        label={t('wallet.amount')}
        onChange={(value) => onAmountChange?.(Number(value) || 0)}
        error={
          errorMessage
            ? errorMessage
            : availableTon != null && amount > availableTon
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
            disabled={availableTon != null && preset > availableTon}
            onClick={() => onAmountChange?.(preset)}
          >
            {preset}
          </Chip>
        ))}
      </div>

      <div className={styles.summary}>
        <div className={cx(styles.summaryRow, styles.now)}>
          <span>
            <Zap size={14} strokeWidth={2.2} aria-hidden="true" />
            {t('preview.now')}
          </span>
          <b>{matched == null ? '—' : `${formatInteger(matched)} TON`}</b>
        </div>
        <div className={cx(styles.summaryRow, styles.rest)}>
          <span>
            <Bookmark size={14} strokeWidth={2.2} aria-hidden="true" />
            {t('preview.rest')}
          </span>
          <b>{rest == null ? '—' : `${formatInteger(rest)} TON`}</b>
        </div>
      </div>

      {success ? <p className={styles.success}>{t('advanced.success')}</p> : null}

      <Button fullWidth loading={submitting} disabled={disabled || submitting || success} onClick={onSubmit}>
        {submitting ? t('advanced.placing') : t('advanced.place')}
      </Button>

      <section className={styles.book}>
        <div className={styles.bookHead}>
          <span>{t('book.coef')}</span>
          <span>{t('book.availCol')}</span>
        </div>
        {book.length === 0 ? (
          <p className={styles.empty}>{t('advanced.noBook')}</p>
        ) : (
          book.map((level, index) => (
            <OrderBookRow
              key={level.odds}
              level={level}
              maxAvailable={maxAvailable}
              active={index === 0}
            />
          ))
        )}
      </section>

      {trades.length > 0 ? (
        <section className={styles.trades}>
          <h3>{t('advanced.recent')}</h3>
          {trades.map((trade) => (
            <div key={`${trade.odds}-${trade.timeAgo}`} className={styles.trade}>
              <span className={styles.tradeOdds}>{formatOdds(trade.odds)}</span>
              <span className={styles.tradeAmount}>{formatTon(trade.amountTon)}</span>
              <span className={styles.tradeTime}>{trade.timeAgo}</span>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  )
}
