import { ChevronLeft } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Avatar } from '../components/Avatar/Avatar'
import { Button } from '../components/Button/Button'
import { IconButton } from '../components/IconButton/IconButton'
import { MarketChart } from '../components/MarketChart/MarketChart'
import { OutcomeQuote } from '../components/OutcomeQuote/OutcomeQuote'
import { RangeSelector } from '../components/RangeSelector/RangeSelector'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { chartSpartakA, chartSpartakB, marketYesNo } from '../fixtures/markets'
import { COPY } from '../lib/constants'
import { formatInteger, formatTon } from '../lib/format'
import { marketIsLocked, marketOutcomeQuoteState } from '../lib/quote'
import type { ChartPoint, MarketFixture, OutcomeSide } from '../types/market'
import styles from './MarketDetailScreen.module.css'

export type MarketDetailViewState = 'ready' | 'loading' | 'not-found' | 'forbidden' | 'error'

export type MarketDetailScreenProps = {
  market?: MarketFixture
  selectedSide?: OutcomeSide
  chartSeriesA?: ChartPoint[]
  chartSeriesB?: ChartPoint[]
  priceHistoryAvailable?: boolean
  viewState?: MarketDetailViewState
  actionsDisabled?: boolean
  onBack?: () => void
  onSelectSide?: (side: OutcomeSide) => void
  onOwnPrice?: () => void
  onPlace?: () => void
  onRetry?: () => void
  banner?: ReactNode
  extra?: ReactNode
}

export function MarketDetailScreen({
  market = marketYesNo,
  selectedSide = 'a',
  chartSeriesA = chartSpartakA,
  chartSeriesB = chartSpartakB,
  priceHistoryAvailable = true,
  viewState = 'ready',
  actionsDisabled = false,
  onBack,
  onSelectSide,
  onOwnPrice,
  onPlace,
  onRetry,
  banner,
  extra,
}: MarketDetailScreenProps) {
  const [side, setSide] = useState<OutcomeSide>(selectedSide)
  const [range, setRange] = useState('1d')
  const activeSide = onSelectSide ? selectedSide : side
  const selected = activeSide === 'a' ? market.outcomeA : market.outcomeB
  const series = activeSide === 'a' ? chartSeriesA : chartSeriesB
  const currentOdds = selected.odds ?? series[series.length - 1]?.odds ?? 0
  const locked = marketIsLocked(market)
  const actionsOff = actionsDisabled || locked

  const chooseSide = (next: OutcomeSide) => {
    if (locked) return
    if (onSelectSide) onSelectSide(next)
    else setSide(next)
  }

  if (viewState === 'loading') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <IconButton label="Назад" size="md" onClick={onBack}>
            <ChevronLeft size={22} />
          </IconButton>
          <div className={styles.meta}>
            <span>Событие</span>
          </div>
        </header>
        <div className={styles.body}>
          <StatusMessage tone="loading" title={COPY.marketsLoadingTitle}>
            {COPY.marketsLoadingBody}
          </StatusMessage>
        </div>
      </div>
    )
  }

  if (viewState === 'not-found' || viewState === 'forbidden' || viewState === 'error') {
    const title =
      viewState === 'not-found'
        ? COPY.marketNotFoundTitle
        : viewState === 'forbidden'
          ? COPY.marketForbiddenTitle
          : COPY.marketsErrorTitle
    const body =
      viewState === 'not-found'
        ? COPY.marketNotFoundBody
        : viewState === 'forbidden'
          ? COPY.marketForbiddenBody
          : COPY.marketsErrorBody
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <IconButton label="Назад" size="md" onClick={onBack}>
            <ChevronLeft size={22} />
          </IconButton>
          <div className={styles.meta}>
            <span>Событие</span>
          </div>
        </header>
        <div className={styles.body}>
          <StatusMessage tone="error" title={title}>
            {body}
          </StatusMessage>
          {onRetry ? (
            <Button variant="secondary" onClick={onRetry}>
              Повторить
            </Button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <IconButton label="Назад" size="md" onClick={onBack}>
          <ChevronLeft size={22} />
        </IconButton>
        <div className={styles.meta}>
          <span>{market.category}</span>
          <span>·</span>
          <span>{market.closeLabel}</span>
        </div>
      </header>
      <div className={styles.body}>
        <h1 className={styles.question}>{market.question}</h1>
        {banner}
        <div className={styles.creatorRow}>
          <Avatar initials={market.creator.initials} name={market.creator.displayName} size="sm" />
          <span>@{market.creator.handle}</span>
          <span className={styles.stats}>
            {formatTon(market.volumeTon)} · {formatInteger(market.participants)}
          </span>
        </div>
        <div className={styles.outcomes}>
          <OutcomeQuote
            label={market.outcomeA.label}
            odds={market.outcomeA.odds}
            liquidity={market.outcomeA.liquidityTon}
            side="a"
            state={marketOutcomeQuoteState(market, 'a', locked ? null : activeSide)}
            onClick={() => chooseSide('a')}
          />
          <OutcomeQuote
            label={market.outcomeB.label}
            odds={market.outcomeB.odds}
            liquidity={market.outcomeB.liquidityTon}
            side="b"
            state={marketOutcomeQuoteState(market, 'b', locked ? null : activeSide)}
            onClick={() => chooseSide('b')}
          />
        </div>
        {priceHistoryAvailable ? (
          <>
            <RangeSelector value={range} onChange={setRange} />
            <MarketChart
              series={series}
              currentOdds={currentOdds}
              outcomeLabel={selected.label}
              volumeTon={market.volumeTon}
            />
          </>
        ) : (
          <StatusMessage tone="empty" title={COPY.historyUnavailable} />
        )}
        <section className={styles.info}>
          <h2>Как разрешится</h2>
          <p>{market.description}</p>
          {market.resolution ? <p>{market.resolution}</p> : null}
        </section>
        {extra}
      </div>
      <div className={styles.actions}>
        <Button variant="secondary" disabled={actionsOff} onClick={onOwnPrice}>
          Своя цена
        </Button>
        <Button disabled={actionsOff} onClick={onPlace}>
          Поставить
        </Button>
      </div>
    </div>
  )
}
