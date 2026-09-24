import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  mapAccountOut,
  mapMarketOut,
  mapOpenOrder,
  mapOrderPreview,
  mapPositions,
  mapTradesToChartPoints,
  moneyForOrder,
} from '../../api/adapters'
import { getMarket, getMarketTrades, getOrderbook, listMarkets } from '../../api/markets'
import { listOrders, previewOrder } from '../../api/orders'
import { listPositions } from '../../api/portfolio'
import { iocDiscoveryOdds } from '../../lib/quickTrade'
import { bootTelegramWebApp, hasTelegramInitData } from '../../telegram/webapp'
import type { ChartPoint, MarketFixture, OutcomeSide } from '../../types/market'
import { useAccount, useSession } from '../../app/session'
import {
  AppShell,
  Button,
  Card,
  IconButton,
  MarketRow,
  Metric,
  ProbabilityDisplay,
  SegmentedControl,
  TopBar,
} from '../figma-theme-pilot/components'
import { SCREENS, type Market, type Screen } from '../figma-theme-pilot/fixture'
import { useTheme } from '../figma-theme-pilot/ThemeProvider'
import styles from '../figma-theme-pilot/Pilot.module.css'
import live from './LivePilot.module.css'

type RouteState = {
  screen: Screen
  market: string
  side: OutcomeSide
}

const number = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 })
const pct = (odds: number | null | undefined) =>
  odds && Number.isFinite(odds) && odds > 0 ? Math.max(1, Math.min(99, Math.round(100 / odds))) : 50

const ton = (value: number | null | undefined) =>
  value == null || !Number.isFinite(value) ? '—' : `${number.format(value)} TON`

const oddsLabel = (value: number | null | undefined) =>
  value == null || !Number.isFinite(value) ? '—' : `${value.toFixed(2).replace('.', ',')}×`

function readRoute(): RouteState {
  const params = new URLSearchParams(location.search)
  const candidate = params.get('screen') as Screen
  const side = params.get('side') === 'b' ? 'b' : 'a'
  return {
    screen: SCREENS.includes(candidate) ? candidate : 'markets',
    market: params.get('market') ?? '',
    side,
  }
}

function marketToPilot(market: MarketFixture): Market {
  const liquidity = (market.outcomeA.liquidityTon ?? 0) + (market.outcomeB.liquidityTon ?? 0)
  const creator = market.creator.handle ? `@${market.creator.handle.replace(/^@/, '')}` : undefined
  return {
    id: market.id,
    category: market.category.toUpperCase(),
    creator,
    question: market.question,
    detailQuestion: market.question,
    context: [creator, market.category, market.closeLabel].filter(Boolean).join(' · '),
    meta: `Ликвидность ${ton(liquidity)} · объём ${ton(market.volumeTon)} · ${market.closeLabel}`,
    probability: pct(market.outcomeA.odds),
    movement: '—',
    trend: 'none',
    liquidity: ton(liquidity),
    volume: ton(market.volumeTon),
    close: market.timeLeft || market.closeLabel,
    criteria: market.description || market.resolution || 'Критерий расчёта пока не указан.',
  }
}

function addMovement(market: Market, points: ChartPoint[]): Market {
  if (points.length < 2) return market
  const first = pct(points[0]?.odds)
  const last = pct(points[points.length - 1]?.odds)
  const delta = last - first
  if (delta === 0) return { ...market, probability: last, movement: '—', trend: 'none' }
  return {
    ...market,
    probability: last,
    movement: `${delta > 0 ? '+' : '−'}${Math.abs(delta)} п.п.`,
    trend: delta > 0 ? 'up' : 'down',
  }
}

function LiveThemeButton() {
  const { theme, setTheme } = useTheme()
  return (
    <button
      type="button"
      className={live.themeSwitch}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Переключить тему"
      title="Dark A / Light C"
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  )
}

function LiveChart({ points }: { points: ChartPoint[] }) {
  const geometry = useMemo(() => {
    if (points.length < 2) return null
    const values = points.map((point) => pct(point.odds))
    const min = Math.max(0, Math.min(...values) - 4)
    const max = Math.min(100, Math.max(...values) + 4)
    const spread = Math.max(1, max - min)
    const coords = values.map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 340
      const y = 70 - ((value - min) / spread) * 62
      return [x, y] as const
    })
    const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
    const area = `0,78 ${line} 340,78`
    return { line, area }
  }, [points])

  return (
    <figure className={styles.chart} aria-label="Вероятность по реальным сделкам">
      <figcaption>
        <span>Вероятность · сделки</span>
        <span>real data</span>
      </figcaption>
      <div className={styles.plot}>
        {geometry ? (
          <svg className={live.chartSvg} viewBox="0 0 340 78" preserveAspectRatio="none" aria-hidden="true">
            <polygon className={live.chartArea} points={geometry.area} />
            <polyline className={live.chartLine} points={geometry.line} />
          </svg>
        ) : (
          <div className={live.chartEmpty}>Пока недостаточно сделок для графика</div>
        )}
      </div>
    </figure>
  )
}

export function LivePilot() {
  const [route, setRoute] = useState<RouteState>(readRoute)
  const [filter, setFilter] = useState('Все')
  const [notice, setNotice] = useState('')
  const [amount, setAmount] = useState(25)
  const [hasInitData, setHasInitData] = useState(() => hasTelegramInitData())

  useEffect(() => {
    bootTelegramWebApp()
    setHasInitData(hasTelegramInitData())
  }, [])

  useEffect(() => {
    const sync = () => {
      setRoute(readRoute())
      setNotice('')
    }
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  const session = useSession(hasInitData)
  const accountQuery = useAccount(session.user?.id)
  const account = useMemo(
    () => (accountQuery.data ? mapAccountOut(accountQuery.data) : null),
    [accountQuery.data],
  )
  const userId = session.user?.id

  const marketsQuery = useQuery({
    queryKey: ['figma-live', 'markets'],
    queryFn: () => listMarkets({ sort: 'new', status: 'open', limit: 20, offset: 0 }),
  })

  const marketFixtures = useMemo(
    () => (marketsQuery.data?.items ?? []).map((item) => mapMarketOut(item, new Date(), 'ru')),
    [marketsQuery.data],
  )
  const pilotMarkets = useMemo(() => marketFixtures.map(marketToPilot), [marketFixtures])
  const visibleMarkets = useMemo(() => {
    if (filter === 'Популярное') {
      return [...pilotMarkets].sort((a, b) => {
        const sourceA = marketFixtures.find((item) => item.id === a.id)?.volumeTon ?? 0
        const sourceB = marketFixtures.find((item) => item.id === b.id)?.volumeTon ?? 0
        return sourceB - sourceA
      })
    }
    if (filter === 'Скоро') {
      return pilotMarkets.filter((item) => marketFixtures.find((source) => source.id === item.id)?.status === 'closing')
    }
    return pilotMarkets
  }, [filter, marketFixtures, pilotMarkets])

  const marketId = Number(route.market)
  const needsMarket = route.screen === 'detail' || route.screen === 'quick'
  const marketQuery = useQuery({
    queryKey: ['figma-live', 'market', marketId],
    queryFn: () => getMarket(marketId),
    enabled: needsMarket && Number.isFinite(marketId),
  })
  const bookQuery = useQuery({
    queryKey: ['figma-live', 'book', marketId],
    queryFn: () => getOrderbook(marketId),
    enabled: needsMarket && Number.isFinite(marketId),
  })
  const tradesQuery = useQuery({
    queryKey: ['figma-live', 'trades', marketId],
    queryFn: () => getMarketTrades(marketId),
    enabled: needsMarket && Number.isFinite(marketId),
  })

  const detailFixture = useMemo(
    () => (marketQuery.data ? mapMarketOut(marketQuery.data, new Date(), 'ru') : null),
    [marketQuery.data],
  )
  const chartA = useMemo(() => mapTradesToChartPoints(tradesQuery.data, 0), [tradesQuery.data])
  const detailMarket = useMemo(
    () => (detailFixture ? addMovement(marketToPilot(detailFixture), chartA) : null),
    [chartA, detailFixture],
  )

  const positionsQuery = useQuery({
    queryKey: ['figma-live', 'positions', userId ?? 'guest'],
    queryFn: () => listPositions(userId as number),
    enabled: Boolean(userId),
  })
  const ordersQuery = useQuery({
    queryKey: ['figma-live', 'orders', userId ?? 'guest'],
    queryFn: () => listOrders(userId as number),
    enabled: Boolean(userId),
  })
  const positions = useMemo(
    () => (positionsQuery.data ?? []).flatMap(mapPositions),
    [positionsQuery.data],
  )
  const orders = useMemo(
    () => (ordersQuery.data ?? []).map(mapOpenOrder).filter((item): item is NonNullable<typeof item> => item != null),
    [ordersQuery.data],
  )

  const sideIndex = route.side === 'a' ? 0 : 1
  const sideLevels =
    bookQuery.data?.available_to_me?.[sideIndex]?.length
      ? bookQuery.data.available_to_me[sideIndex]
      : bookQuery.data?.sides?.[sideIndex] ?? []
  const bestOdds = sideLevels[0]?.odds ?? (
    route.side === 'a' ? detailFixture?.outcomeA.odds : detailFixture?.outcomeB.odds
  ) ?? null
  const availableTon = sideLevels.reduce((sum, level) => sum + Number(level.available || 0), 0)
  const discoveryOdds = iocDiscoveryOdds()
  const quickPreviewQuery = useQuery({
    queryKey: ['figma-live', 'quote', marketId, sideIndex, amount],
    queryFn: () => previewOrder(
      marketId,
      { outcome: sideIndex, money: moneyForOrder(amount), odds: discoveryOdds, kind: 'ioc' },
    ),
    enabled: route.screen === 'quick' && Boolean(userId) && Number.isFinite(marketId) && amount > 0 && bestOdds != null,
  })
  const quote = quickPreviewQuery.data ? mapOrderPreview(quickPreviewQuery.data) : null
  const matched = quote?.matchedTon ?? Math.min(amount, availableTon)
  const averageOdds = quote?.averageOdds ?? bestOdds
  const payout = quote?.payoutTon ?? (averageOdds ? matched * averageOdds : 0)
  const worstOdds = quote?.worstOdds ?? bestOdds

  function navigate(screen: Screen, nextMarket = route.market, side: OutcomeSide = route.side) {
    const url = new URL(location.href)
    url.searchParams.set('screen', screen)
    if (nextMarket) url.searchParams.set('market', nextMarket)
    else url.searchParams.delete('market')
    url.searchParams.set('side', side)
    history.pushState(null, '', url)
    setRoute({ screen, market: nextMarket, side })
    setNotice('')
  }

  function openMarket(id: string) {
    navigate('detail', id, 'a')
  }

  const excluded = () => setNotice('Этот раздел пока не перенесён в Figma UI integration preview.')

  const totalVolume = marketFixtures.reduce((sum, item) => sum + item.volumeTon, 0)
  const bookA = bookQuery.data?.sides?.[0]?.[0]?.odds ?? null
  const bookB = bookQuery.data?.sides?.[1]?.[0]?.odds ?? null
  const latestA = chartA[chartA.length - 1]

  return (
    <AppShell
      screen={route.screen}
      navigate={(screen) => navigate(screen)}
      notice={notice}
      dismissNotice={() => setNotice('')}
      showStatusBar={false}
    >
      {route.screen === 'markets' ? (
        <>
          <TopBar
            title="Рынки"
            context="Реальные рынки BetTON · preview"
            action={
              <div className={live.topActions}>
                <span className={live.dataBadge}><span className={live.liveDot} />LIVE</span>
                <LiveThemeButton />
              </div>
            }
          />
          <main className={styles.marketsMain}>
            <div className={styles.feedSummary}>
              <div>
                <p>{ton(totalVolume)}</p>
                <span>объём открытых рынков</span>
              </div>
              <IconButton name="filter" label="Фильтры" onClick={excluded} />
            </div>
            <SegmentedControl items={['Все', 'Популярное', 'Скоро']} value={filter} onChange={setFilter} />
            {marketsQuery.isPending ? <div className={live.state}><strong>Загружаю рынки</strong>Данные идут из текущего BetTON API.</div> : null}
            {marketsQuery.isError ? <div className={live.state}><strong>Не удалось загрузить рынки</strong>Обновите страницу или проверьте preview API.</div> : null}
            {!marketsQuery.isPending && !marketsQuery.isError && visibleMarkets.length === 0 ? (
              <div className={live.state}><strong>Рынков нет</strong>Для выбранного фильтра пока нет открытых событий.</div>
            ) : null}
            <div className={styles.marketList}>
              {visibleMarkets.map((market) => <MarketRow key={market.id} market={market} onOpen={() => openMarket(market.id)} />)}
            </div>
          </main>
        </>
      ) : null}

      {route.screen === 'detail' ? (
        <>
          <TopBar
            kind="detail"
            title={detailMarket?.detailQuestion ?? 'Событие'}
            context={detailMarket?.context ?? 'Загрузка реальных данных…'}
            back={() => navigate('markets')}
            action={<LiveThemeButton />}
          />
          {marketQuery.isPending ? <div className={live.state}><strong>Загружаю событие</strong>Получаю рынок, стакан и историю сделок.</div> : null}
          {marketQuery.isError ? <div className={live.state}><strong>Событие недоступно</strong>Не удалось получить данные рынка.</div> : null}
          {detailMarket && detailFixture ? (
            <main className={styles.detailMain}>
              <div className={styles.probabilitySummary}>
                <ProbabilityDisplay market={detailMarket} large />
                <div className={styles.coefficient}>
                  <span>{oddsLabel(detailFixture.outcomeA.odds)}</span>
                  <small>по лучшему предложению</small>
                </div>
              </div>
              <LiveChart points={chartA} />
              <div className={styles.metrics}>
                <Metric label="ЛИКВИДНОСТЬ" value={detailMarket.liquidity} />
                <Metric label="ОБЪЁМ" value={detailMarket.volume} />
                <Metric label="ЗАКРЫТИЕ" value={detailMarket.close} />
              </div>
              <section className={styles.criteria}>
                <h2>КРИТЕРИЙ · ИСТОЧНИК</h2>
                <p>{detailMarket.criteria}</p>
              </section>
              <div className={styles.metrics}>
                <Metric label="СТАКАН" value={bookA || bookB ? `${bookA ? pct(bookA) : '—'}% / ${bookB ? pct(bookB) : '—'}%` : '—'} />
                <Metric label="ПОСЛЕДНЯЯ СДЕЛКА" value={latestA ? `${pct(latestA.odds)}% · ${ton(latestA.volume)}` : '—'} />
              </div>
              <div className={styles.tradeActions}>
                <Button tone="yes" onClick={() => navigate('quick', route.market, 'a')}>Купить ДА</Button>
                <Button tone="no" onClick={() => navigate('quick', route.market, 'b')}>Купить НЕТ</Button>
              </div>
              <div className={styles.secondaryActions}>
                <button type="button" onClick={excluded}>Своя цена</button>
                <button type="button" onClick={excluded}>Поделиться ↗</button>
              </div>
            </main>
          ) : null}
        </>
      ) : null}

      {route.screen === 'quick' ? (
        <>
          <TopBar
            kind="trade"
            title="Быстрый вход"
            context={(detailFixture?.question ?? 'Событие').toUpperCase()}
            action={<LiveThemeButton />}
          />
          <main className={styles.quickMain}>
            <SegmentedControl
              trade
              items={[
                `${detailFixture?.outcomeA.label ?? 'ДА'} · ${pct(detailFixture?.outcomeA.odds)}%`,
                `${detailFixture?.outcomeB.label ?? 'НЕТ'} · ${pct(detailFixture?.outcomeB.odds)}%`,
              ]}
              value={route.side === 'a'
                ? `${detailFixture?.outcomeA.label ?? 'ДА'} · ${pct(detailFixture?.outcomeA.odds)}%`
                : `${detailFixture?.outcomeB.label ?? 'НЕТ'} · ${pct(detailFixture?.outcomeB.odds)}%`}
              onChange={(value) => navigate('quick', route.market, value.startsWith(detailFixture?.outcomeB.label ?? 'НЕТ') ? 'b' : 'a')}
            />
            <label className={live.quickInput}>
              <span>Сумма покупки · баланс {account ? ton(account.availableTon) : 'откройте в Telegram'}</span>
              <input
                inputMode="decimal"
                aria-label="Сумма покупки, TON"
                value={Number.isFinite(amount) ? String(amount).replace('.', ',') : ''}
                onChange={(event) => {
                  const next = Number.parseFloat(event.target.value.replace(',', '.'))
                  setAmount(Number.isFinite(next) ? Math.max(0, next) : 0)
                }}
              />
            </label>
            <dl className={styles.tradeDetails}>
              <div><dt>Вероятность по стакану</dt><dd>{bestOdds ? `${pct(bestOdds)}%` : '—'}</dd></div>
              <div><dt>Доступно в стакане</dt><dd>{ton(availableTon)}</dd></div>
              <div><dt>Средний коэффициент</dt><dd>{oddsLabel(averageOdds)}</dd></div>
              <div><dt>Худший коэффициент</dt><dd>{oddsLabel(worstOdds)}</dd></div>
              <div><dt>Исполнится сейчас</dt><dd>{quickPreviewQuery.isFetching ? '…' : ton(matched)}</dd></div>
              <div><dt>Выплата до комиссии</dt><dd>{quickPreviewQuery.isFetching ? '…' : ton(payout)}</dd></div>
            </dl>
            <Card title="Быстрый вход · IOC">
              Котировка берётся из реального стакана. В этом integration preview денежная заявка намеренно не отправляется.
            </Card>
            {quickPreviewQuery.isError ? <p className={live.inlineError}>Не удалось получить персональную котировку. Показана доступная публичная ликвидность.</p> : null}
            <div className={styles.actionArea}>
              <Button
                disabled={!bestOdds || amount <= 0}
                onClick={() => setNotice('Реальные данные подключены, но сделки в этом preview отключены. Полное подключение сделает Work после визуального подтверждения.')}
              >
                Проверить покупку
              </Button>
              <Button tone="quiet" onClick={() => navigate('detail', route.market, route.side)}>Назад к рынку</Button>
            </div>
          </main>
        </>
      ) : null}

      {route.screen === 'portfolio' ? (
        <>
          <TopBar kind="portfolio" title="Портфель" context="РЕАЛЬНЫЕ ДАННЫЕ" action={<LiveThemeButton />} />
          <main className={styles.portfolioMain}>
            <div className={styles.balance}>
              <p>{account ? ton(account.availableTon) : '—'}</p>
              <span>доступно</span>
            </div>
            <div className={styles.portfolioMetrics}>
              <Metric portfolio label="В позициях" value={account ? ton(account.inPositionsTon) : '—'} />
              <Metric portfolio label="В ордерах" value={account ? ton(account.inOrdersTon) : '—'} />
              <Metric portfolio label="Экспозиция" value={account ? ton(account.inPositionsTon + account.inOrdersTon) : '—'} />
            </div>
            {!hasInitData ? (
              <Card title="Telegram auth">
                Откройте эту preview-ссылку внутри Telegram Mini App, чтобы увидеть личный баланс, позиции и ордера.
              </Card>
            ) : null}
            {session.isLoading || accountQuery.isPending || positionsQuery.isPending || ordersQuery.isPending ? (
              <div className={live.state}><strong>Загружаю портфель</strong>Получаю аккаунт, позиции и открытые ордера.</div>
            ) : null}
            <div className={styles.sectionHeading}><h2>Позиции</h2><button type="button" onClick={excluded}>Все →</button></div>
            {positions[0] ? (
              <button type="button" className={styles.positionRow} onClick={() => navigate('detail', String(positions[0].marketId))}>
                <strong>{positions[0].outcomeLabel} · {positions[0].question}</strong>
                <span>{ton(positions[0].amountTon)} · средний коэф. {oddsLabel(positions[0].avgOdds)}</span>
              </button>
            ) : (
              <div className={live.state}>Открытых позиций нет.</div>
            )}
            <div className={styles.sectionHeading}><h2>Открытые ордера</h2><button type="button" onClick={excluded}>Все →</button></div>
            {orders[0] ? (
              <button type="button" className={styles.orderRow} onClick={() => navigate('detail', String(orders[0].marketId))}>
                <strong>Купить {orders[0].outcomeLabel} · {orders[0].question}</strong>
                <span>{oddsLabel(orders[0].odds)} · исполнено {ton(orders[0].filledTon)} · остаток {ton(orders[0].remainingTon)}</span>
              </button>
            ) : (
              <div className={live.state}>Открытых ордеров нет.</div>
            )}
          </main>
        </>
      ) : null}

      {(['create', 'notifications', 'profile'] as Screen[]).includes(route.screen) ? (
        <>
          <TopBar
            kind="portfolio"
            title={{ create: 'Create', notifications: 'Notifications', profile: 'Profile' }[route.screen as 'create' | 'notifications' | 'profile']}
            context="FIGMA UI INTEGRATION"
            action={<LiveThemeButton />}
          />
          <main className={styles.placeholder}>
            <p className={live.placeholderTitle}>Этот раздел пока оставили за пределами 4-screen pilot.</p>
            <p>После подтверждения Dark/Light передадим Work перенос всего приложения.</p>
            <Button tone="quiet" onClick={() => navigate('markets')}>К рынкам</Button>
          </main>
        </>
      ) : null}
    </AppShell>
  )
}
