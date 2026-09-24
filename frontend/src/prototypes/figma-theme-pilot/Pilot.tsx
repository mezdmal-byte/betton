import { useEffect, useState } from 'react'
import { MARKETS, SCREENS, TRADE_DETAILS, type Screen } from './fixture'
import { AmountInput, AppShell, Button, Card, HistoryChart, IconButton, MarketRow, Metric, ProbabilityDisplay, SegmentedControl, TopBar } from './components'
import styles from './Pilot.module.css'

function readRoute() {
  const params = new URLSearchParams(location.search)
  const candidate = params.get('screen') as Screen
  return { screen: SCREENS.includes(candidate) ? candidate : 'markets' as Screen, market: params.get('market') ?? 'ton' }
}

export function Pilot() {
  const [route, setRoute] = useState(readRoute)
  const [filter, setFilter] = useState('Все')
  const [notice, setNotice] = useState('')
  const market = MARKETS.find(item => item.id === route.market) ?? MARKETS[0]
  useEffect(() => {
    const sync = () => { setRoute(readRoute()); setNotice('') }
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  function navigate(screen: Screen, marketId = market.id) {
    const url = new URL(location.href)
    url.searchParams.set('screen', screen)
    url.searchParams.set('market', marketId)
    history.pushState(null, '', url)
    setRoute({ screen, market: marketId })
    setNotice('')
  }
  const excluded = () => setNotice('Not included in UI pilot')
  const quick = () => market.id === 'ton' ? navigate('quick') : excluded()

  return <AppShell screen={route.screen} navigate={navigate} notice={notice} dismissNotice={() => setNotice('')}>
    {route.screen === 'markets' && <>
      <TopBar title="Рынки" context="События, оценённые участниками" action={<IconButton name="search" label="Поиск" onClick={excluded} />} />
      <main className={styles.marketsMain}>
        <div className={styles.feedSummary}><div><p>12 840 TON</p><span>объём открытых рынков</span></div><IconButton name="filter" label="Фильтры" onClick={excluded} /></div>
        <SegmentedControl items={['Все', 'Популярное', 'Скоро']} value={filter} onChange={setFilter} />
        <div className={styles.marketList}>
          {MARKETS.filter(item => filter !== 'Скоро' || item.id === 'album').map(item => <MarketRow key={item.id} market={item} onOpen={() => navigate('detail', item.id)} />)}
        </div>
      </main>
    </>}

    {route.screen === 'detail' && <>
      <TopBar kind="detail" title={market.detailQuestion} context={market.context} back={() => navigate('markets')} action={<button type="button" className={styles.more} aria-label="Дополнительные действия" onClick={excluded}>•••</button>} />
      <main className={styles.detailMain}>
        <div className={styles.probabilitySummary}><ProbabilityDisplay market={market} large /><div className={styles.coefficient}><span>{market.id === 'ton' ? '≈ 1,49×' : '—'}</span><small>по цене исполнения</small></div></div>
        <HistoryChart />
        <div className={styles.metrics}><Metric label="ЛИКВИДНОСТЬ" value={market.liquidity} /><Metric label="ОБЪЁМ" value={market.volume} /><Metric label="ЗАКРЫТИЕ" value={market.close} /></div>
        <section className={styles.criteria}><h2>КРИТЕРИЙ · ИСТОЧНИК</h2><p>{market.criteria}</p></section>
        <div className={styles.metrics}><Metric label="СТАКАН" value={market.id === 'ton' ? '66% / 67%' : '—'} /><Metric label="ПОСЛЕДНЯЯ СДЕЛКА" value={market.id === 'ton' ? '67% · 8 TON' : '—'} /></div>
        <div className={styles.tradeActions}><Button tone="yes" onClick={quick}>Купить ДА</Button><Button tone="no" onClick={excluded}>Купить НЕТ</Button></div>
        <div className={styles.secondaryActions}><button type="button" onClick={excluded}>Своя цена</button><button type="button" onClick={excluded}>Поделиться ↗</button></div>
      </main>
    </>}

    {route.screen === 'quick' && <>
      <TopBar kind="trade" title="Быстрый вход" context="TON ВОЙДЁТ В ТОП-5 К КОНЦУ 2026?" />
      <main className={styles.quickMain}>
        <SegmentedControl trade items={['ДА · 67%', 'НЕТ · 33%']} value="ДА · 67%" onChange={value => value.startsWith('НЕТ') && excluded()} />
        <AmountInput />
        <dl className={styles.tradeDetails}>{TRADE_DETAILS.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <Card title="Быстрый вход · IOC">Доступная часть исполнится сразу. Остаток IOC отменяется и не остаётся в стакане.</Card>
        <div className={styles.actionArea}>
          <Button onClick={() => setNotice('UI pilot · Только просмотр. Покупка не отправляется.')}>Проверить покупку</Button>
          <Button tone="quiet" onClick={() => navigate('detail', 'ton')}>Назад к рынку</Button>
        </div>
      </main>
    </>}

    {route.screen === 'portfolio' && <>
      <TopBar kind="portfolio" title="Портфель" context="ОБЗОР" />
      <main className={styles.portfolioMain}>
        <div className={styles.balance}><p>248.60 TON</p><span>доступно</span></div>
        <div className={styles.portfolioMetrics}><Metric portfolio label="В позициях" value="184.20 TON" /><Metric portfolio label="В ордерах" value="49.80 TON" /><Metric portfolio label="Текущая экспозиция" value="234.00 TON" /></div>
        <div className={styles.sectionHeading}><h2>Позиции</h2><button type="button" onClick={excluded}>Все →</button></div>
        <button type="button" className={styles.positionRow} onClick={() => navigate('detail', 'ton')}><strong>ДА · TON войдёт в топ-5?</strong><span>81,80 TON · средний коэф. 1,49×</span></button>
        <div className={styles.sectionHeading}><h2>Открытые ордера</h2><button type="button" onClick={excluded}>Все →</button></div>
        <button type="button" className={styles.orderRow} onClick={excluded}><strong>Купить ДА · TON войдёт в топ-5?</strong><span>1,48× · исполнено 68,40 · остаток 31,60 TON</span></button>
      </main>
    </>}

    {(['create', 'notifications', 'profile'] as Screen[]).includes(route.screen) && <>
      <TopBar kind="portfolio" title={{ create: 'Create', notifications: 'Notifications', profile: 'Profile' }[route.screen as 'create' | 'notifications' | 'profile']} context="UI PILOT" />
      <main className={styles.placeholder}><p>Not included in UI pilot</p><Button tone="quiet" onClick={() => navigate('markets')}>К рынкам</Button></main>
    </>}
  </AppShell>
}
