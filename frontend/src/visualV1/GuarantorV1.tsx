import { useEffect, useRef, useState } from 'react'
import { type Guarantor, type CaseSummary, caseLabels, displayTime, deadlineLabel } from '../api/guarantors'
import { Button } from '../components/Button/Button'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { GuarantorProfileV1 } from './GuarantorProfileV1'
import { syncTelegramBackButton } from '../telegram/webapp'
import { AccountAsset, AccountHeaderV1, AccountStateV1, AccountTitleV1 } from './AccountV1Shared'
import s from './AccountV1.module.css'

type Props = {
  userId?: number; isAdmin: boolean; onBack: () => void; onOpen: (id: number) => void; onNavChange: (id: NavId) => void
  mine?: Guarantor | null; directory: Guarantor[]; cases: CaseSummary[]; applications: Guarantor[]
  loading: boolean; casesLoading: boolean; directoryLoading: boolean; errors: { message: string; retry: () => void }[]
  mutationError?: string; pending: boolean; clock: number
  onSubmit: (path: string, body: object, method?: string) => void
}

function Rules() {
  return <><p>Принимайте только те пари, результат которых сможете объективно проверить.</p><p>До начала ставок согласуйте условия, критерии, источники проверки и вознаграждение.</p><p>Соблюдайте сроки, объясняйте решение и сохраняйте доказательства. Нельзя гарантировать собственное событие.</p><p>Решение гаранта окончательное. Если решение не принято в установленный срок, событие отменяется с возвратом ставок по правилам платформы.</p><p>Администрация рассматривает жалобы и может приостановить работу гаранта за нарушение правил.</p></>
}

export function GuarantorV1({ userId, isAdmin, onBack, onOpen, onNavChange, mine, directory, cases, applications, loading, casesLoading, directoryLoading, errors, mutationError, pending, clock, onSubmit }: Props) {
  const [view, setView] = useState<'home'|'cases'|'catalog'|'rules'|'edit'|'reward'>('home')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [bio, setBio] = useState('')
  const [topics, setTopics] = useState('')
  const [accepted, setAccepted] = useState(false)
  const wasPending = useRef(pending)
  useEffect(() => {
    if (wasPending.current && !pending && !mutationError) setView('home')
    wasPending.current = pending
  }, [pending, mutationError])
  const selected = directory.find(g => g.user_id === selectedId) ?? applications.find(g => g.user_id === selectedId) ?? (mine?.user_id === selectedId ? mine : null)
  const registered = mine?.status === 'approved'
  const registering = !registered && mine?.status !== 'rejected' && view === 'home'
  const ownCases = cases.filter(c => c.guarantor_id === userId)
  const activeCases = ownCases.filter(c => !['settled','cancelled'].includes(c.state))
  const back = () => { if (selectedId != null) setSelectedId(null); else if (view !== 'home') setView('home'); else onBack() }
  useEffect(() => selectedId == null && view === 'home' ? undefined : syncTelegramBackButton(true, back), [selectedId, view])
  const title = selected ? 'Профиль гаранта' : view === 'rules' ? 'Правила работы гаранта' : view === 'cases' ? 'Мои проверки' : view === 'catalog' ? 'Каталог гарантов' : view === 'edit' ? 'Профиль гаранта' : view === 'reward' ? 'Вознаграждение гаранта' : registering ? 'Стать гарантом' : 'Кабинет гаранта'
  const errorContent = <>{errors.map((error,i) => <p className={s.error} role="alert" key={i}>{error.message} <button className={s.textAction} onClick={error.retry}>Повторить</button></p>)}{mutationError ? <p className={s.error} role="alert">{mutationError}</p> : null}</>
  const profileForm = <div className={s.form}><label className={s.field}>О себе · до 1000 символов<textarea value={bio} maxLength={1000} onChange={e => setBio(e.target.value)} placeholder="Расскажите, как вы проверяете результаты" disabled={pending}/></label><label className={s.field}>Темы · до 300 символов<input value={topics} maxLength={300} onChange={e => setTopics(e.target.value)} placeholder="Например: CS2, настольный теннис" disabled={pending}/></label><p className={s.muted}>Эти сведения будут видны в профиле гаранта.</p></div>
  const caseCards = (rows: CaseSummary[]) => rows.map(c => <section className={s.panel} key={c.market_id}><div className={s.caseHeading}><AccountAsset name={c.state === 'invited' ? '4b750' : '97e70'} size={18}/><strong>{c.state === 'invited' ? 'Новое приглашение' : caseLabels[c.state] ?? c.state}</strong></div><p>{c.question}</p>{c.deadline ? <p className={s.muted}>До {displayTime(c.deadline)} · {deadlineLabel(c.deadline, clock)}</p> : null}<button type="button" className={s.caseAction} onClick={() => onOpen(c.market_id)}>{c.state === 'invited' ? 'Посмотреть приглашение' : 'Открыть проверку'} →</button></section>)
  if (selected) return <GuarantorProfileV1 guarantor={selected} onBack={() => setSelectedId(null)} onCreate={() => onNavChange('create')} onHistory={selected.user_id === userId ? () => { setSelectedId(null); setView('cases') } : undefined}/>
  return <div className={s.screen} data-figma-frame={registering ? '829:11663' : '819:60994'}><AccountHeaderV1 onBack={back}/><main className={s.body}>
    <>
    <AccountTitleV1 title={title} subtitle={registered && view === 'home' ? `${mine.name} · ${mine.available ? 'Принимает новые пари' : 'Сейчас недоступен'}` : undefined}/>
    {errorContent}
    {!userId ? <AccountStateV1 title="Откройте BetTON через Telegram">Для профиля и приглашений требуется вход.</AccountStateV1> : loading ? <AccountStateV1 title="Загружаем профиль…"/> : view === 'rules' ? <section className={s.panel}><Rules/></section> : view === 'reward' ? <section className={s.panel}><h2>Условия для каждого события</h2><p>Вознаграждение согласуется с создателем при разборе приглашения. Выберите проверку, чтобы увидеть или предложить условия.</p><Button variant="secondary" onClick={() => setView('cases')}>Мои проверки</Button></section> : view === 'edit' ? <>{profileForm}<Button fullWidth className={s.button} disabled={pending} onClick={() => onSubmit('/guarantors/me', { bio, topics }, 'PUT')}>Сохранить описание</Button></> : view === 'cases' ? casesLoading ? <AccountStateV1 title="Загружаем проверки…"/> : ownCases.length ? caseCards(ownCases) : <AccountStateV1 title="Проверок пока нет">Приглашения появятся, когда создатель выберет вас гарантом.</AccountStateV1> : view === 'catalog' ? <>{directoryLoading ? <AccountStateV1 title="Загружаем гарантов…"/> : directory.length ? [...directory].sort((a,b) => Number(b.available)-Number(a.available)||b.completed-a.completed).map(g => <button className={s.row} type="button" key={g.user_id} onClick={() => setSelectedId(g.user_id)}><AccountAsset name="8e38d" size={24}/><span className={s.rowCopy}><strong>{g.name}</strong><small>{g.available ? 'Принимает пари' : 'Сейчас недоступен'} · {g.rating == null ? 'Без оценок' : `${g.rating.toFixed(1)} из 5`} · {g.completed} проверок</small>{g.topics ? <small>{g.topics}</small> : null}</span><AccountAsset name="0de93" size={16}/></button>) : <AccountStateV1 title="Гарантов пока нет"/>}</> : mine?.status === 'rejected' ? <AccountStateV1 title="Работа гарантом приостановлена">Для выяснения причин обратитесь к модератору BetTON.</AccountStateV1> : registering ? <>{profileForm}<label className={s.consent}><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} disabled={pending}/><span>Я принимаю правила работы гаранта</span></label><button type="button" className={s.textAction} onClick={() => setView('rules')}>Правила работы гаранта →</button></> : registered ? <>
      <div className={s.switchRow}><span>Доступность {mine.available ? 'включена' : 'выключена'}</span><button type="button" className={s.switch} role="switch" aria-checked={mine.available} aria-label="Принимать новые пари" disabled={pending} onClick={() => onSubmit('/guarantors/me/availability', { available: !mine.available })}><span/></button></div>
      {casesLoading ? <p className={s.muted}>Загружаем приглашения…</p> : activeCases.length ? caseCards(activeCases) : <section className={s.panel}><p>Новых приглашений пока нет.</p><p className={s.muted}>Для получения приглашений включите доступность и оставьте приложение открытым. Доступность действует один час.</p></section>}
      <button type="button" className={s.row} onClick={() => setView('reward')}><span className={s.softIcon}><AccountAsset name="da346" size={22}/></span><span className={s.rowCopy}><strong>Моё вознаграждение</strong><small>Согласуется для каждого события</small></span><AccountAsset name="0de93" size={16}/></button>
      <button type="button" className={s.row} onClick={() => setSelectedId(mine.user_id)}><span className={s.softIcon}><AccountAsset name="8e38d" size={22}/></span><span className={s.rowCopy}><strong>Профиль, отзывы и история</strong></span><AccountAsset name="0de93" size={16}/></button>
      <button type="button" className={s.textAction} onClick={() => { setBio(mine.bio); setTopics(mine.topics); setView('edit') }}>Редактировать профиль →</button>
    </> : null}
    {userId && view === 'home' ? <button type="button" className={s.textAction} onClick={() => setView('catalog')}>Каталог гарантов →</button> : null}
    {isAdmin && view === 'home' ? <section className={s.panel}><h2>Контроль гарантов</h2><p className={s.muted}>Регистрация открыта всем. При нарушении правил администрация может приостановить работу гаранта.</p>{applications.map(g => <div className={s.adminRow} key={g.user_id}><button type="button" className={s.textAction} onClick={() => setSelectedId(g.user_id)}>{g.name} →</button><p className={s.muted}>{g.status === 'approved' ? 'Активен' : g.status === 'rejected' ? 'Приостановлен' : 'Ожидает активации'} · {g.completed} проверок · {g.disputes} споров</p>{g.status === 'approved' || g.status === 'rejected' ? <Button variant="secondary" className={s.button} disabled={pending} onClick={() => onSubmit(`/guarantors/${g.user_id}/approval`, { approved: g.status !== 'approved' })}>{g.status === 'approved' ? 'Приостановить' : 'Восстановить'}</Button> : null}</div>)}</section> : null}
    </>
  </main>{!selected && userId && !loading && view === 'home' ? <footer className={`${s.footer} ${registering ? '' : s.guarantorFooter}`}>{registering ? <><Button className={s.button} fullWidth disabled={!accepted || pending} loading={pending} onClick={() => onSubmit('/guarantors/me', { bio, topics, accept_rules: true }, 'PUT')}>Создать профиль</Button><Button variant="secondary" className={`${s.button} ${s.outline}`} fullWidth onClick={onBack}>Назад в профиль</Button></> : <Button variant="secondary" className={`${s.button} ${s.outline}`} fullWidth onClick={() => setView('cases')}>Мои проверки</Button>}</footer> : null}</div>
}
