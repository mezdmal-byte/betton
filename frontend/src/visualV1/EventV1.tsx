import { EventChartV1 } from './EventChartV1'
import { usePanelDrag } from './usePanelDrag'
import { useEffect, useState } from 'react'
import { Button } from '../components/Button/Button'
import type { MarketDetailScreenProps, MarketDetailPane } from '../screens/MarketDetailScreen'
import type { OutcomeSide } from '../types/market'
import { marketYesNo } from '../fixtures/markets'
import { formatOdds, formatTonFull } from '../lib/format'
import { marketIsLocked } from '../lib/quote'
import backIcon from '../assets/visual-v1/event/499a5.svg'
import shareIcon from '../assets/visual-v1/event/2106e.svg'
import starIcon from '../assets/visual-v1/event/64d77.svg'
import spiritLogo from '../assets/visual-v1/event/0d231.svg'
import liquidLogo from '../assets/visual-v1/event/eda5a.svg'
import clockIcon from '../assets/visual-v1/event/f74ba.svg'
import publicIcon from '../assets/visual-v1/event/9732e.svg'
import lightningIcon from '../assets/visual-v1/event/73ece.svg'
import checkIcon from '../assets/visual-v1/event/4e28a.svg'
import s from './EventV1.module.css'

export function EventLogo({ label, size = 32 }: { label: string; size?: number }) {
  const src = /team spirit/i.test(label) ? spiritLogo : /team liquid/i.test(label) ? liquidLogo : null
  return src ? <span className={s.logo} style={{ width: size, height: size }}><img src={src} alt="" /></span> : null
}

const status: Record<string, string> = { open: 'Активно', closing: 'Активно', closed: 'Ожидается результат', resolved: 'Результат подтверждён', cancelled: 'Отменено', pending: 'На модерации', rejected: 'Отклонено' }

export function EventV1(props: MarketDetailScreenProps) {
  const { market = marketYesNo, viewState = 'ready', onBack, onSelectSide, onOwnPrice, onPlace, actionsDisabled, onRetry, banner, extra, onShare, onExternalShare, shareAvailable, shareValue, onRetryBook, onRetryTrades, discussionUnreadReplies = 0, onDiscussion } = props
  const [localSide, setSide] = useState<OutcomeSide>(props.selectedSide ?? 'a')
  const [localPane, setLocalPane] = useState<MarketDetailPane>('chart')
  useEffect(() => { if (props.selectedSide) setSide(props.selectedSide) }, [props.selectedSide])
  const ticketDrag = usePanelDrag('y', -1, !actionsDisabled && onPlace ? () => onPlace(side) : undefined)
  const [discussion, setDiscussion] = useState(false)
  const [favorite, setFavorite] = useState(() => { try { return JSON.parse(localStorage.getItem('betton.saved-events.v1') ?? '[]').includes(market.id) } catch { return false } })
  useEffect(() => { try { setFavorite(JSON.parse(localStorage.getItem('betton.saved-events.v1') ?? '[]').includes(market.id)) } catch { setFavorite(false) } }, [market.id])
  const toggleFavorite = () => { try { const ids: string[] = JSON.parse(localStorage.getItem('betton.saved-events.v1') ?? '[]'); localStorage.setItem('betton.saved-events.v1', JSON.stringify(favorite ? ids.filter(id => id !== market.id) : [...new Set([...ids, market.id])])); setFavorite(!favorite) } catch { /* Keep the current state when storage is unavailable. */ } }
  const side = onSelectSide ? props.selectedSide ?? 'a' : localSide
  const pane = props.pane ?? localPane
  const selected = side === 'a' ? market.outcomeA : market.outcomeB
  const changePane = (next: MarketDetailPane) => { setDiscussion(false); props.onPaneChange?.(next); setLocalPane(next) }
  const changeSide = (next: OutcomeSide) => { onSelectSide?.(next); setSide(next) }
  const off = actionsDisabled || marketIsLocked(market)
  const bookA = props.orderbookA ?? [], bookB = props.orderbookB ?? []
  const queue = [...bookA, ...bookB].reduce((sum, row) => sum + row.availableTon, 0)
  const title = viewState === 'loading' ? 'Загружаем событие…' : viewState === 'not-found' ? 'Событие не найдено' : viewState === 'forbidden' ? 'Недостаточно прав' : 'Не удалось загрузить событие'
  return <div className={s.screen} data-figma-frame="908:19752">
    <header className={s.header}><button type="button" aria-label="Назад" onClick={onBack}><img src={backIcon} alt="" /></button><h1>Событие</h1>{shareAvailable ? <button type="button" aria-label="Поделиться событием" onClick={() => changePane('share')}><img src={shareIcon} alt="" /></button> : null}<button type="button" aria-label={favorite ? 'Убрать из сохранённых на этом устройстве' : 'Сохранить на этом устройстве'} title="Сохранённые события на этом устройстве" aria-pressed={favorite} onClick={toggleFavorite}><img src={starIcon} alt="" /></button></header>
    {viewState !== 'ready' ? <main className={s.scroll}><section className={s.card} role="status"><h2>{title}</h2>{onRetry && viewState === 'error' ? <Button onClick={onRetry}>Повторить</Button> : null}</section></main> : <>
    <main className={s.scroll}>
      <section className={s.eventCard}><p className={s.meta}>{market.category}{props.demoHistory ? ' · Демо' : ''}</p><div className={s.description}><div><h2>{market.question}</h2><strong>{market.outcomeA.label} — {market.outcomeB.label}</strong></div>{/team spirit|team liquid/i.test(market.outcomeA.label + market.outcomeB.label) ? <div className={s.teams}><EventLogo label={market.outcomeA.label} size={38}/><span>VS</span><EventLogo label={market.outcomeB.label} size={38}/></div> : null}</div><div className={s.chips}><span><img src={publicIcon} alt=""/>{market.visibility === 'unlisted' ? 'По ссылке' : 'Публичное'}</span><span className={market.status === 'open' || market.status === 'closing' ? s.activeChip : ''}>{status[market.status]}</span></div><p className={s.closing}><img src={clockIcon} alt=""/>{market.closeAtLabel ?? market.closeLabel}</p></section>
      <div className={s.outcomes}>{(['a','b'] as const).map(id => { const item = id === 'a' ? market.outcomeA : market.outcomeB; return <button type="button" key={id} aria-pressed={side === id} className={side === id ? s.selected : ''} onClick={() => changeSide(id)}><EventLogo label={item.label} size={28}/><span><b>{item.label}</b><strong>{formatOdds(item.odds)}</strong></span><i aria-hidden="true">{side === id ? <img src={checkIcon} alt=""/> : null}</i></button> })}</div>
      <dl className={s.metrics}><div><dt>В предложениях</dt><dd>{market.activeOffersNano != null ? formatTonFull(Number(market.activeOffersNano) / 1e9) : props.orderbookState === 'ready' ? formatTonFull(queue) : '—'}</dd></div><div><dt>Предложений</dt><dd>{market.offersCount ?? '—'}</dd></div><div><dt>Заключено ставок</dt><dd>{formatTonFull(market.volumeTon)}</dd></div></dl>
      <nav className={s.tabs} aria-label="Разделы события"><button type="button" aria-current={!discussion && pane === 'chart' ? 'page' : undefined} onClick={() => changePane('chart')}>График</button><button type="button" aria-current={!discussion && pane === 'book' ? 'page' : undefined} onClick={() => changePane('book')}>Предложения</button><button type="button" aria-current={!discussion && ['criteria','sources','share'].includes(pane) ? 'page' : undefined} onClick={() => changePane('criteria')}>Информация</button><button type="button" aria-current={discussion ? 'page' : undefined} onClick={() => { setDiscussion(true); props.onPaneChange?.('chart') }}>Обсуждение{discussionUnreadReplies > 0 ? <b>{discussionUnreadReplies}</b> : null}</button></nav>
      {discussion ? <section className={s.card}><div className={s.sectionHeading}><h2>Обсуждение</h2><button type="button" onClick={onDiscussion} disabled={!onDiscussion}>Открыть чат →</button></div>{props.discussionState==='loading'?<p role="status" className={s.note}>Загружаем обсуждение…</p>:props.discussionState==='error'?<><p role="alert" className={s.note}>Не удалось загрузить сообщения.</p><Button variant="secondary" onClick={props.onRetryDiscussion}>Повторить загрузку обсуждения</Button></>:props.discussionState==='unavailable'?<p className={s.note}>Войдите через Telegram, чтобы прочитать обсуждение.</p>:props.discussionMessages?.length?<div className={s.discussionPreview}>{props.discussionMessages.slice(-3).map(message=><article key={message.id}><strong>{message.author.display_name}</strong><p>{message.deleted?'Сообщение удалено':message.text}</p></article>)}</div>:<p className={s.note}>Сообщений пока нет.</p>}{onDiscussion ? <Button variant="secondary" fullWidth onClick={onDiscussion}>Написать сообщение</Button> : <p className={s.note}>Откройте приложение в Telegram, чтобы участвовать.</p>}</section> : pane === 'book' ? <section className={s.card}><h2>Предложения участников</h2>{props.orderbookState === 'loading' ? <p>Загружаем предложения…</p> : props.orderbookState === 'error' ? <Button onClick={onRetryBook}>Повторить загрузку</Button> : <div className={s.book}>{[[market.outcomeA.label,bookA],[market.outcomeB.label,bookB]].map(([label,rows],index) => <div key={index}><h3>{String(label)}</h3><div className={s.bookLabel}><span>Коэфф.</span><span>Доступно, TON</span></div>{(rows as typeof bookA).length ? (rows as typeof bookA).map((row,i) => <button type="button" key={i} onClick={() => changeSide(index === 0 ? 'a':'b')}><strong>{formatOdds(row.odds)}</strong><span>{formatTonFull(row.availableTon).replace(' TON','')}</span></button>) : <p className={s.note}>Нет предложений</p>}</div>)}</div>}</section> : pane === 'share' ? <section className={s.card}><h2>Поделиться событием</h2><input aria-label="Ссылка на событие" value={shareValue ?? ''} readOnly onFocus={e => e.currentTarget.select()}/><Button fullWidth onClick={onShare}>Скопировать ссылку</Button>{onExternalShare ? <Button fullWidth variant="secondary" onClick={onExternalShare}>Отправить в Telegram</Button> : null}</section> : pane === 'criteria' || pane === 'sources' ? <section className={s.card}><h2>Как определяется результат</h2><p className={s.prose}>{market.description || 'Условия события не указаны.'}</p>{market.resolution ? <p className={s.prose}>{market.resolution}</p> : null}<button type="button" className={s.creator} onClick={props.onCreatorClick} disabled={!props.onCreatorClick}>Создатель · {market.creator.displayName} →</button>{banner}{extra}</section> : <section className={s.card}><h2>Движение коэффициентов</h2>{props.tradeHistoryState === 'loading' ? <p>Загружаем сделки…</p> : props.tradeHistoryState === 'error' ? <Button onClick={onRetryTrades}>Повторить загрузку</Button> : <EventChartV1 a={props.chartSeriesA ?? []} b={props.chartSeriesB ?? []} market={market}/>}<div className={s.sectionHeading}><h3>Последние сделки</h3><button type="button" onClick={() => changePane('trades')}>Все сделки →</button></div>{(side === 'a' ? props.recentTradesA : props.recentTradesB)?.slice(pane === 'trades' ? -50 : -3).reverse().map((trade,i) => <div className={s.trade} key={trade.id ?? i}><b>{formatOdds(trade.odds)}</b><span>{formatTonFull(trade.amountTon)}</span><small>{trade.timeAgo}</small></div>)}</section>}
      {!['criteria','sources'].includes(pane) ? <div className={s.governance}>{banner}{extra}</div> : null}
    </main>
    <section className={s.ticket} style={ticketDrag.style} aria-label="Быстрая ставка"><button type="button" className={s.handle} aria-label="Раскрыть панель ставки" disabled={off || !onPlace} {...ticketDrag.handlers} onClick={() => onPlace?.(side)}><span/></button><strong className={s.ticketTitle}><img src={lightningIcon} alt=""/>Быстрая ставка</strong><div className={s.ticketControls}><div><EventLogo label={selected.label} size={22}/><span><b>{selected.label}</b><strong>{formatOdds(selected.odds)}</strong></span></div><button type="button" className={s.amountShortcut} disabled={off || !onPlace} onClick={() => onPlace?.(side)}>{props.draftAmount?formatTonFull(props.draftAmount):'Сумма TON'}</button><Button className={s.compactCta} disabled={off || !onPlace} onClick={() => onPlace?.(side)}>Ввести сумму</Button></div>{onOwnPrice ? <button type="button" className={s.ownPrice} disabled={off} onClick={onOwnPrice}>Свой коэффициент</button> : null}</section>
    </>}
  </div>
}
