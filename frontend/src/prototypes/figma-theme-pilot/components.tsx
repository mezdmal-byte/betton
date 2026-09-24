import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { useTheme } from './ThemeProvider'
import type { Market, Screen } from './fixture'
import styles from './Pilot.module.css'
import marketsIcon from './assets/markets.svg'
import portfolioIcon from './assets/portfolio.svg'
import notificationsIcon from './assets/notifications.svg'
import profileIcon from './assets/profile.svg'
import searchIcon from './assets/search.svg'
import filterIcon from './assets/filter.svg'
import sparkUp from './assets/spark-up.svg'
import sparkDown from './assets/spark-down.svg'
import chart from './assets/chart.svg'

const icons = { markets: marketsIcon, portfolio: portfolioIcon, notifications: notificationsIcon, profile: profileIcon, search: searchIcon, filter: filterIcon }

// Original Figma SVG alpha geometry. Semantic foreground supplies the theme color.
function Asset({ src, className }: { src: string; className: string }) {
  return <span aria-hidden="true" className={cx(styles.asset, className)} style={{ '--asset': `url("${src}")` } as CSSProperties} />
}

export function Icon({ name }: { name: keyof typeof icons }) {
  return <Asset src={icons[name]} className={name === 'search' || name === 'filter' ? styles.actionIcon : styles.navIcon} />
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return <div className={styles.themeToggle} aria-label="UI pilot theme">
    <span>UI pilot</span>
    <div role="group" aria-label="Theme">
      {(['dark', 'light'] as const).map(item => <button key={item} type="button" aria-pressed={theme === item} onClick={() => setTheme(item)}>{item === 'dark' ? 'Dark' : 'Light'}</button>)}
    </div>
  </div>
}

export function AppShell({ children, screen, navigate, notice, dismissNotice }: {
  children: ReactNode; screen: Screen; navigate: (screen: Screen) => void; notice: string; dismissNotice: () => void
}) {
  const comparison = new URLSearchParams(location.search).get('compare') === '1'
  return <div className={styles.phone} data-testid="app-shell" data-screen={screen}>
    <div className={styles.viewport}>
      <div className={cx(styles.statusBar, (screen === 'markets' || screen === 'detail') && styles.smallStatus)}>
        <span>9:41</span>
        {!comparison && <ThemeToggle />}
        <span aria-hidden="true">{'▮▮▮  Wi‑Fi  92%'}</span>
      </div>
      {children}
    </div>
    {screen !== 'detail' && <BottomNav screen={screen} navigate={navigate} />}
    {notice && <div className={styles.notice} role="status"><span>{notice}</span><button type="button" aria-label="Закрыть сообщение" onClick={dismissNotice}>×</button></div>}
  </div>
}

export function TopBar({ title, context, action, kind = 'standard', back }: {
  title: string; context: string; action?: ReactNode; kind?: 'standard' | 'detail' | 'trade' | 'portfolio'; back?: () => void
}) {
  const eyebrow = kind === 'trade' || kind === 'portfolio'
  return <header className={cx(styles.topBar, styles[kind])}>
    {eyebrow && <p className={styles.eyebrow}>{context}</p>}
    <div className={styles.titleRow}>
      {back && <button type="button" className={styles.detailBack} aria-label="Назад к рынкам" onClick={back}>‹</button>}
      <h1>{title}</h1>
      {action}
    </div>
    {!eyebrow && <p className={styles.context}>{context}</p>}
  </header>
}

export function IconButton({ name, label, onClick }: { name: 'search' | 'filter'; label: string; onClick: () => void }) {
  return <button type="button" className={styles.iconButton} aria-label={label} onClick={onClick}><Icon name={name} /></button>
}

export function Button({ children, tone = 'accent', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'accent' | 'yes' | 'no' | 'quiet' }) {
  return <button type="button" className={cx(styles.button, styles[tone], className)} {...props}>{children}</button>
}

export function SegmentedControl({ items, value, onChange, trade = false }: {
  items: readonly string[]; value: string; onChange: (value: string) => void; trade?: boolean
}) {
  return <div className={cx(styles.segmented, trade && styles.tradeSegmented)} role="group" aria-label={trade ? 'Исход' : 'Рынки'}>
    {items.map(item => <button type="button" key={item} aria-pressed={item === value} onClick={() => onChange(item)}>{item}</button>)}
  </div>
}

export function ProbabilityDisplay({ market, large = false }: { market: Market; large?: boolean }) {
  return <div className={cx(styles.probability, large && styles.probabilityLarge, market.trend === 'down' && styles.negative)}>
    <span className={styles.percent}>{market.probability}%</span>
    <span className={styles.movement}>{market.movement}{large && market.trend !== 'none' ? ' за 24 ч' : ''}</span>
    {!large && market.trend !== 'none' && <div className={styles.sparkSlot}><Asset src={market.trend === 'down' ? sparkDown : sparkUp} className={styles.spark} /></div>}
  </div>
}

export function MarketRow({ market, onOpen }: { market: Market; onOpen: () => void }) {
  return <button type="button" className={styles.marketRow} onClick={onOpen} aria-label={market.question}>
    <span className={styles.marketInfo}>
      <span className={styles.rowLabels}><span>{market.category}</span>{market.creator && <span>{market.creator}</span>}</span>
      <span className={styles.question}>{market.question}</span>
      <span className={styles.marketMeta}>{market.meta}</span>
    </span>
    <ProbabilityDisplay market={market} />
  </button>
}

export function HistoryChart() {
  return <figure className={styles.chart} aria-label="Пример графика вероятности за 7 дней">
    <figcaption><span>Вероятность · 7 дней</span><span>по сделкам · пример</span></figcaption>
    <div className={styles.plot}><Asset src={chart} className={styles.chartLine} /></div>
  </figure>
}

export function Metric({ label, value, portfolio = false }: { label: string; value: string; portfolio?: boolean }) {
  return <div className={cx(styles.metric, portfolio && styles.portfolioMetric)}><span>{label}</span><strong>{value}</strong></div>
}

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return <aside className={styles.card}><strong>{title}</strong><p>{children}</p></aside>
}

export function AmountInput() {
  return <label className={styles.input}>
    <span>Сумма покупки · баланс 142,80 TON</span>
    <input aria-label="Сумма покупки, TON — фиксированный пример" value="25,00 TON" readOnly />
  </label>
}

function BottomNav({ screen, navigate }: { screen: Screen; navigate: (screen: Screen) => void }) {
  const active = screen === 'quick' ? 'markets' : screen
  const items = [
    ['markets', 'Markets'], ['portfolio', 'Portfolio'], ['create', 'Create'], ['notifications', 'Notifications'], ['profile', 'Profile'],
  ] as const
  return <nav className={styles.bottomNav} aria-label="Основная навигация">
    {items.map(([destination, label]) => <button type="button" key={destination} onClick={() => navigate(destination)} className={cx(styles.navItem, destination === 'create' && styles.createItem)} aria-current={active === destination ? 'page' : undefined}>
      {destination === 'create' ? <span className={styles.createIcon} aria-hidden="true" /> : <Icon name={destination} />}
      <span>{label}</span>
    </button>)}
  </nav>
}
