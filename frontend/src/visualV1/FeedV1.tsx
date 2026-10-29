import { useContext, useEffect, useRef, useState } from 'react'
import type { MarketsScreenProps } from '../screens/MarketsScreen'
import type { MarketFixture, OutcomeSide } from '../types/market'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { NotificationBadgeContext } from '../components/BottomNavigation/NotificationBadgeContext'
import { SearchField } from '../components/SearchField/SearchField'
import { Button } from '../components/Button/Button'
import { formatOdds, formatTonFull } from '../lib/format'
import { closeTelegramWebApp } from '../telegram/webapp'
import { useI18n } from '../i18n'
import { useVisualV1Actions } from './VisualV1Context'
import s from './FeedV1.module.css'

const images = import.meta.glob('../assets/visual-v1/feed/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
export function FeedAsset({ name, size = 24 }: { name: string; size?: number }) {
  return <span className={s.asset} style={{ width: size, height: size }} aria-hidden="true"><img src={images[`../assets/visual-v1/feed/${name}.svg`]} alt="" draggable={false}/></span>
}
export function formatOffersNano(value?: string): string {
  if (value == null) return '—'
  try {
    const nano = BigInt(value)
    const whole = nano / 1_000_000_000n
    const fraction = (nano % 1_000_000_000n).toString().padStart(9, '0').replace(/0+$/, '')
    return new Intl.NumberFormat('ru-RU').format(whole) + (fraction ? ',' + fraction : '') + ' TON'
  } catch { return '—' }
}

const sortLabels: Record<string, string> = { popular: 'По активности', new: 'Сначала новые', closing: 'Скоро начнутся' }
const teamAssets: Record<string, string> = { 'team liquid': '25b9c', 'team spirit': 'a405a', 'реал мадрид': '605dd', 'бавария': 'cfdb3', navi: '86a4f', 'g2 esports': 'c2622', 'новак джокович': '21e45', 'карлос алькарас': '82cbc' }

function TeamLogo({ label }: { label: string }) {
  const asset = teamAssets[label.trim().toLocaleLowerCase()]
  return asset ? <FeedAsset name={asset} size={30}/> : null
}

function readFavorites(): string[] {
  try { const value: unknown = JSON.parse(localStorage.getItem('betton.favorites.v1') || '[]'); return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [] } catch { return [] }
}

export function FeedV1({ markets = [], selectedOutcomes, query = '', sort = 'new', category = 'all', filtersOpen = false, filtersActive = false, onQueryChange, onSortChange, onCategoryChange, onFiltersClick, onSelectOutcome, onSelectMarket, onNavChange, onProfileClick, headerUser, feedState = 'ready', onRetry, hasMore, loadingMore, onLoadMore, activeOffersNano, statsError, onRetryStats, onChatClick, chatUnreadReplies = 0 }: MarketsScreenProps) {
  const a = useVisualV1Actions()
  const { locale } = useI18n()
  const unread = useContext(NotificationBadgeContext)
  const [internalQuery, setInternalQuery] = useState(query)
  const [internalSort, setInternalSort] = useState(sort)
  const [internalCategory, setInternalCategory] = useState(category)
  const [sortOpen, setSortOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(Boolean(query))
  const [favorites, setFavorites] = useState(readFavorites)
  const [favoriteOnly, setFavoriteOnly] = useState(false)
  const [metricsOpen, setMetricsOpen] = useState(false)
  const [selected, setSelected] = useState<Record<string, OutcomeSide>>({})
  const menuButton = useRef<HTMLButtonElement>(null)
  const sortControl = useRef<HTMLDivElement>(null)
  const searchValue = onQueryChange ? query : internalQuery
  const sortValue = onSortChange ? sort : internalSort
  const categoryValue = onCategoryChange ? category : internalCategory
  const visibleMarkets = favoriteOnly ? markets.filter(m => favorites.includes(m.id)) : markets
  const setCategory = onCategoryChange ?? setInternalCategory
  const setSort = onSortChange ?? setInternalSort
  const setSearch = onQueryChange ?? setInternalQuery
  useEffect(() => {
    if (!menuOpen && !sortOpen) return
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); setSortOpen(false); menuButton.current?.focus() } }
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !sortControl.current?.contains(event.target)) setSortOpen(false) }
    window.addEventListener('keydown', key)
    window.addEventListener('pointerdown', outside)
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('pointerdown', outside) }
  }, [menuOpen, sortOpen])
  const toggleFavorite = (id: string) => setFavorites(previous => {
    const next = previous.includes(id) ? previous.filter(v => v !== id) : [...previous, id]
    try { localStorage.setItem('betton.favorites.v1', JSON.stringify(next)) } catch { /* Optional local preference. */ }
    return next
  })
  const closeMenu = (action?: () => void) => { setMenuOpen(false); action?.() }

  function drawerRow(label: string, icon: string, action?: () => void, accent = false, value?: string) {
    return <button type="button" className={`${s.drawerRow} ${accent ? s.drawerAccent : ''}`} onClick={() => closeMenu(action)}><FeedAsset name={icon} size={18}/><span>{label}</span>{value ? <small>{value}</small> : null}{!accent ? <FeedAsset name="03b6c" size={14}/> : null}</button>
  }
  return <div className={s.screen} data-figma-frame="819:45192">
    <header className={s.header}>
      <button type="button" ref={menuButton} aria-label="Меню" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><FeedAsset name="f79f3"/></button>
      <strong className={s.brand}>Bet<em>TON</em></strong>
      <button type="button" aria-label="Профиль" onClick={onProfileClick ?? a.onOpenProfile}><FeedAsset name="ce1b6"/></button>
      <button type="button" className={s.notifications} aria-label={`Уведомления${unread ? ` · ${unread}` : ''}`} onClick={a.onOpenNotifications}><FeedAsset name="c0f44" size={21}/>{unread ? <span className={s.dot}/> : null}</button>
    </header>
    <main className={s.scroll}>
      <div className={s.content}>
        <nav className={s.categories} aria-label="Категории событий">{[['all', 'Все'], ['esports', 'Киберспорт'], ['sport', 'Спорт']].map(([id, label]) => <button key={id} type="button" aria-current={categoryValue === id ? 'page' : undefined} onClick={() => setCategory(id!)}>{label}</button>)}</nav>
        {searchOpen ? <SearchField value={searchValue} onChange={setSearch} placeholder="Поиск событий"/> : null}
        <div className={s.controls} ref={sortControl}>
          <button type="button" className={s.sortButton} aria-haspopup="menu" aria-expanded={sortOpen} onClick={() => setSortOpen(!sortOpen)}><FeedAsset name="1dd35" size={17}/><span>{sortLabels[sortValue] ?? sortLabels.new}</span><span className={s.down}><FeedAsset name="9ec65" size={9}/></span></button>
          <button type="button" className={s.filtersButton} aria-pressed={filtersActive || filtersOpen} onClick={onFiltersClick}><FeedAsset name="0c2c1" size={14}/><span>Фильтры</span>{filtersActive ? <i className={s.dot}/> : null}</button>
          {sortOpen ? <div className={s.sortMenu} role="menu" aria-label="Сортировка" data-figma-frame="929:26798">{Object.entries(sortLabels).map(([id, label]) => <button key={id} type="button" role="menuitemradio" aria-checked={sortValue === id} onClick={() => { setSort(id); setSortOpen(false) }}><FeedAsset name={id === 'popular' ? '1dd35' : id === 'new' ? '97e70' : '08b5d'} size={18}/><span>{label}</span>{sortValue === id ? <FeedAsset name="fd5df" size={16}/> : null}</button>)}</div> : null}
        </div>
        {favoriteOnly ? <p className={s.notice}>Избранные события <button type="button" onClick={() => setFavoriteOnly(false)}>Показать все</button></p> : null}
        {feedState === 'loading' ? <section className={s.state} role="status">Загружаем события…</section> : null}
        {feedState === 'error' ? <section className={s.state} role="alert"><h2>Не удалось загрузить события</h2><Button variant="secondary" onClick={onRetry}>Повторить</Button></section> : null}
        {feedState === 'empty' || (feedState === 'ready' && visibleMarkets.length === 0) ? <section className={s.state}><h2>{favoriteOnly ? 'В избранном пока нет событий' : 'События не найдены'}</h2><p>Попробуйте изменить фильтры или поиск.</p></section> : null}
        {feedState !== 'loading' ? visibleMarkets.map(m => <FeedMarketCard key={m.id} market={m} selectedSide={selectedOutcomes?.[m.id] ?? selected[m.id]} favorite={favorites.includes(m.id)} onFavorite={() => toggleFavorite(m.id)} onOpen={() => onSelectMarket?.(m)} onSelect={side => { setSelected(previous => ({ ...previous, [m.id]: side })); onSelectOutcome?.(m, side) }}/>) : null}
        {hasMore && feedState === 'ready' ? <Button fullWidth variant="secondary" loading={loadingMore} onClick={onLoadMore}>Показать ещё</Button> : null}
      </div>
    </main>
    <BottomNavigation active="markets" onChange={onNavChange}/>

    {menuOpen ? <div className={s.menuBackdrop} onClick={() => setMenuOpen(false)}><nav className={s.drawer} role="dialog" aria-modal="true" aria-label="Меню BetTON" data-figma-frame="819:46154" onClick={e => e.stopPropagation()}>
      <div className={s.drawerHeading}><strong className={s.brand}>Bet<em>TON</em></strong><button type="button" aria-label="Закрыть меню" onClick={() => setMenuOpen(false)}>×</button></div>
      <button type="button" className={s.drawerProfile} onClick={() => closeMenu(onProfileClick ?? a.onOpenProfile)}><span className={s.avatar}>{headerUser?.photoUrl ? <img src={headerUser.photoUrl} alt=""/> : headerUser?.initials ?? '?'}</span><span><strong>{headerUser?.displayName ?? 'Гость'}</strong><small>{headerUser?.handle ? '@' + headerUser.handle.replace(/^@/,'') : 'Откройте через Telegram'}</small></span><FeedAsset name="f9c02" size={16}/></button>
      <button type="button" className={s.drawerBalance} onClick={() => closeMenu(onProfileClick ?? a.onOpenProfile)}><FeedAsset name="ba2bd" size={20}/><span><small>Баланс</small><strong>{headerUser ? formatTonFull(headerUser.availableTon) : '—'}</strong></span></button>
      {drawerRow('Главная','1b500',()=>onNavChange?.('markets'),true)}
      {drawerRow('Все категории','d8f74',onFiltersClick)}
      <button type="button" className={s.drawerRow} onClick={() => closeMenu(()=>setSearchOpen(true))}><span className={s.searchGlyph} aria-hidden="true">⌕</span><span>Поиск событий</span><FeedAsset name="03b6c" size={14}/></button>
      {drawerRow('Избранное','79e2e',()=>setFavoriteOnly(!favoriteOnly))}
      {drawerRow('Мои события','5d5ed',a.onOpenMyEvents)}
      {drawerRow('Черновики','7e237',()=>onNavChange?.('create'))}
      {drawerRow('История','878ef',a.onOpenHistory)}
      <hr/>{drawerRow('Как это работает','0e2ff',a.onOpenHelp)}{drawerRow('Правила и безопасность','a7b33',a.onOpenHelp)}{drawerRow('Поддержка','d8328',a.onOpenHelp)}
      <hr/>{drawerRow('Настройки','02d42',a.onOpenSettings)}
      <hr/>{drawerRow('Тема','5ad7e',a.onOpenSettings,false,'Светлая')}{drawerRow('Язык','cc62e',a.onOpenSettings,false,locale === 'ru' ? 'Русский' : locale === 'en' ? 'English' : '中文')}
      <hr/>{drawerRow('Выйти','7d986',closeTelegramWebApp,true)}
      {onChatClick ? <button type="button" className={s.drawerRow} onClick={() => closeMenu(onChatClick)}>Лобби BetTON{chatUnreadReplies ? ` · ${chatUnreadReplies}` : ''}</button> : null}
      <button type="button" className={s.drawerMetric} onClick={() => setMetricsOpen(!metricsOpen)}>В предложениях · {statsError ? '—' : formatOffersNano(activeOffersNano)}</button>{metricsOpen ? <p className={s.drawerNote}>Сумма открытых предложений в публичных событиях. Уже заключённые ставки сюда не входят.{statsError ? <button type="button" onClick={onRetryStats}>Повторить загрузку</button> : null}</p> : null}
    </nav></div> : null}
  </div>
}

function FeedMarketCard({ market: m, selectedSide, favorite, onFavorite, onOpen, onSelect }: { market: MarketFixture; selectedSide?: OutcomeSide; favorite: boolean; onFavorite: () => void; onOpen: () => void; onSelect: (side: OutcomeSide) => void }) {
  const categoryIcon = m.categoryKey === 'esports' || /киберспорт|dota|cs2/i.test(m.category) ? 'b804c' : m.categoryKey === 'sport' || /спорт|футбол/i.test(m.category) ? '44882' : null
  const selected = m.resolvedSide ?? selectedSide
  return <article className={s.card}>
    <div className={s.cardCategory}>{categoryIcon ? <FeedAsset name={categoryIcon} size={16}/> : null}<span>{m.category}</span><button type="button" className={favorite ? s.favoriteSelected : ''} aria-label={favorite ? 'Удалить из избранного' : 'В избранное'} aria-pressed={favorite} onClick={onFavorite}><FeedAsset name="75a12" size={18}/></button></div>
    <button type="button" className={s.cardTitle} onClick={onOpen}>{m.question}</button>
    <button type="button" className={s.date} onClick={onOpen}><FeedAsset name="9c351" size={13}/><span>{m.closeAtLabel ?? m.closeLabel}</span></button>
    <div className={s.outcomes}>{(['a', 'b'] as const).map(side => { const outcome = side === 'a' ? m.outcomeA : m.outcomeB; const isSelected = selected === side; return <button type="button" key={side} className={isSelected ? s.outcomeSelected : s.outcome} onClick={() => onSelect(side)}><TeamLogo label={outcome.label}/><span className={s.outcomeCopy}><b>{outcome.label}</b><strong>{formatOdds(outcome.odds)}</strong></span><span className={isSelected ? s.markerSelected : s.marker}>{isSelected ? <FeedAsset name="4e28a" size={10}/> : null}</span></button> })}</div>
    <dl className={s.metrics}><div><FeedAsset name="f3988" size={17}/><span><dt>В предложениях</dt><dd>{formatOffersNano(m.activeOffersNano)}</dd></span></div><div><FeedAsset name="4b750" size={17}/><span><dt>Предложений</dt><dd>{m.offersCount ?? '—'}</dd></span></div><div><FeedAsset name="1a43f" size={17}/><span><dt>Заключено ставок</dt><dd>{formatTonFull(m.volumeTon)}</dd></span></div></dl>
  </article>
}
