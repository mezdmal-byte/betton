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
import type { ChartPoint, MarketFixture, OrderBookLevel, OutcomeSide, RecentTrade } from '../types/market'
import styles from './MarketDetailScreen.module.css'

export type MarketDetailViewState = 'ready' | 'loading' | 'not-found' | 'forbidden' | 'error'
export type MarketDetailPane = 'chart' | 'book' | 'trades' | 'criteria' | 'sources' | 'share'
export type TradeHistoryState = 'hidden' | 'loading' | 'empty' | 'ready' | 'error'

export type MarketDetailScreenProps = {
  market?: MarketFixture
  selectedSide?: OutcomeSide
  chartSeriesA?: ChartPoint[]
  chartSeriesB?: ChartPoint[]
  recentTradesA?: RecentTrade[]
  recentTradesB?: RecentTrade[]
  priceHistoryAvailable?: boolean
  tradeHistoryState?: TradeHistoryState
  demoHistory?: boolean
  chartVolumeTon?: number
  orderbookA?: OrderBookLevel[]
  orderbookB?: OrderBookLevel[]
  orderbookState?: 'ready' | 'loading' | 'error'
  pane?: MarketDetailPane
  onPaneChange?: (pane: MarketDetailPane) => void
  viewState?: MarketDetailViewState
  actionsDisabled?: boolean
  showInternalBack?: boolean
  discussionUnreadReplies?: number
  onDiscussion?: () => void
  onBack?: () => void
  onSelectSide?: (side: OutcomeSide) => void
  onOwnPrice?: () => void
  onPlace?: () => void
  onRetry?: () => void
  onCreatorClick?: () => void
  onShare?: () => void
  onExternalShare?: () => void
  shareAvailable?: boolean
  shareValue?: string
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
  recentTradesA = [],
  recentTradesB = [],
  tradeHistoryState = 'hidden',
  demoHistory = false,
  chartVolumeTon,
  orderbookA,
  orderbookB,
  orderbookState,
  pane,
  onPaneChange,
  viewState = 'ready',
  actionsDisabled = false,
  showInternalBack = true,
  discussionUnreadReplies = 0,
  onDiscussion,
  onBack,
  onSelectSide,
  onOwnPrice,
  onPlace,
  onRetry,
  onCreatorClick,
  onShare,
  onExternalShare,
  shareAvailable = false,
  shareValue = '',
  onRetryTrades,
  onRetryBook,
  banner,
  extra,
}: MarketDetailScreenProps) {
  const t = useT()
  const [side, setSide] = useState<OutcomeSide>(selectedSide)
  const [localPane, setLocalPane] = useState<MarketDetailPane>('chart')
  const [historyOpen, setHistoryOpen] = useState(false)
  const activeSide = onSelectSide ? selectedSide : side
  const selected = activeSide === 'a' ? market.outcomeA : market.outcomeB
  const series = activeSide === 'a' ? chartSeriesA : chartSeriesB
  const recentTrades = activeSide === 'a' ? recentTradesA : recentTradesB
  const activePane = pane ?? localPane
  const locked = marketIsLocked(market)
  const actionsOff = actionsDisabled || locked
  const structured = parseMarketDescription(market.description)
  const criteriaText = structured.criteria || structured.body || market.resolution || ''
  const sourceRows = [structured.primarySource, structured.additionalSource].filter(Boolean)
  const resolutionBits = [criteriaText, market.resolution]
    .map((value) => (value || '').trim())
    .filter((value, index, all) => Boolean(value) && all.indexOf(value) === index)

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
          {showInternalBack ? <button type="button" className={styles.back} onClick={onBack}>‹</button> : null}
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
          {showInternalBack ? <button type="button" className={styles.back} onClick={onBack}>‹</button> : null}
          <h1>{market.question}</h1>
          {shareAvailable && onShare ? (
            <button type="button" className={styles.more} aria-label={t('share')} onClick={() => setPane('share')}>•••</button>
          ) : null}
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
                {showInternalBack ? <button type="button" onClick={() => setPane('chart')}>Назад к обзору</button> : null}
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
          ) : activePane === 'trades' ? (
            <section className={styles.supportingPane}>
              <div className={styles.supportingHeader}>
                <div>
                  <strong>Исполненные сделки</strong>
                  <span>{market.question}</span>
                </div>
                {showInternalBack ? <button type="button" onClick={() => setPane('chart')}>← Назад</button> : null}
              </div>
              <h2 className={styles.historyTitle}>История коэффициента по исполненным сделкам · {selected.label}</h2>
              <p className={styles.chartExplanation}>
                Линия — коэффициент каждой исполненной сделки. Столбики снизу — объём этой сделки.
              </p>
              {tradeHistoryState === 'ready' && series.length > 0 ? (
                <MarketChart
                  series={series}
                  currentOdds={series[series.length - 1]?.odds ?? selected.odds ?? 0}
                  outcomeLabel={selected.label}
                  volumeTon={chartVolumeTon ?? market.volumeTon}
                  title={'Коэффициент по сделкам · ' + selected.label}
                  demo={demoHistory}
                />
              ) : (
                <div className={styles.historyEmpty}>История сделок недоступна</div>
              )}
              <p className={styles.supportingNote}>
                Здесь отображаются только уже исполненные сделки выбранного исхода.
                {demoHistory ? ' Сейчас показаны демонстрационные данные preview-рынка.' : ''}
              </p>
              {recentTrades.length > 0 ? (
                <div className={styles.tradeList}>
                  {recentTrades.map((trade) => (
                    <div key={trade.id} className={styles.tradeRow}>
                      <strong>{trade.odds.toFixed(2)}×</strong>
                      <span>{formatTon(trade.amountTon)}</span>
                      <small>{trade.timeAgo}</small>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ) : activePane === 'criteria' ? (
            <section className={styles.supportingPane}>
              <div className={styles.supportingHeader}>
                <div>
                  <strong>Критерии решения</strong>
                  <span>Проверяемое условие исхода</span>
                </div>
                {showInternalBack ? <button type="button" onClick={() => setPane('chart')}>← Назад</button> : null}
              </div>
              <InformationRows
                rows={criteriaText ? splitInformation(criteriaText) : ['Критерии результата не указаны.']}
              />
              <Button variant="secondary" fullWidth onClick={() => setPane('sources')}>
                Источники
              </Button>
            </section>
          ) : activePane === 'sources' ? (
            <section className={styles.supportingPane}>
              <div className={styles.supportingHeader}>
                <div>
                  <strong>Источники</strong>
                  <span>Материалы для оценки события</span>
                </div>
                {showInternalBack ? <button type="button" onClick={() => setPane('criteria')}>← Назад</button> : null}
              </div>
              <InformationRows
                rows={sourceRows.length > 0 ? sourceRows : ['Источник результата не указан.']}
              />
            </section>
          ) : activePane === 'share' ? (
            <section className={styles.supportingPane}>
              <div className={styles.supportingHeader}>
                <div>
                  <strong>Поделиться</strong>
                  <span>Ссылка на рынок</span>
                </div>
                {showInternalBack ? <button type="button" onClick={() => setPane('chart')}>← Назад</button> : null}
              </div>
              {shareValue ? (
                <input
                  className={styles.shareInput}
                  readOnly
                  value={shareValue}
                  onFocus={(event) => event.currentTarget.select()}
                />
              ) : null}
              <InformationRows rows={['Скопировать ссылку', 'Отправить в Telegram']} />
              <Button fullWidth onClick={onShare}>Скопировать ссылку</Button>
              <Button variant="secondary" fullWidth disabled={!onExternalShare} onClick={onExternalShare}>
                Отправить в Telegram
              </Button>
            </section>
          ) : (
            <>
              <section className={styles.section}>
                <button
                  type="button"
                  className={styles.historyDisclosure}
                  aria-expanded={historyOpen}
                  onClick={() => setHistoryOpen((open) => !open)}
                >
                  <span>
                    <strong>История коэффициента</strong>
                    <small>По исполненным сделкам · {selected.label}</small>
                  </span>
                  <b>{historyOpen ? 'Скрыть ↑' : 'Показать ›'}</b>
                </button>

                {historyOpen ? (
                  <div className={styles.historyContent}>
                    <div className={styles.historyTools}>
                      <p className={styles.chartExplanation}>
                        Линия — коэффициент сделки. Столбики снизу — объём каждой сделки.
                      </p>
                      <button type="button" onClick={() => setPane('trades')}>Все сделки</button>
                    </div>
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
                        volumeTon={chartVolumeTon ?? market.volumeTon}
                        title={'История коэффициента · ' + selected.label}
                        demo={demoHistory}
                      />
                    ) : (
                      <>
                        <div className={styles.historyEmpty}>Исполненных сделок пока нет</div>
                        <p className={styles.lastTrade}>График появится после первой сделки.</p>
                      </>
                    )}
                  </div>
                ) : null}
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
                  <dd>{market.closeAtLabel ?? market.closeLabel}</dd>
                </div>
              </dl>

              {resolutionBits.length > 0 ? (
                <section className={styles.criteria}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.eyebrow}>КРИТЕРИИ · ИСТОЧНИК</span>
                    <button type="button" onClick={() => setPane('criteria')}>Подробнее</button>
                  </div>
                  {resolutionBits.map((text) => <p key={text}>{text}</p>)}
                </section>
              ) : null}

              {onDiscussion ? (
                <button type="button" className={styles.discussionRow} onClick={onDiscussion}>
                  <span>
                    <strong>Обсуждение</strong>
                    <small>Сообщения и ответы по этому событию</small>
                  </span>
                  <span className={styles.discussionAction}>
                    {discussionUnreadReplies > 0 ? (
                      <b>{discussionUnreadReplies > 9 ? '9+' : discussionUnreadReplies}</b>
                    ) : null}
                    <em>Открыть ›</em>
                  </span>
                </button>
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


function InformationRows({ rows }: { rows: string[] }) {
  return (
    <div className={styles.informationRows}>
      {rows.map((row, index) => (
        <div key={String(index) + row}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <p>{row}</p>
        </div>
      ))}
    </div>
  )
}

function parseMarketDescription(description: string): {
  body: string
  criteria: string
  primarySource: string
  additionalSource: string
} {
  const parts = (description || '')
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
  let criteria = ''
  let primarySource = ''
  let additionalSource = ''
  const body: string[] = []
  for (const part of parts) {
    if (part.startsWith('Критерии результата:')) {
      criteria = part.slice('Критерии результата:'.length).trim()
    } else if (part.startsWith('Основной источник:')) {
      primarySource = part.slice('Основной источник:'.length).trim()
    } else if (part.startsWith('Дополнительный источник:')) {
      additionalSource = part.slice('Дополнительный источник:'.length).trim()
    } else {
      body.push(part)
    }
  }
  return { body: body.join('\n\n'), criteria, primarySource, additionalSource }
}

function splitInformation(value: string): string[] {
  return value
    .split(/\n+|(?<=[.!?])\s+(?=[А-ЯA-Z0-9])/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function categoryLabel(market: MarketFixture, t: (key: MessageKey) => string): string {
  if (market.categoryKey === 'sport') return t('cat.sport')
  if (market.categoryKey === 'politics') return t('cat.politics')
  if (market.categoryKey === 'crypto') return t('cat.crypto')
  if (market.categoryKey === 'unique') return t('cat.other')
  return market.category
}
