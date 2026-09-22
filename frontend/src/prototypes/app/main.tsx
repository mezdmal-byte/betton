import { type ReactNode, StrictMode, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Bell, Briefcase, ChevronLeft, ChevronRight, LineChart, Plus, User } from 'lucide-react'
import './tokens.css'
import styles from './app.module.css'
import { BOOK_NO, BOOK_YES, CATEGORIES, FEED_MARKETS, NOTICES, PRIMARY, formatTon, liquidityLine, type FeedMarket, type Notice } from './data'
import { matchesQuery as feedMatch } from '../feed/fixture'

type Screen =
  | 'onboarding' | 'markets' | 'detail' | 'quick' | 'own' | 'portfolio'
  | 'history' | 'create' | 'result' | 'profile' | 'notes' | 'creator'
  | 'mine' | 'wallet' | 'help' | 'moderation' | 'system'

const JUMPS: Array<{ label: string; screen: Screen; variant: string }> = [
  { label: 'Онбординг', screen: 'onboarding', variant: 'ready' },
  { label: 'Рынки', screen: 'markets', variant: 'ready' },
  { label: 'Рынки · пустой поиск', screen: 'markets', variant: 'empty' },
  { label: 'Деталь', screen: 'detail', variant: 'ready' },
  { label: 'Быстрая · частичное', screen: 'quick', variant: 'partial' },
  { label: 'Быстрая · нет ликвидности', screen: 'quick', variant: 'empty' },
  { label: 'Быстрая · мало баланса', screen: 'quick', variant: 'balance' },
  { label: 'Быстрая · принято', screen: 'quick', variant: 'done' },
  { label: 'Своя цена · форма', screen: 'own', variant: 'form' },
  { label: 'Своя цена · в книге', screen: 'own', variant: 'resting' },
  { label: 'Портфель', screen: 'portfolio', variant: 'ready' },
  { label: 'Портфель · пусто', screen: 'portfolio', variant: 'empty' },
  { label: 'Портфель · без входа', screen: 'portfolio', variant: 'auth' },
  { label: 'История', screen: 'history', variant: 'ready' },
  { label: 'Создать', screen: 'create', variant: 'ready' },
  { label: 'Результат · модерация', screen: 'result', variant: 'pending' },
  { label: 'Результат · публичный', screen: 'result', variant: 'public' },
  { label: 'Результат · закрытый', screen: 'result', variant: 'unlisted' },
  { label: 'Профиль', screen: 'profile', variant: 'ready' },
  { label: 'Уведомления', screen: 'notes', variant: 'ready' },
  { label: 'Уведомления · пусто', screen: 'notes', variant: 'empty' },
  { label: 'Автор', screen: 'creator', variant: 'ready' },
  { label: 'Мои рынки', screen: 'mine', variant: 'ready' },
  { label: 'Кошелёк · ввод', screen: 'wallet', variant: 'deposit' },
  { label: 'Кошелёк · вывод', screen: 'wallet', variant: 'withdraw' },
  { label: 'Справка', screen: 'help', variant: 'ready' },
  { label: 'Модерация', screen: 'moderation', variant: 'ready' },
  { label: 'Загрузка', screen: 'system', variant: 'loading' },
  { label: 'Пусто', screen: 'system', variant: 'empty' },
  { label: 'Сеть', screen: 'system', variant: 'network' },
  { label: 'Нужен вход', screen: 'system', variant: 'auth' },
  { label: 'Сессия истекла', screen: 'system', variant: 'expired' },
  { label: 'Нет доступа', screen: 'system', variant: 'forbidden' },
  { label: 'Не найдено', screen: 'system', variant: 'missing' },
  { label: 'Закрытая ссылка', screen: 'system', variant: 'unlisted' },
]

function readStart(): { screen: Screen; variant: string } {
  const params = new URLSearchParams(window.location.search)
  const screen = params.get('s') as Screen | null
  const variant = params.get('v') ?? 'ready'
  const known = JUMPS.find((item) => item.screen === screen && item.variant === variant)
  return known ?? { screen: 'markets', variant: 'ready' }
}

function AppProto() {
  const start = useMemo(readStart, [])
  const [screen, setScreen] = useState<Screen>(start.screen)
  const [variant, setVariant] = useState(start.variant)
  const stack = useRef<Screen[]>(['markets'])
  const [picker, setPicker] = useState(false)
  const [query, setQuery] = useState(start.screen === 'markets' && start.variant === 'empty' ? 'zzzz' : '')
  const [category, setCategory] = useState('Все')
  const [sort, setSort] = useState<'close' | 'prob' | 'liq'>('close')
  const [status, setStatus] = useState<'all' | 'soon'>('all')
  const [filters, setFilters] = useState(false)
  const [market, setMarket] = useState<FeedMarket>(PRIMARY)
  const [side, setSide] = useState<'yes' | 'no'>('yes')
  const [notices, setNotices] = useState<Notice[]>(NOTICES)
  const [wallet, setWallet] = useState<'deposit' | 'withdraw'>(start.variant === 'withdraw' ? 'withdraw' : 'deposit')
  const [bookOpen, setBookOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [settle, setSettle] = useState(false)
  const [question, setQuestion] = useState('Курс TON выше $8 до 31 октября?')
  const [criteria, setCriteria] = useState('Источник: официальный курс. Да, если условие выполнено к закрытию.')
  const [visibility, setVisibility] = useState<'public' | 'unlisted'>('public')

  function go(next: Screen, nextVariant = 'ready', marketNext?: FeedMarket) {
    if (marketNext) setMarket(marketNext)
    setVariant(nextVariant)
    setScreen(next)
    setPicker(false)
    setFilters(false)
    stack.current = stack.current[stack.current.length - 1] === next ? stack.current : [...stack.current, next]
    const params = new URLSearchParams(window.location.search)
    params.set('s', next)
    params.set('v', nextVariant)
    window.history.replaceState(null, '', `?${params.toString()}`)
  }

  function back() {
    const prev = stack.current.length > 1 ? stack.current.slice(0, -1) : ['markets' as Screen]
    stack.current = prev
    setScreen(prev[prev.length - 1])
    setVariant('ready')
  }

  const rows = FEED_MARKETS.filter((item) => {
    if (category !== 'Все' && item.category !== category) return false
    if (!feedMatch(item, query)) return false
    if (status === 'soon' && item.closeOrder > 3) return false
    return true
  }).sort((a, b) => {
    if (sort === 'prob') return b.probability - a.probability
    if (sort === 'liq') return b.volumeTon - a.volumeTon
    return a.closeOrder - b.closeOrder
  })

  const topLevel = screen === 'markets' || screen === 'portfolio' || screen === 'create' || screen === 'notes' || screen === 'profile'
  const showNav = screen !== 'onboarding'
  const showBack = !topLevel && screen !== 'onboarding'

  return (
    <div className={styles.phone} id="app-phone">
      <header className={styles.top}>
        {showBack ? (
          <button className={styles.iconBtn} type="button" aria-label="Назад" onClick={back}><ChevronLeft size={20} /></button>
        ) : <span>BetTON</span>}
        <strong>{titleOf(screen)}</strong>
        <span className={styles.grow} />
        <button className={styles.textBtn} type="button" onClick={() => setPicker((open) => !open)}>Экраны</button>
      </header>
      <div className={styles.view}>
        {screen === 'onboarding' ? <Onboarding onContinue={() => go('markets')} /> : null}
        {screen === 'markets' ? (
          <Markets
            rows={rows}
            query={query}
            category={category}
            onQuery={setQuery}
            onCategory={setCategory}
            onOpen={(item) => go('detail', 'ready', item)}
            onFilters={() => setFilters(true)}
          />
        ) : null}
        {screen === 'detail' ? <Detail market={market} bookOpen={bookOpen} onBook={() => setBookOpen((v) => !v)} onYes={() => { setSide('yes'); go('quick', market.availableTon === 0 ? 'empty' : 'partial') }} onNo={() => { setSide('no'); go('quick', market.availableTon === 0 ? 'empty' : 'partial') }} onOwn={() => go('own', 'form')} onCreator={() => go('creator')} /> : null}
        {screen === 'quick' ? <Quick variant={variant} side={side} /> : null}
        {screen === 'own' ? <Own variant={variant} onRest={() => go('own', 'resting')} /> : null}
        {screen === 'portfolio' ? <Portfolio variant={variant} onCancel={() => go('portfolio', 'empty')} /> : null}
        {screen === 'history' ? <History /> : null}
        {screen === 'create' ? (
          <Create
            question={question}
            criteria={criteria}
            visibility={visibility}
            onQuestion={setQuestion}
            onCriteria={setCriteria}
            onVisibility={setVisibility}
            onSubmit={() => go('result', visibility === 'unlisted' ? 'unlisted' : 'pending')}
          />
        ) : null}
        {screen === 'result' ? <Result variant={variant} onFeed={() => go('markets')} onMine={() => go('mine')} /> : null}
        {screen === 'profile' ? <Profile onOpen={go} /> : null}
        {screen === 'notes' ? (
          <Notes
            items={variant === 'empty' ? [] : notices}
            onOpen={(item) => {
              setNotices((list) => list.map((note) => note.id === item.id ? { ...note, unread: false } : note))
              go(item.target === 'history' ? 'history' : item.target)
            }}
            onRead={() => setNotices((list) => list.map((note) => ({ ...note, unread: false })))}
          />
        ) : null}
        {screen === 'creator' ? <Creator onOpen={(item) => go('detail', 'ready', item)} /> : null}
        {screen === 'mine' ? <Mine onOpen={(item) => go('detail', 'ready', item)} /> : null}
        {screen === 'wallet' ? <Wallet tab={wallet} onTab={setWallet} /> : null}
        {screen === 'help' ? <Help /> : null}
        {screen === 'moderation' ? <Moderation reason={reason} onReason={setReason} settle={settle} onSettle={() => setSettle(true)} /> : null}
        {screen === 'system' ? <System variant={variant} onRetry={() => go('markets')} /> : null}
      </div>
      {filters && screen === 'markets' ? (
        <div className={styles.sheet} role="dialog" aria-label="Фильтры">
          <strong>Фильтры</strong>
          <span className={styles.muted}>Статус</span>
          <div className={styles.chips}>
            <button className={`${styles.chip} ${status === 'all' ? styles.chipOn : ''}`} type="button" onClick={() => setStatus('all')}>Все открытые</button>
            <button className={`${styles.chip} ${status === 'soon' ? styles.chipOn : ''}`} type="button" onClick={() => setStatus('soon')}>Скоро закроются</button>
          </div>
          <span className={styles.muted}>Сортировка</span>
          <div className={styles.chips}>
            <button className={`${styles.chip} ${sort === 'close' ? styles.chipOn : ''}`} type="button" onClick={() => setSort('close')}>По закрытию</button>
            <button className={`${styles.chip} ${sort === 'prob' ? styles.chipOn : ''}`} type="button" onClick={() => setSort('prob')}>По вероятности</button>
            <button className={`${styles.chip} ${sort === 'liq' ? styles.chipOn : ''}`} type="button" onClick={() => setSort('liq')}>По объёму</button>
          </div>
          <button className={styles.ghost} type="button" onClick={() => { setQuery(''); setCategory('Все'); setSort('close'); setStatus('all') }}>Сбросить</button>
          <button className={styles.primary} type="button" onClick={() => setFilters(false)}>Показать</button>
        </div>
      ) : null}
      {picker ? (
        <div className={styles.picker}>
          {JUMPS.map((item) => (
            <button key={item.label} type="button" onClick={() => go(item.screen, item.variant)}>{item.label}</button>
          ))}
        </div>
      ) : null}
      {showNav ? (
        <nav className={styles.nav} aria-label="Разделы">
          <NavButton label="Рынки" on={screen === 'markets'} onClick={() => go('markets')} icon={<LineChart size={18} />} />
          <NavButton label="Портфель" on={screen === 'portfolio'} onClick={() => go('portfolio', 'ready')} icon={<Briefcase size={18} />} />
          <button className={styles.navBtn} type="button" onClick={() => go('create')}>
            <span className={styles.create}><Plus size={18} /></span>
            Создать
          </button>
          <NavButton label="Уведомления" on={screen === 'notes'} onClick={() => go('notes')} icon={<Bell size={18} />} />
          <NavButton label="Профиль" on={screen === 'profile'} onClick={() => go('profile')} icon={<User size={18} />} />
        </nav>
      ) : null}
    </div>
  )
}

function NavButton({ label, on, onClick, icon }: { label: string; on: boolean; onClick: () => void; icon: ReactNode }) {
  return <button className={`${styles.navBtn} ${on ? styles.navOn : ''}`} type="button" onClick={onClick}>{icon}{label}</button>
}

function titleOf(screen: Screen) {
  const map: Record<Screen, string> = {
    onboarding: 'Старт', markets: 'Рынки', detail: 'Рынок', quick: 'Быстрая', own: 'Своя цена',
    portfolio: 'Портфель', history: 'История', create: 'Создать', result: 'Результат', profile: 'Профиль',
    notes: 'Уведомления', creator: 'Автор', mine: 'Мои рынки', wallet: 'Кошелёк', help: 'Справка',
    moderation: 'Модерация', system: 'Состояние',
  }
  return map[screen]
}

function Onboarding({ onContinue }: { onContinue: () => void }) {
  return (
    <div className={styles.pad}>
      <p className={styles.h1}>Рынок между людьми, не букмекер.</p>
      <p className={styles.muted}>Ставка стоит в книге заявок. Быстрая исполняется сразу против доступного объёма. Своя цена ждёт встречную сторону.</p>
      <div className={styles.pair}><span>P2P</span><b>Нет дома, который играет против вас</b></div>
      <div className={styles.pair}><span>Книга</span><b>Цена — это чужая заявка</b></div>
      <div className={styles.pair}><span>Сбор</span><b>1% только с чистой прибыли победителя</b></div>
      <p className={styles.muted}>Создатель получает 75% сбора, платформа 25%. Сбор не берётся заранее.</p>
      <button className={styles.primary} type="button" onClick={onContinue}>К рынкам</button>
    </div>
  )
}

function Markets({ rows, query, category, onQuery, onCategory, onOpen, onFilters }: {
  rows: FeedMarket[]
  query: string
  category: string
  onQuery: (value: string) => void
  onCategory: (value: string) => void
  onOpen: (market: FeedMarket) => void
  onFilters: () => void
}) {
  return (
    <div className={styles.body}>
      <aside className={styles.rail}>
        {CATEGORIES.map((item) => (
          <button key={item} className={`${styles.railBtn} ${item === category ? styles.railOn : ''}`} type="button" onClick={() => onCategory(item)}>{item}</button>
        ))}
      </aside>
      <div className={styles.list}>
        <input className={styles.search} value={query} placeholder="Поиск" aria-label="Поиск" onChange={(event) => onQuery(event.target.value)} />
        <button className={styles.textBtn} type="button" style={{ paddingLeft: 14 }} onClick={onFilters}>Статус и сортировка</button>
        {rows.length === 0 ? <p className={styles.pad}>Ничего не найдено. Сбросьте запрос или категорию.</p> : rows.map((item) => (
          <button key={item.id} className={styles.rowBtn} type="button" onClick={() => onOpen(item)}>
            <span className={styles.q}>{item.question}</span>
            <span className={styles.pct}>{item.probability}%</span>
            <span className={styles.meta}>
              {item.creator} · {item.closeGroup} {item.closeTime}
              <br />
              {liquidityLine(item)}
              {item.trend ? <span className={styles.trend}> · {item.trend}<span className={styles.spark} aria-hidden="true"><i style={{ height: 6 }} /><i style={{ height: 9 }} /><i style={{ height: 8 }} /><i style={{ height: 13 }} /></span></span> : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Detail({ market, bookOpen, onBook, onYes, onNo, onOwn, onCreator }: {
  market: FeedMarket
  bookOpen: boolean
  onBook: () => void
  onYes: () => void
  onNo: () => void
  onOwn: () => void
  onCreator: () => void
}) {
  const yes = bookOpen ? [...BOOK_YES, ['0.62', '9 TON']] : BOOK_YES.slice(0, 3)
  const no = bookOpen ? [...BOOK_NO, ['0.34', '14 TON']] : BOOK_NO.slice(0, 3)
  return (
    <div className={styles.pad}>
      <p className={styles.h1}>{market.question}</p>
      <p className={styles.muted}>Да, если условие выполнено к {market.closeGroup}, {market.closeTime} по публичному источнику, указанному в критериях.</p>
      <div className={styles.pair}><span>Вероятность</span><b>{market.probability}%</b></div>
      <div className={styles.pair}><span>Ликвидность</span><b>{liquidityLine(market)}</b></div>
      <button className={styles.menuBtn} type="button" onClick={onCreator}><span>{market.creator}</span><ChevronRight size={16} /></button>
      <div className={styles.banner}>История сделок — demo fills. Коэффициент не показывается, пока нет встречного объёма.</div>
      {market.availableTon === 0 ? <p className={styles.banner}>В книге нет встречного объёма. Уровни не показаны, потому что исполнять сейчас нечего.</p> : (
        <table className={styles.book}>
          <tbody>
            {yes.map(([price, size]) => <tr key={`y-${price}`}><td className={styles.yesInk}>Да {price}</td><td>{size}</td></tr>)}
            {no.map(([price, size]) => <tr key={`n-${price}`}><td className={styles.noInk}>Нет {price}</td><td>{size}</td></tr>)}
          </tbody>
        </table>
      )}
      {market.availableTon === 0 ? null : <button className={styles.textBtn} type="button" onClick={onBook}>{bookOpen ? 'Свернуть книгу' : 'Ещё уровни'}</button>}
      <div className={styles.actions}>
        <button className={styles.yes} type="button" onClick={onYes}>Да · быстрая</button>
        <button className={styles.no} type="button" onClick={onNo}>Нет · быстрая</button>
      </div>
      <button className={styles.ghost} type="button" onClick={onOwn}>Своя цена</button>
    </div>
  )
}

function Quick({ variant, side }: { variant: string; side: 'yes' | 'no' }) {
  const empty = variant === 'empty'
  const balance = variant === 'balance'
  const done = variant === 'done'
  return (
    <div className={styles.pad}>
      <p className={styles.muted}>IOC. Неисполненный остаток в книгу не встаёт.</p>
      <div className={styles.pair}><span>Сторона</span><b className={side === 'yes' ? styles.yesInk : styles.noInk}>{side === 'yes' ? 'Да' : 'Нет'}</b></div>
      <div className={styles.pair}><span>Сумма</span><b>{empty ? '20 TON' : '50 TON'}</b></div>
      <div className={styles.pair}><span>Можно исполнить сейчас</span><b>{empty ? '0 TON' : '32 TON'}</b></div>
      {empty ? <p className={styles.banner}>Нет встречной ликвидности. Коэффициент не показываем.</p> : (
        <>
          <div className={styles.pair}><span>Средняя / худшая цена</span><b>0.64 / 0.66</b></div>
          <div className={styles.pair}><span>Выплата на исполнимое</span><b>50 TON если сторона выиграет</b></div>
          <div className={styles.pair}><span>Остаток IOC</span><b>18 TON не останется заявкой</b></div>
        </>
      )}
      {balance ? <p className={`${styles.banner} ${styles.warn}`}>Недостаточно баланса. Доступно 12 TON. Кошелёк здесь не проводит блокчейн-перевод.</p> : null}
      <p className={styles.muted}>Сбор 1% только с чистой прибыли победителя. Не комиссия за сделку.</p>
      {done ? <p className={styles.banner}>Заявка принята. Исполнено 32 TON. Остаток снят, в книге его нет.</p> : (
        <button className={styles.primary} type="button" disabled={empty || balance}>Подтвердить быструю</button>
      )}
    </div>
  )
}

function Own({ variant, onRest }: { variant: string; onRest: () => void }) {
  const resting = variant === 'resting'
  return (
    <div className={styles.pad}>
      <p className={styles.muted}>Лимитная заявка. Остаток стоит в книге, пока вы его не отмените.</p>
      <div className={styles.pair}><span>Сторона</span><b className={styles.yesInk}>Да</b></div>
      <div className={styles.pair}><span>Цена</span><b>0.62</b></div>
      <div className={styles.pair}><span>Сумма</span><b>40 TON</b></div>
      <div className={styles.pair}><span>Резерв</span><b>40 TON удерживается до исполнения или отмены</b></div>
      {resting ? (
        <>
          <p className={styles.banner}>Исполнено 25 TON. В книге осталось 15 TON по 0.62.</p>
          <button className={styles.ghost} type="button">Отменить остаток</button>
        </>
      ) : <button className={styles.primary} type="button" onClick={onRest}>Поставить в книгу</button>}
    </div>
  )
}

function Portfolio({ variant, onCancel }: { variant: string; onCancel: () => void }) {
  if (variant === 'auth') return <div className={styles.pad}><p className={styles.h1}>Нужен вход через Telegram.</p><p className={styles.muted}>Портфель читается только для авторизованной сессии.</p></div>
  if (variant === 'empty') return <div className={styles.pad}><p className={styles.h1}>Позиций и заявок нет.</p><p className={styles.muted}>Баланс 128.40 TON. В позициях 0. В заявках 0.</p></div>
  return (
    <div className={styles.pad}>
      <div className={styles.pair}><span>Баланс</span><b>{formatTon(128.4)}</b></div>
      <div className={styles.pair}><span>В позициях</span><b>{formatTon(46)}</b></div>
      <div className={styles.pair}><span>В заявках</span><b>{formatTon(15)}</b></div>
      <div className={styles.pair}><span>Доход автора</span><b>{formatTon(3.2)}</b></div>
      <p>Ключевая ставка · Да · 32 TON</p>
      <p className={styles.muted}>Своя цена 0.62 · остаток 15 TON в книге</p>
      <button className={styles.ghost} type="button" onClick={onCancel}>Отменить остаток</button>
    </div>
  )
}

function History() {
  return (
    <div className={styles.pad}>
      <div className={styles.pair}><span>Ставка ЦБ · Да выиграла</span><b>+18.40 TON</b></div>
      <p className={styles.muted}>Сбор 1% с чистой прибыли уже учтён. Это расчёт рынка, не вывод.</p>
      <div className={styles.pair}><span>Отмена остатка</span><b>+15 TON в резерв</b></div>
    </div>
  )
}

function Create({ question, criteria, visibility, onQuestion, onCriteria, onVisibility, onSubmit }: {
  question: string
  criteria: string
  visibility: 'public' | 'unlisted'
  onQuestion: (value: string) => void
  onCriteria: (value: string) => void
  onVisibility: (value: 'public' | 'unlisted') => void
  onSubmit: () => void
}) {
  const invalid = question.trim().length < 8 || criteria.trim().length < 8
  return (
    <div>
      <input className={styles.field} aria-label="Вопрос" value={question} onChange={(event) => onQuestion(event.target.value)} />
      <textarea className={styles.area} aria-label="Критерии" rows={4} value={criteria} onChange={(event) => onCriteria(event.target.value)} />
      <div className={styles.pad}>
        <div className={styles.chips}>
          <button className={`${styles.chip} ${visibility === 'public' ? styles.chipOn : ''}`} type="button" onClick={() => onVisibility('public')}>Публичный</button>
          <button className={`${styles.chip} ${visibility === 'unlisted' ? styles.chipOn : ''}`} type="button" onClick={() => onVisibility('unlisted')}>Закрытый по ссылке</button>
        </div>
        <p className={styles.muted}>Закрытый рынок не попадает в ленту. Доступ по ссылке с токеном, не по списку людей. Закрытие: 31 окт, 23:59. Категория: Крипто.</p>
        <p className={styles.muted}>Сбор 1% с чистой прибыли победителя: 75% автору, 25% платформе.</p>
        {invalid ? <p className={styles.banner}>Нужны вопрос и проверяемые критерии.</p> : null}
        <button className={styles.primary} type="button" disabled={invalid} onClick={onSubmit}>Отправить</button>
      </div>
    </div>
  )
}

function Result({ variant, onFeed, onMine }: { variant: string; onFeed: () => void; onMine: () => void }) {
  const copy = variant === 'unlisted'
    ? 'Рынок скрыт из ленты. Ссылка: betton.app/m/share-token-demo'
    : variant === 'public'
      ? 'Рынок опубликован в ленте.'
      : 'Рынок на модерации. В ленте его ещё нет.'
  return (
    <div className={styles.pad}>
      <p className={styles.h1}>{copy}</p>
      <button className={styles.primary} type="button" onClick={onMine}>Мои рынки</button>
      <button className={styles.ghost} type="button" onClick={onFeed}>В ленту</button>
    </div>
  )
}

function Profile({ onOpen }: { onOpen: (screen: Screen) => void }) {
  const items: Array<[string, Screen]> = [
    ['Публичный профиль', 'creator'],
    ['Мои рынки', 'mine'],
    ['Кошелёк', 'wallet'],
    ['История', 'history'],
    ['Модерация', 'moderation'],
    ['Справка', 'help'],
  ]
  return (
    <div className={styles.pad}>
      <p className={styles.h1}>Анна</p>
      <p className={styles.muted}>@macro_anna</p>
      <div className={styles.pair}><span>Рынков</span><b>4</b></div>
      <div className={styles.pair}><span>Объём созданных</span><b>{formatTon(482)}</b></div>
      <div className={styles.pair}><span>Доход автора</span><b>{formatTon(3.2)}</b></div>
      {items.map(([label, screen]) => (
        <button key={label} className={styles.menuBtn} type="button" onClick={() => onOpen(screen)}><span>{label}</span><ChevronRight size={16} /></button>
      ))}
    </div>
  )
}

function Notes({ items, onOpen, onRead }: { items: Notice[]; onOpen: (item: Notice) => void; onRead: () => void }) {
  if (items.length === 0) return <div className={styles.pad}><p className={styles.h1}>Пока пусто.</p><p className={styles.muted}>Здесь будут исполнения, расчёты и решения модерации. Это фикстура, не доставка с сервера.</p></div>
  return (
    <div>
      <div className={styles.pad}><button className={styles.textBtn} type="button" onClick={onRead}>Отметить прочитанными</button></div>
      {items.map((item) => (
        <button key={item.id} className={`${styles.note} ${item.unread ? styles.unread : ''}`} type="button" onClick={() => onOpen(item)}>
          <strong>{item.title}</strong>
          <span className={styles.muted}>{item.time}</span>
          <span className={styles.meta}>{item.body}</span>
        </button>
      ))}
    </div>
  )
}

function Creator({ onOpen }: { onOpen: (market: FeedMarket) => void }) {
  const mine = FEED_MARKETS.filter((item) => item.creator === '@macro_anna')
  return (
    <div>
      <div className={styles.pad}>
        <p className={styles.h1}>@macro_anna</p>
        <div className={styles.pair}><span>Публичных рынков</span><b>{mine.length}</b></div>
        <p className={styles.muted}>Рейтинга и репутации нет: модель ещё не подтверждена.</p>
      </div>
      {mine.map((item) => (
        <button key={item.id} className={styles.rowBtn} type="button" onClick={() => onOpen(item)}>
          <span className={styles.q}>{item.question}</span>
          <span className={styles.pct}>{item.probability}%</span>
        </button>
      ))}
    </div>
  )
}

function Mine({ onOpen }: { onOpen: (market: FeedMarket) => void }) {
  return (
    <div className={styles.pad}>
      <p className={styles.muted}>На модерации · «Курс TON выше $8»</p>
      <button className={styles.menuBtn} type="button" onClick={() => onOpen(FEED_MARKETS[0])}><span>Открыт · ставка ЦБ</span><ChevronRight size={16} /></button>
      <p className={styles.muted}>Закрыт · демо «Ставка ЦБ», Да</p>
      <p className={styles.muted}>Отклонён · критерии без публичного источника</p>
    </div>
  )
}

function Wallet({ tab, onTab }: { tab: 'deposit' | 'withdraw'; onTab: (tab: 'deposit' | 'withdraw') => void }) {
  return (
    <div>
      <div className={styles.tabs}>
        <button className={tab === 'deposit' ? styles.navOn : ''} type="button" onClick={() => onTab('deposit')}>Ввод</button>
        <button className={tab === 'withdraw' ? styles.navOn : ''} type="button" onClick={() => onTab('withdraw')}>Вывод</button>
      </div>
      <div className={styles.pad}>
        <p className={`${styles.banner} ${styles.warn}`}>Ончейн-ввод и вывод ещё не работают. Экран — оболочка. Успешного перевода здесь нет.</p>
        <input className={styles.field} aria-label="Сумма" placeholder="Сумма, TON" />
        <button className={styles.ghost} type="button" disabled>{tab === 'deposit' ? 'Адрес появится позже' : 'Вывод недоступен'}</button>
      </div>
    </div>
  )
}

function Help() {
  const items = [
    ['P2P', 'Стороны торгуют друг с другом. Платформа не принимает ставку против вас.'],
    ['Книга', 'Заявки стоят по цене. Лучшие уровни видны на рынке.'],
    ['Быстрая', 'IOC: исполняется сейчас. Остаток не остаётся в книге.'],
    ['Своя цена', 'Лимит ждёт встречную сторону. Остаток можно отменить.'],
    ['Сбор', '1% с чистой прибыли победителя. 75% автору рынка, 25% платформе.'],
  ]
  return (
    <div className={styles.pad}>
      {items.map(([title, body]) => (
        <section key={title}>
          <strong>{title}</strong>
          <p className={styles.muted}>{body}</p>
        </section>
      ))}
    </div>
  )
}

function Moderation({ reason, onReason, settle, onSettle }: { reason: string; onReason: (value: string) => void; settle: boolean; onSettle: () => void }) {
  return (
    <div className={styles.pad}>
      <p className={styles.h1}>Курс TON выше $8 до 31 октября?</p>
      <p className={styles.muted}>Критерии: официальный курс на момент закрытия. Источник указан автором.</p>
      <button className={styles.primary} type="button">Одобрить</button>
      <input className={styles.field} aria-label="Причина отклонения" placeholder="Причина отклонения" value={reason} onChange={(event) => onReason(event.target.value)} />
      <button className={styles.ghost} type="button" disabled={reason.trim().length < 4}>Отклонить</button>
      <button className={styles.ghost} type="button">Закрыть рынок</button>
      {settle ? (
        <>
          <p className={styles.banner}>Исход: Да. Это спишет проигравших и выплатит победителей. Отмены нет.</p>
          <button className={styles.danger} type="button">Подтвердить расчёт</button>
        </>
      ) : <button className={styles.danger} type="button" onClick={onSettle}>Рассчитать · выбрать Да</button>}
    </div>
  )
}

function System({ variant, onRetry }: { variant: string; onRetry: () => void }) {
  const copy: Record<string, [string, string]> = {
    loading: ['Загрузка', 'Ждём ответ сервера.'],
    empty: ['Пусто', 'В этом разделе нет записей.'],
    network: ['Нет связи', 'Повторите запрос. Данные не выдуманы локально.'],
    auth: ['Нужен вход', 'Откройте BetTON из Telegram.'],
    expired: ['Сессия истекла', 'Войдите снова. Старые заявки не исполняются из этого экрана.'],
    forbidden: ['Нет доступа', 'Модерация только для админа.'],
    missing: ['Не найдено', 'Такого рынка нет.'],
    unlisted: ['Ссылка недействительна', 'Закрытый рынок открывается только с действующим токеном. Это не список доступа.'],
  }
  const [title, body] = copy[variant] ?? copy.missing
  return (
    <div className={styles.pad}>
      <p className={styles.h1}>{title}</p>
      <p className={styles.muted}>{body}</p>
      {variant === 'network' ? <button className={styles.primary} type="button" onClick={onRetry}>Повторить</button> : null}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><AppProto /></StrictMode>)
