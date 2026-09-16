import { Minus, Plus } from 'lucide-react'
import { AmountInput } from '../AmountInput/AmountInput'
import { Button } from '../Button/Button'
import { IconButton } from '../IconButton/IconButton'
import { OutcomeQuote } from '../OutcomeQuote/OutcomeQuote'
import { OrderBookRow } from '../OrderBookRow/OrderBookRow'
import { availableAtOdds, splitFill } from '../../lib/fill'
import { formatInteger, formatOdds, formatTon } from '../../lib/format'
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
}: OwnPricePanelProps) {
  const maxAvailable = Math.max(...book.map((level) => level.availableTon), 1)
  const selectedLabel = selectedSide === 'a' ? outcomeALabel : outcomeBLabel
  const { matched, rest } = splitFill(amount, availableAtOdds(book, odds))

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
        <span className={styles.label}>Коэффициент · {selectedLabel}</span>
        <div className={styles.stepper}>
          <IconButton
            label="Меньше"
            variant="plain"
            size="md"
            onClick={() => onOddsChange?.(Number((odds - 0.01).toFixed(2)))}
          >
            <Minus size={16} />
          </IconButton>
          <span className={styles.oddsValue}>{formatOdds(odds)}</span>
          <IconButton
            label="Больше"
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
        onChange={(value) => onAmountChange?.(Number(value) || 0)}
      />

      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span>Исполнится сейчас</span>
          <b>{formatInteger(matched)} TON</b>
        </div>
        <div className={styles.summaryRow}>
          <span>Останется заявкой</span>
          <b>{formatInteger(rest)} TON</b>
        </div>
      </div>

      <Button fullWidth>Разместить заявку</Button>

      <section className={styles.book}>
        <div className={styles.bookHead}>
          <span>Коэффициент</span>
          <span>Доступно</span>
        </div>
        {book.map((level, index) => (
          <OrderBookRow
            key={level.odds}
            level={level}
            maxAvailable={maxAvailable}
            active={index === 0}
          />
        ))}
      </section>

      <section className={styles.trades}>
        <h3>Недавние сделки</h3>
        {trades.map((trade) => (
          <div key={`${trade.odds}-${trade.timeAgo}`} className={styles.trade}>
            <span className={styles.tradeOdds}>{formatOdds(trade.odds)}</span>
            <span className={styles.tradeAmount}>{formatTon(trade.amountTon)}</span>
            <span className={styles.tradeTime}>{trade.timeAgo}</span>
          </div>
        ))}
      </section>
    </div>
  )
}
