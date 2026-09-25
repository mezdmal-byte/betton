import { useState, type ReactNode } from 'react'
import { Button } from '../components/Button/Button'
import { MarketChart } from '../components/MarketChart/MarketChart'
import { MarketStatusPanel } from '../components/MarketStatusPanel/MarketStatusPanel'
import { OrderBookPanel } from '../components/OrderBookPanel/OrderBookPanel'
import { OutcomeQuote } from '../components/OutcomeQuote/OutcomeQuote'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { chartSpartakA, chartSpartakB, marketYesNo } from '../fixtures/markets'
import { useT, type MessageKey } from '../i18n'
import { formatInteger, formatTon } from '../lib/format'
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
  onRetryTrades,
  onRetryBook,
  banner,
  extra,
}: MarketDetailScreenProps) {
  const t = useT()
  const [side, setSide] = useState<OutcomeSide>(selectedSide)
  const [localPane, setLocalPane] = useState<MarketDetailPane>('chart')
  const activeSide = onSelectSide ? selectedSide : side
  const selected = activeSide === 'a' ? market.outcomeA : market.outcomeB
  const series = activeSide === 'a' ? chartSeriesA : chartSeriesB
  const activePane = pane ?? localPane
  const locked = marketIsLocked(market)
  const actionsOff = actionsDisabled || locked
  const resolutionBits = [market.description, market.resolution]
    .map((value) => (value || '').trim())
    .filter(Boolean)

  const setPane = (next: MarketDetailPane) => {
    if (onPaneChange) onPaneChange(next)
    else setLocalPane(next)
  }

  const chooseSide = (next: OutcomeSide) => {
    if (locked) return
    if (onSelectSide) onSelectSide(next)
    else setSide(next)
  }

  const buy = (next: OutcomeSide) => {
    chooseSide(next)
    onPlace?.()
  }

  if (viewState !== 'ready') {
    const title =
      viewState === 'not-found'
        ? t('err.missing')
        : viewState === 'forbidden'
          ? t('err.forbidden')
          : viewState === 'loading'
            ? t('loading')
            : t('err.request')
    const body =
      viewState === 'not-found'
        ? t('err.missingBody')
        : viewState === 'forbidden'
          ? t('err.forbiddenBody')
          : viewState === 'loading'
            ? t('loading.body')
            : t('err.requestBody')

    return (
      <div className={styles.screen}>
        <header className={styles.simpleHeader}>
          <button type="button" className={styles.back} onClick={onBack}>‹</button>
          <strong>{t('event.title')}</strong>
        </header>
        <main className={styles.body}>
          <StatusMessage tone={viewState === 'loading' ? 'loading' : 'error'} title={title}>
            {body}
          </StatusMessage>
          {viewState === 'error' && onRetry ? (
            <Button variant="secondary" onClick={onRetry}>{t('retry')}</Button>
          ) : null}
        </main>
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <button type="button" className={styles.back} onClick={onBack}>‹</button>
          <h1>{market.question}</h1>
          {shareAvailable && onShare ? (
            <button type="button" className={styles.more} aria-label={t('share')} onClick={onShare}>•••</button>
          ) : (
            <span className={styles.morePlaceholder}>•••</span>
          )}
        </div>
        <button
          type="button"
          className={styles.marketMeta}
          onClick={onCreatorClick}
          disabled={!onCreatorClick}
        >
          @{market.creator.handle} · {categoryLabel(market, t)} · {market.closeLabel}
        </button>
      </header>

      <main className={styles.scroll}>
        <div className={styles.body}>
          {banner}

          <section className={styles.section}>
            <span className={styles.eyebrow}>ТЕКУЩИЕ ПРЕДЛОЖЕНИЯ</span>
            <div className={styles.outcomes}>
              <OutcomeQuote
                label={market.outcomeA.label}
                odds={market.outcomeA.odds}
                liquidity={market.outcomeA.liquidityTon}
                side="a"
                density="feed"
                state={marketOutcomeQuoteState(market, 'a', null)}
                onClick={() => chooseSide('a')}
              />
              <OutcomeQuote
                label={market.outcomeB.label}
                odds={market.outcomeB.odds}
                liquidity={market.outcomeB.liquidityTon}
                side="b"
                density="feed"
                state={marketOutcomeQuoteState(market, 'b', null)}
                onClick={() => chooseSide('b')}
              />
            </div>
          </section>

          {activePane === 'book' ? (
            <section className={styles.section}>
              <div className={styles.sectionTitleRow}>
                <h2>Стакан</h2>
                <button type="button" onClick={() => setPane('chart')}>Назад к обзору</button>
              </div>
              <OrderBookPanel
                outcomeALabel={market.outcomeA.label}
                outcomeBLabel={market.outcomeB.label}
                sideA={orderbookA ?? []}
                sideB={orderbookB ?? []}
                state={orderbookState === 'loading' || orderbookState === 'error' ? orderbookState : 'ready'}
                hint={t('book.depthHint')}
                onRetry={onRetryBook ?? onRetry}
              />
            </section>
          ) : (
            <>
              <section className={styles.section}>
                <h2 className={styles.historyTitle}>Коэффициент по сделкам · {selected.label}</h2>
                {tradeHistoryState === 'loading' ? (
                  <StatusMessage tone="loading" title={t('loading')}>{t('loading.body')}</StatusMessage>
                ) : tradeHistoryState === 'error' ? (
                  <div className={styles.retryBlock}>
                    <StatusMessage tone="error" title={t('event.tradesError')} />
                    {onRetryTrades ? <Button variant="secondary" onClick={onRetryTrades}>{t('retry')}</Button> : null}
                  </div>
                ) : tradeHistoryState === 'ready' && series.length > 0 ? (
                  <MarketChart
                    series={series}
                    currentOdds={series[series.length - 1]?.odds ?? selected.odds ?? 0}
                    outcomeLabel={selected.label}
                    volumeTon={market.volumeTon}
                    title={'Коэффициент по сделкам · ' + selected.label}
                  />
                ) : (
                  <>
                    <div className={styles.historyEmpty}>История сделок недоступна</div>
                    <p className={styles.lastTrade}>Последняя сделка: нет данных</p>
                  </>
                )}
              </section>

              <dl className={styles.metrics}>
                <div>
                  <dt>ОБЪЁМ СДЕЛОК</dt>
                  <dd>{formatTon(market.volumeTon)}</dd>
                </div>
                <div>
                  <dt>УЧАСТНИКИ</dt>
                  <dd>{formatInteger(market.participants)}</dd>
                </div>
                <div>
                  <dt>ЗАКРЫТИЕ</dt>
                  <dd>{market.closeLabel}</dd>
                </div>
              </dl>

              {resolutionBits.length > 0 ? (
                <section className={styles.criteria}>
                  <span className={styles.eyebrow}>КРИТЕРИИ · ИСТОЧНИК</span>
                  {resolutionBits.map((text) => <p key={text}>{text}</p>)}
                </section>
              ) : null}

              <MarketStatusPanel market={market} />

              <div className={styles.buyActions}>
                <button
                  type="button"
                  className={styles.buyA}
                  disabled={actionsOff}
                  onClick={() => buy('a')}
                >
                  Купить «{market.outcomeA.label}»
                </button>
                <button
                  type="button"
                  className={styles.buyB}
                  disabled={actionsOff}
                  onClick={() => buy('b')}
                >
                  Купить «{market.outcomeB.label}»
                </button>
              </div>

              <div className={styles.destinations}>
                <Button variant="secondary" fullWidth onClick={() => setPane('book')}>
                  Стакан
                </Button>
                <Button variant="secondary" fullWidth disabled={actionsOff} onClick={onOwnPrice}>
                  Своя цена
                </Button>
              </div>

              {extra}
            </>
          )}
        </div>
      </main>
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
