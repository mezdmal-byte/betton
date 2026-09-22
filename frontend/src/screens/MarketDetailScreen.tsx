import { ChevronLeft, Clock } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Avatar } from '../components/Avatar/Avatar'
import { Button } from '../components/Button/Button'
import { IconButton } from '../components/IconButton/IconButton'
import { MarketChart } from '../components/MarketChart/MarketChart'
import { MarketStatusPanel } from '../components/MarketStatusPanel/MarketStatusPanel'
import { OrderBookPanel } from '../components/OrderBookPanel/OrderBookPanel'
import { OutcomeQuote } from '../components/OutcomeQuote/OutcomeQuote'
import { RangeSelector } from '../components/RangeSelector/RangeSelector'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { Tabs } from '../components/Tabs/Tabs'
import { chartSpartakA, chartSpartakB, marketYesNo } from '../fixtures/markets'
import { useT, type MessageKey } from '../i18n'
import { formatInteger, formatTon } from '../lib/format'
import { cx } from '../lib/cx'
import { marketIsLocked, marketOutcomeQuoteState } from '../lib/quote'
import type { ChartPoint, MarketFixture, OrderBookLevel, OutcomeSide } from '../types/market'
import styles from './MarketDetailScreen.module.css'

export type MarketDetailViewState = 'ready' | 'loading' | 'not-found' | 'forbidden' | 'error'
export type MarketDetailPane = 'chart' | 'book'
export type TradeHistoryState = 'hidden' | 'loading' | 'empty' | 'ready' | 'error'

export type MarketDetailScreenProps = {
  market?: MarketFixture
  selectedSide?: OutcomeSide
  chartSeriesA?: ChartPoint[]
  chartSeriesB?: ChartPoint[]
  priceHistoryAvailable?: boolean
  tradeHistoryState?: TradeHistoryState
  orderbookA?: OrderBookLevel[]
  orderbookB?: OrderBookLevel[]
  orderbookState?: 'ready' | 'loading' | 'error'
  pane?: MarketDetailPane
  onPaneChange?: (pane: MarketDetailPane) => void
  viewState?: MarketDetailViewState
  actionsDisabled?: boolean
  onBack?: () => void
  onSelectSide?: (side: OutcomeSide) => void
  onOwnPrice?: () => void
  onPlace?: () => void
  onRetry?: () => void
  onCreatorClick?: () => void
  onShare?: () => void
  shareAvailable?: boolean
  showMarketDataSwitch?: boolean
  onRetryTrades?: () => void
  onRetryBook?: () => void
  banner?: ReactNode
  extra?: ReactNode
}

export function MarketDetailScreen({
  market = marketYesNo,
  selectedSide = 'a',
  chartSeriesA = chartSpartakA,
  chartSeriesB = chartSpartakB,
  priceHistoryAvailable = true,
  tradeHistoryState = 'hidden',
  orderbookA,
  orderbookB,
  orderbookState,
  pane,
  onPaneChange,
  viewState = 'ready',
  actionsDisabled = false,
  onBack,
  onSelectSide,
  onOwnPrice,
  onPlace,
  onRetry,
  onCreatorClick,
  onShare,
  shareAvailable = false,
  showMarketDataSwitch = false,
  onRetryTrades,
  onRetryBook,
  banner,
  extra,
}: MarketDetailScreenProps) {
  const t = useT()
  const [side, setSide] = useState<OutcomeSide>(selectedSide)
  const [range, setRange] = useState('1d')
  const [localPane, setLocalPane] = useState<MarketDetailPane>('chart')
  const activeSide = onSelectSide ? selectedSide : side
  const selected = activeSide === 'a' ? market.outcomeA : market.outcomeB
  const series = activeSide === 'a' ? chartSeriesA : chartSeriesB
  const liveHistory = tradeHistoryState !== 'hidden'
  const currentOdds = liveHistory
    ? (series[series.length - 1]?.odds ?? selected.odds ?? 0)
    : (selected.odds ?? series[series.length - 1]?.odds ?? 0)
  const locked = marketIsLocked(market)
  const actionsOff = actionsDisabled || locked
  const showSwitch = showMarketDataSwitch || orderbookA != null || orderbookB != null || orderbookState != null
  const activePane = pane ?? localPane
  const resolutionBits = [market.description, market.resolution].map((text) => (text || '').trim()).filter(Boolean)

  const chooseSide = (next: OutcomeSide) => {
    if (locked) return
    if (onSelectSide) onSelectSide(next)
    else setSide(next)
  }

  if (viewState === 'loading') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <IconButton label={t('back')} size="md" onClick={onBack}><ChevronLeft size={22} /></IconButton>
          <strong className={styles.title}>{t('event.title')}</strong>
        </header>
        <div className={styles.body}><StatusMessage tone="loading" title={t('loading')}>{t('loading.body')}</StatusMessage></div>
      </div>
    )
  }

  if (viewState === 'not-found' || viewState === 'forbidden' || viewState === 'error') {
    const title = viewState === 'not-found' ? t('err.missing') : viewState === 'forbidden' ? t('err.forbidden') : t('err.request')
    const body = viewState === 'not-found' ? t('err.missingBody') : viewState === 'forbidden' ? t('err.forbiddenBody') : t('err.requestBody')
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <IconButton label={t('back')} size="md" onClick={onBack}><ChevronLeft size={22} /></IconButton>
          <strong className={styles.title}>{t('event.title')}</strong>
        </header>
        <div className={styles.body}>
          <StatusMessage tone="error" title={title}>{body}</StatusMessage>
          {onRetry ? <Button variant="secondary" onClick={onRetry}>{t('retry')}</Button> : null}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <IconButton label={t('back')} size="md" onClick={onBack}><ChevronLeft size={22} /></IconButton>
        <strong className={styles.title}>{t('event.title')}</strong>
        {shareAvailable && onShare ? <Button variant="ghost" size="md" onClick={onShare}>{t('share')}</Button> : null}
      </header>
      <div className={styles.body}>
        <div className={styles.kicker}>
          <span className={styles.catChip}>{categoryLabel(market, t)}</span>
          <span className={cx(styles.time, market.status === 'closing' && styles.closing)}><Clock size={13} strokeWidth={2.2} aria-hidden="true" />{market.closeLabel}</span>
        </div>
        <h1 className={styles.question}>{market.question}</h1>
        {banner}
        <div className={styles.creatorRow} onClick={onCreatorClick} role={onCreatorClick ? 'button' : undefined} tabIndex={onCreatorClick ? 0 : undefined} onKeyDown={onCreatorClick ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onCreatorClick() } } : undefined}>
          <Avatar initials={market.creator.initials} name={market.creator.displayName} size="sm" /><span>@{market.creator.handle}</span>
        </div>
        <div className={styles.statsRow}>
          <div className={styles.stat}><b>{formatTon(market.volumeTon)}</b><span>{t('market.volume')}</span></div>
          <span className={styles.statsDivider} aria-hidden="true" />
          <div className={styles.stat}><b>{formatInteger(market.participants)}</b><span>{t('market.people')}</span></div>
        </div>
        <div className={styles.outcomes}>
          <OutcomeQuote label={market.outcomeA.label} odds={market.outcomeA.odds} liquidity={market.outcomeA.liquidityTon} side="a" state={marketOutcomeQuoteState(market, 'a', locked ? null : activeSide)} onClick={() => chooseSide('a')} />
          <OutcomeQuote label={market.outcomeB.label} odds={market.outcomeB.odds} liquidity={market.outcomeB.liquidityTon} side="b" state={marketOutcomeQuoteState(market, 'b', locked ? null : activeSide)} onClick={() => chooseSide('b')} />
        </div>
        <MarketStatusPanel market={market} />
        {showSwitch ? <Tabs equal items={[{ id: 'chart', label: t('event.tradesTitleShort') }, { id: 'book', label: t('event.book') }]} value={activePane} onChange={(id) => { const next = id as MarketDetailPane; if (onPaneChange) onPaneChange(next); else setLocalPane(next) }} ariaLabel={t('event.tradesTitleShort')} /> : null}
        {(!showSwitch || activePane === 'chart') && liveHistory ? (
          tradeHistoryState === 'loading' ? <StatusMessage tone="loading" title={t('loading')}>{t('loading.body')}</StatusMessage>
            : tradeHistoryState === 'error' ? <div className={styles.retryBlock}><StatusMessage tone="error" title={t('event.tradesError')} />{onRetryTrades ? <Button variant="secondary" onClick={onRetryTrades}>{t('retry')}</Button> : onRetry ? <Button variant="secondary" onClick={onRetry}>{t('retry')}</Button> : null}</div>
              : tradeHistoryState === 'empty' || series.length === 0 ? <StatusMessage tone="empty" title={t('event.tradesEmpty')} />
                : <MarketChart series={series} currentOdds={currentOdds} outcomeLabel={selected.label} volumeTon={market.volumeTon} title={`${t('event.tradesTitle')} · ${selected.label}`} />
        ) : null}
        {(!showSwitch || activePane === 'chart') && !liveHistory ? (priceHistoryAvailable ? <><RangeSelector value={range} onChange={setRange} /><MarketChart series={series} currentOdds={currentOdds} outcomeLabel={selected.label} volumeTon={market.volumeTon} /></> : <StatusMessage tone="empty" title={t('event.tradesEmpty')} />) : null}
        {showSwitch && activePane === 'book' ? <OrderBookPanel outcomeALabel={market.outcomeA.label} outcomeBLabel={market.outcomeB.label} sideA={orderbookA ?? []} sideB={orderbookB ?? []} state={orderbookState === 'loading' || orderbookState === 'error' ? orderbookState : 'ready'} hint={t('book.depthHint')} onRetry={onRetryBook ?? onRetry} /> : null}
        {resolutionBits.length > 0 ? <section className={styles.info}><h2>{t('event.how')}</h2>{resolutionBits.map((text) => <p key={text}>{text}</p>)}</section> : null}
        {extra}
      </div>
      <div className={styles.actions}>
        <Button variant="secondary" size="md" disabled={actionsOff} onClick={onOwnPrice}>{t('market.ownOdds')}</Button>
        <Button size="md" disabled={actionsOff} onClick={onPlace}>{t('market.betCta')}</Button>
      </div>
    </div>
  )
}

function categoryLabel(market: MarketFixture, t: (key: MessageKey) => string): string {
  if (market.categoryKey === 'sport') return t('cat.sport')
  if (market.categoryKey === 'politics') return t('cat.politics')
  if (market.categoryKey === 'crypto') return t('cat.crypto')
  if (market.categoryKey === 'unique') return t('cat.other')
  return market.category
}
