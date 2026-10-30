import wordmark from '../assets/visual-v1/wordmark.svg'
import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '../components/Button/Button'
import { syncTelegramBackButton } from '../telegram/webapp'
import { FeedAsset } from './FeedV1'
import s from './FeedFiltersV1.module.css'

type OfferFilter = 'any' | 'available' | 'empty'
type Props = { open: boolean; status: string; category: string; offers?: OfferFilter; closeBefore?: string; onClose: () => void; onApply: (status: string, category: string, offers: OfferFilter, closeBefore?: string) => void }
const categoryLabels: Record<string, string> = { all: 'Все события', esports: 'Киберспорт', sport: 'Спорт', crypto: 'Криптовалюты', politics: 'Политика', other: 'Другие' }
const offerLabels: Record<OfferFilter, string> = { any: 'Любые', available: 'Есть доступные предложения', empty: 'Без предложений' }
const statusLabels: Record<string, string> = { all: 'Все', open: 'Открытые', closed: 'Ожидают результата', resolved: 'Завершённые', cancelled: 'Отменённые' }
type Panel = 'main' | 'category' | 'offers' | 'status'

/** Approved filter pages use staged edits: changing a row never refetches the feed
 * until the main Apply action. The retained legacy FilterSheet stays independent. */
export function FeedFiltersV1({ open, status, category, offers = 'any', closeBefore, onClose, onApply }: Props) {
  const [panel, setPanel] = useState<Panel>('main')
  const [draftStatus, setStatus] = useState(status)
  const [draftCategory, setCategory] = useState(category)
  const [draftOffers, setOffers] = useState<OfferFilter>(offers)
  const [draftDate, setDate] = useState(closeBefore)
  const [calendarOpen, setCalendarOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    setPanel('main'); setStatus(status); setCategory(category); setOffers(offers); setDate(closeBefore)
  }, [open, status, category, offers, closeBefore])
  useEffect(() => {
    if (!open) return
    const back = () => { if (calendarOpen) setCalendarOpen(false); else if (panel !== 'main') setPanel('main'); else onClose() }
    const cleanup = syncTelegramBackButton(true, back)
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') back() }
    window.addEventListener('keydown', key)
    return () => { cleanup?.(); window.removeEventListener('keydown', key) }
  }, [open, panel, calendarOpen, onClose])
  if (!open) return null
  const back = () => panel === 'main' ? onClose() : setPanel('main')
  const title = panel === 'main' ? 'Фильтры' : panel === 'category' ? 'Категории' : panel === 'offers' ? 'Предложения' : 'Статус события'
  const frame = panel === 'main' ? '821:7385' : panel === 'category' ? '933:27394' : panel === 'offers' ? '821:7564' : '821:7476'
  function row(label: string, icon: string, action: () => void, value?: string, checked?: boolean) {
    return <button type="button" className={s.row} onClick={action} aria-pressed={checked}><span className={s.icon}><FeedAsset name={icon} size={22}/></span><span className={s.copy}><strong>{label}</strong>{value ? <small>{value}</small> : null}</span>{checked ? <span className={s.selected} aria-hidden="true">✓</span> : <FeedAsset name="0de93" size={16}/>}</button>
  }
  return <section className={s.screen} role="dialog" aria-modal="true" aria-label={title} data-figma-frame={frame}>
    <header className={s.header}><button type="button" aria-label="Назад" onClick={back}><FeedAsset name="f259b" size={20}/></button><strong className={s.brand}><img src={wordmark} width={101} height={32} alt="BetTON"/></strong><span/></header>
    <main className={s.body}><div className={s.heading}><h1>{title}</h1>{panel === 'main' ? <p>Уточните список событий</p> : panel === 'category' ? <p>Выберите события по интересам</p> : null}</div>
      <div className={s.list}>
        {panel === 'main' ? <>{row('Категория', '15236', () => setPanel('category'), draftCategory === 'all' ? 'Все' : categoryLabels[draftCategory])}{row('Предложения', 'e08e7', () => setPanel('offers'), offerLabels[draftOffers])}{row('Приём ставок до', '08b5d', () => setCalendarOpen(true), draftDate ? new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(draftDate)) + ' · UTC' : 'Любая дата')}{/* Existing status filter is retained as an additional row using the approved row component. */}{row('Статус события', '15236', () => setPanel('status'), statusLabels[draftStatus] ?? statusLabels.all)}</> : null}
        {panel === 'category' ? Object.entries(categoryLabels).map(([id, label]) => <div key={id}>{row(label, id === 'esports' ? '4b750' : id === 'sport' ? '55d6a' : id === 'crypto' ? 'e08e7' : '15236', () => { setCategory(id); setPanel('main') }, undefined, draftCategory === id)}</div>) : null}
        {panel === 'offers' ? Object.entries(offerLabels).map(([id, label]) => <div key={id}>{row(label, '15236', () => setOffers(id as OfferFilter), undefined, draftOffers === id)}</div>) : null}
        {panel === 'status' ? Object.entries(statusLabels).map(([id, label]) => <div key={id}>{row(label, '15236', () => setStatus(id), undefined, draftStatus === id)}</div>) : null}
      </div>
    </main>
    {panel !== 'category' ? <footer className={s.footer}><Button fullWidth className={s.cta} onClick={() => { if (panel !== 'main') setPanel('main'); else { onApply(draftStatus, draftCategory, draftOffers, draftDate); onClose() } }}>Применить</Button>{panel === 'main' ? <Button fullWidth className={`${s.cta} ${s.reset}`} variant="secondary" onClick={() => { setStatus('open'); setCategory('all'); setOffers('any'); setDate(undefined) }}>Сбросить</Button> : null}</footer> : null}
    {calendarOpen ? <CutoffCalendar value={draftDate} onClose={() => setCalendarOpen(false)} onApply={value => { setDate(value); setCalendarOpen(false) }}/>:null}
  </section>
}

function CutoffCalendar({ value, onClose, onApply }: { value?: string; onClose: () => void; onApply: (value: string) => void }) {
  const [day, setDay] = useState(() => (value ? new Date(value) : new Date()).toISOString().slice(0, 10))
  const [month, setMonth] = useState(() => new Date(day + 'T00:00:00Z'))
  const [time, setTime] = useState(() => value ? new Date(value).toISOString().slice(11, 16) : '19:00')
  const [offset, setOffset] = useState(0)
  const year = month.getUTCFullYear(), monthNumber = month.getUTCMonth()
  const first = new Date(Date.UTC(year, monthNumber, 1)), last = new Date(Date.UTC(year, monthNumber + 1, 0)).getUTCDate()
  const leading = (first.getUTCDay() + 6) % 7
  const monthLabel = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(first).replace(' г.', '')
  const cells: ReactNode[] = Array.from({ length: leading }, (_, i) => <span key={'empty-' + i}/>)
  for (let date = 1; date <= last; date++) {
    const id = `${year}-${String(monthNumber + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`
    cells.push(<button key={id} type="button" aria-label={id} aria-pressed={id === day} onClick={() => setDay(id)}>{date}</button>)
  }
  const apply = () => {
    const parsed = new Date(`${day}T${time}:00Z`).getTime()
    if (Number.isFinite(parsed)) onApply(new Date(parsed - offset * 60_000).toISOString())
  }
  return <div className={s.scrim} onClick={onClose}><section className={s.calendar} role="dialog" aria-modal="true" aria-label="Приём ставок до" data-figma-frame="928:25543" onClick={event => event.stopPropagation()}><div className={s.calendarHead}><h2>Приём ставок до</h2><button type="button" aria-label="Закрыть календарь" onClick={onClose}>×</button></div><div className={s.month}><button type="button" aria-label="Предыдущий месяц" onClick={() => setMonth(new Date(Date.UTC(year, monthNumber - 1, 1)))}>‹</button><strong>{monthLabel}</strong><button type="button" aria-label="Следующий месяц" onClick={() => setMonth(new Date(Date.UTC(year, monthNumber + 1, 1)))}>›</button></div><div className={s.calendarGrid} role="group" aria-label="Выберите дату">{['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(label => <small key={label}>{label}</small>)}{cells}</div><label className={s.field}>Время<input type="time" value={time} required onChange={e => setTime(e.target.value)}/></label><label className={s.field}>Часовой пояс<select value={offset} onChange={e => setOffset(Number(e.target.value))}><option value={0}>UTC</option><option value={180}>Москва · UTC+3</option><option value={420}>Красноярск · UTC+7</option></select></label><Button fullWidth className={s.calendarApply} disabled={!time} onClick={apply}>Применить</Button></section></div>
}
