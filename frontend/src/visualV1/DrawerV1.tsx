import { useEffect, useRef, useState } from 'react'
import type { MarketsHeaderUser } from '../screens/MarketsScreen'
import { formatTonFull } from '../lib/format'
import { closeTelegramWebApp, syncTelegramBackButton } from '../telegram/webapp'
import { useI18n } from '../i18n'
import { useVisualV1Actions } from './VisualV1Context'
import s from './DrawerV1.module.css'
import { usePanelDrag } from './usePanelDrag'
import wordmark from '../assets/visual-v1/wordmark.svg'

const images = import.meta.glob('../assets/visual-v1/feed/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return <span className={s.icon} style={{ width: size, height: size }} aria-hidden="true">
    <img src={images['../assets/visual-v1/feed/' + name + '.svg']} alt="" draggable={false} />
  </span>
}

export type DrawerUserV1 = Pick<MarketsHeaderUser, 'displayName' | 'handle' | 'initials' | 'availableTon' | 'photoUrl'>

export type DrawerV1Props = {
  user?: DrawerUserV1 | null
  onClose: () => void
  onMarkets?: () => void
  onCreate?: () => void
  onProfile?: () => void
  onCategories?: () => void
  onSearch?: () => void
  onFavorites?: () => void
  onChat?: () => void
  chatUnread?: number
  activeOffersNano?: string
  offersDisplay?: string
  statsError?: boolean
  onRetryStats?: () => void
}

export function DrawerV1({
  user, onClose, onMarkets, onCreate, onProfile, onCategories, onSearch,
  onFavorites, onChat, chatUnread = 0, offersDisplay, statsError, onRetryStats,
}: DrawerV1Props) {
  const a = useVisualV1Actions()
  const { locale } = useI18n()
  const panel = useRef<HTMLElement>(null)
  const drag = usePanelDrag('x', -1, onClose)
  const [metricsOpen, setMetricsOpen] = useState(false)
  const closeRef = useRef(onClose)

  useEffect(() => { closeRef.current = onClose }, [onClose])
  useEffect(() => syncTelegramBackButton(true, () => closeRef.current()), [])
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current() }
      if (e.key !== 'Tab') return
      const controls = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]')
      if (!controls?.length) return
      const first = controls[0], last = controls[controls.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) {
        e.preventDefault(); first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    panel.current?.focus({ preventScroll: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [])

  function activate(action?: () => void) {
    onClose()
    action?.()
  }

  function openFeedIntent(intent: 'categories' | 'search' | 'favorites') {
    if (intent === 'categories' && onCategories) return activate(onCategories)
    if (intent === 'search' && onSearch) return activate(onSearch)
    if (intent === 'favorites' && onFavorites) return activate(onFavorites)
    // A menu opened from Profile can request a Feed view after navigation.
    try { window.sessionStorage.setItem('betton.v1.drawer.intent', intent) } catch { /* optional */ }
    activate(onMarkets)
  }

  function row(label: string, icon: string, action?: () => void, accent = false, suffix?: string) {
    return <button type="button" className={accent ? s.accentRow : s.item} onClick={() => activate(action)}>
      <Icon name={icon}/><span>{label}</span>{suffix ? <small>{suffix}</small> : null}
      {!accent ? <Icon name="03b6c" size={14}/> : null}
    </button>
  }

  return <div className={s.backdrop} onClick={onClose}>
    <nav ref={panel} tabIndex={-1} className={s.drawer} role="dialog" aria-modal="true"
      aria-label="Меню BetTON" data-figma-frame="819:46154"
      style={drag.style} {...drag.handlers} onClick={e => e.stopPropagation()}>
      <div className={s.heading}><img src={wordmark} alt="BetTON" width={101} height={32}/>
        <button type="button" aria-label="Закрыть меню" onClick={onClose}>×</button></div>
      <button type="button" className={s.profile} onClick={() => activate(onProfile ?? a.onOpenProfile)}>
        <span className={s.avatar}>{user?.photoUrl ? <img src={user.photoUrl} alt=""/> : user?.initials ?? '?'}</span>
        <span className={s.profileCopy}><strong>{user?.displayName ?? 'Гость'}</strong>
          <small>{user?.handle ? '@' + user.handle.replace(/^@/, '') : 'Откройте через Telegram'}</small></span>
        <Icon name="03b6c" size={18}/>
      </button>
      <button type="button" className={s.balance} onClick={() => activate(onProfile ?? a.onOpenProfile)}>
        <Icon name="ba2bd" size={22}/><span><small>Баланс</small>
          <strong>{user ? formatTonFull(user.availableTon) : '—'}</strong></span>
        <Icon name="03b6c" size={14}/>
      </button>
      {row('Главная', '1b500', onMarkets, true)}
      <button type="button" className={s.item} onClick={() => openFeedIntent('categories')}>
        <Icon name="d8f74"/><span>Все категории</span><Icon name="03b6c" size={14}/></button>
      <button type="button" className={s.item} onClick={() => openFeedIntent('search')}>
        <span className={s.searchIcon}>⌕</span><span>Поиск событий</span><Icon name="03b6c" size={14}/></button>
      <button type="button" className={s.item} onClick={() => openFeedIntent('favorites')}>
        <Icon name="79e2e"/><span>Избранное</span><Icon name="03b6c" size={14}/></button>
      {row('Мои события', '5d5ed', a.onOpenMyEvents)}
      {row('Черновики', '7e237', onCreate)}
      {row('История', '878ef', a.onOpenHistory)}
      <hr/>
      {row('Как это работает', '0e2ff', a.onOpenHelp)}
      {row('Правила и безопасность', 'a7b33', a.onOpenHelp)}
      {row('Поддержка', 'd8328', a.onOpenHelp)}
      <hr/>
      {row('Настройки', '02d42', a.onOpenSettings)}
      {row('Тема', '5ad7e', a.onOpenSettings, false, 'Светлая')}
      {row('Язык', 'cc62e', a.onOpenSettings, false, locale === 'ru' ? 'Русский' : locale === 'en' ? 'English' : '中文')}
      <hr/>
      {row('Выйти', '7d986', closeTelegramWebApp, true)}
      {onChat ? <button type="button" className={s.item} onClick={() => activate(onChat)}>Лобби BetTON{chatUnread ? ' · ' + chatUnread : ''}</button> : null}
      {offersDisplay !== undefined ? <>
        <button type="button" className={s.metric} onClick={() => setMetricsOpen(v => !v)}>
          В предложениях · {statsError ? '—' : offersDisplay}
        </button>
        {metricsOpen ? <p className={s.note}>Открытые предложения в публичных событиях. Заключённые ставки не входят.
          {statsError ? <button type="button" onClick={onRetryStats}>Повторить загрузку</button> : null}</p> : null}
      </> : null}
    </nav>
  </div>
}
