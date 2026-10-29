import { useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { BottomNavigation, type NavId } from '../components/BottomNavigation/BottomNavigation'
import { Button } from '../components/Button/Button'
import { TextField } from '../components/TextField/TextField'
import { type CreationStep, type DraftErrors, type EventDraft, type EventType, validateVisualV1EventStep } from '../api/eventsV3'
import type { Guarantor } from '../api/guarantors'
import { GuarantorDetails } from '../app/GuarantorReputation'
import { readCreationDraft, saveCreationDraft } from '../screens/creationDrafts'
import { syncTelegramBackButton } from '../telegram/webapp'
import { NotificationBadgeContext } from '../components/BottomNavigation/NotificationBadgeContext'
import { useVisualV1Actions } from './VisualV1Context'
import backIcon from '../assets/visual-v1/create/back.svg'
import menuIcon from '../assets/visual-v1/create/menu.svg'
import profileIcon from '../assets/visual-v1/create/profile.svg'
import bellIcon from '../assets/visual-v1/create/bell.svg'
import publicIcon from '../assets/visual-v1/create/type-public.svg'
import privateIcon from '../assets/visual-v1/create/type-private.svg'
import guarantorIcon from '../assets/visual-v1/create/type-guarantor.svg'
import checkIcon from '../assets/visual-v1/create/type-check.svg'
import calendarIcon from '../assets/visual-v1/create/calendar.svg'
import chevronIcon from '../assets/visual-v1/create/chevron.svg'
import s from './CreateV1Wizard.module.css'

export type CreateV1WizardProps = {
  userId?: number; onBack: () => void; onSubmit: (draft: EventDraft) => void
  submitting?: boolean; disabled?: boolean; errorMessage?: string | null
  guarantors?: Guarantor[]; guarantorsLoading?: boolean; guarantorsError?: boolean
  onRetryGuarantors?: () => void; onNavChange?: (id: NavId) => void
}
const names = { public: 'Публичное событие', private: 'Частное без гаранта', guarantor: 'Частное с гарантом' }
const typeCards: { id: EventType; icon: string; description: ReactNode }[] = [
  { id: 'public', icon: publicIcon, description: <>Доступно всем.<br />Проходит модерацию.</> },
  { id: 'private', icon: privateIcon, description: <>Доступ по ссылке.<br />Результат определяет создатель.</> },
  { id: 'guarantor', icon: guarantorIcon, description: <>Доступ по ссылке.<br />Выбор гаранта и согласование условий.</> },
]
const steps: CreationStep[] = ['type', 'question', 'conditions', 'review', 'guarantor']
const frames = { public: { question: '819:58632', conditions: '819:58672', review: '819:58725' }, private: { question: '819:59033', conditions: '819:59068', review: '819:59110' }, guarantor: { question: '819:59213', conditions: '819:59248', review: '819:59311' } }
const categoryNames = { sport: 'Спорт', esports: 'Киберспорт', politics: 'Политика', crypto: 'Криптовалюты', unique: 'Другое' }
type FieldName = Exclude<keyof EventDraft, 'eventType' | 'category' | 'guarantorId'>

export function CreateV1Wizard({ userId, onBack, onSubmit, submitting = false, disabled = false, errorMessage, guarantors = [], guarantorsLoading, guarantorsError, onRetryGuarantors, onNavChange }: CreateV1WizardProps) {
  const actions = useVisualV1Actions()
  const unread = useContext(NotificationBadgeContext)
  const menu = useRef<HTMLDialogElement>(null)
  const invitation = useRef<HTMLDialogElement>(null)
  const [inviteConfirm, setInviteConfirm] = useState(false)
  const [initial] = useState(() => readCreationDraft(userId))
  const [draft, setDraft] = useState(initial.draft)
  const [step, setStep] = useState(initial.step)
  const [errors, setErrors] = useState<DraftErrors>({})
  const [backup, setBackup] = useState(Boolean(initial.draft.backupName || initial.draft.backupUrl))
  const [profileId, setProfileId] = useState<number | null>(null)
  const main = useRef<HTMLElement>(null)
  const selected = guarantors.find(g => g.user_id === draft.guarantorId)
  const profile = guarantors.find(g => g.user_id === profileId)
  const kind = draft.eventType ?? 'public'
  const position = step === 'question' ? 1 : step === 'conditions' ? 2 : 3
  const title = step === 'question' ? 'Вопрос и исходы' : step === 'conditions' ? 'Условия события' : step === 'review' ? 'Проверка события' : 'Выберите гаранта'
  useEffect(() => { saveCreationDraft(userId, draft, step) }, [draft, step, userId])
  useEffect(() => { main.current?.scrollTo({ top: 0 }) }, [step, profileId])
  const back = () => {
    if (submitting) return
    if (menu.current?.open) { menu.current.close(); return }
    if (inviteConfirm) { setInviteConfirm(false); return }
    if (profileId != null) { setProfileId(null); return }
    setErrors({})
    if (step === 'type') onBack()
    else setStep(steps[Math.max(0, steps.indexOf(step) - 1)]!)
  }
  useEffect(() => syncTelegramBackButton(true, back), [step, profileId, inviteConfirm, submitting, onBack])
  useEffect(() => { if (inviteConfirm) invitation.current?.showModal(); else invitation.current?.close() }, [inviteConfirm])
  function change<K extends keyof EventDraft>(key: K, value: EventDraft[K]) {
    if (submitting) return
    setDraft(old => ({ ...old, [key]: value }))
    setErrors(old => ({ ...old, [key]: undefined }))
  }
  function validate(which: CreationStep) {
    const next = validateVisualV1EventStep(draft, which)
    setErrors(next)
    if (Object.keys(next).length) {
      requestAnimationFrame(() => main.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return false
    }
    return true
  }
  function next() {
    if (submitting || disabled) return
    if (step === 'review' && kind === 'guarantor') { setStep('guarantor'); return }
    if (step === 'review' || step === 'guarantor') {
      for (const part of ['question', 'conditions'] as const) if (!validate(part)) { setStep(part); return }
      if (kind === 'guarantor' && !selected?.available) { setErrors({ guarantorId: 'Выберите доступного гаранта' }); return }
      if (kind === 'guarantor') { setInviteConfirm(true); return }
      onSubmit(draft); return
    }
    if (validate(step)) setStep(steps[steps.indexOf(step) + 1]!)
  }
  function field(name: FieldName, label: string, multiline = false, optional = false) {
    return <div className={s.field} key={name}><TextField id={'v1-event-' + name} label={label} value={draft[name]} onChange={v => change(name, v)} multiline={multiline} required={!optional} disabled={submitting} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? 'v1-error-' + name : undefined} maxLength={name === 'question' ? 512 : name.startsWith('outcome') ? 128 : name === 'sourceName' || name === 'backupName' ? 200 : 4000} />{errors[name] ? <p id={'v1-error-' + name} className={s.error} role="alert">{errors[name]}</p> : null}</div>
  }
  function date(name: 'closeAt' | 'endsAt', label: string) {
    return <section className={s.card}><h2>{label}</h2><DateControl name={name} label={label} value={draft[name]} onChange={v => change(name, v)} disabled={submitting} invalid={Boolean(errors[name])} /><p className={s.note}>Время указано в UTC</p>{errors[name] ? <p className={s.error} role="alert">{errors[name]}</p> : null}<p className={s.tint}>{name === 'closeAt' ? 'Приём ставок автоматически закроется в момент начала события.' : 'Для оценки длительности пари гарантом. Не завершает событие автоматически.'}</p></section>
  }
  function review(title: string, target: CreationStep, children: ReactNode) {
    return <section className={s.card}><div className={s.cardHeading}><h2>{title}</h2><button type="button" onClick={() => setStep(target)} disabled={submitting}>Изменить</button></div>{children}</section>
  }
  const criteria = <section className={s.card}><h2>Критерии результата</h2>{field('criterionA', 'Исход 1 · ' + (draft.outcomeA || 'Первый исход'), true)}{field('criterionB', 'Исход 2 · ' + (draft.outcomeB || 'Второй исход'), true)}</section>
  const sources = <section className={s.card}><h2>Источники проверки</h2>{field('sourceName', 'Основной источник')}{field('sourceUrl', 'Ссылка на источник')}{backup ? <>{field('backupName', 'Резервный источник · необязательно', false, true)}{field('backupUrl', 'Ссылка на резервный источник', false, true)}</> : <button type="button" className={s.link} onClick={() => setBackup(true)}>+ Добавить резервный источник</button>}</section>
  const cta = step === 'type' ? 'Продолжить' : step === 'question' ? 'Далее' : step === 'conditions' ? 'Проверить событие' : step === 'guarantor' ? 'Пригласить гаранта' : kind === 'public' ? 'Отправить на модерацию' : kind === 'private' ? 'Создать событие' : 'Выбрать гаранта'
  return <div className={s.screen} data-creation-step={step} data-figma-frame={step === 'type' ? '819:58549' : step === 'guarantor' ? '819:57609' : frames[kind][step]}>
    {step === 'type' ? <header className={s.appHeader}><button type="button" aria-label="Меню" onClick={() => menu.current?.showModal()}><img src={menuIcon} alt="" /></button><button type="button" className={s.bell} aria-label={`Уведомления${unread ? ` · ${unread}` : ''}`} onClick={actions.onOpenNotifications}><img src={bellIcon} alt="" />{unread > 0 ? <span className={s.unread} /> : null}</button><strong>Bet<span>TON</span></strong><button type="button" className={s.profileButton} aria-label="Профиль" onClick={actions.onOpenProfile}><img src={profileIcon} alt="" /></button></header> : <header className={s.header}><div className={s.heading}><button type="button" aria-label="Назад" onClick={back} disabled={submitting}><img src={backIcon} alt="" /></button><div><h1>{profile ? 'Профиль гаранта' : title}</h1><p>{step === 'guarantor' ? 'Приглашение и согласование' : `${position} из 3 · ${names[kind]}`}</p></div></div>{step !== 'guarantor' ? <div className={s.progress} aria-label={`Шаг ${position} из 3`}>{[1, 2, 3].map(n => <span key={n} className={n <= position ? s.complete : ''} />)}</div> : null}</header>}
    <main className={s.body} ref={main}>
      {errorMessage ? <div className={s.error} role="alert">{errorMessage}<p>Введённые данные сохранены. Проверьте статус предыдущей отправки перед повтором.</p></div> : null}
      {!userId ? <p className={s.note}>Для создания события откройте BetTON через Telegram.</p> : null}
      {step === 'type' ? <><div className={s.intro}><h1>Создание события</h1><p>Выберите тип события</p></div><div className={s.types} role="radiogroup" aria-label="Тип события">{typeCards.map(card => <button type="button" role="radio" aria-checked={draft.eventType === card.id} className={`${s.typeCard} ${draft.eventType === card.id ? s.selected : ''}`} key={card.id} onClick={() => { const restored = readCreationDraft(userId, card.id); setDraft(restored.draft); setErrors({}) }}><span className={s.typeIcon}><img src={card.icon} alt="" /></span><span><strong>{names[card.id]}</strong><small>{card.description}</small></span><span className={s.selection}>{draft.eventType === card.id ? <img src={checkIcon} alt="" /> : null}</span></button>)}</div><Button className={s.cta} fullWidth disabled={!draft.eventType || disabled} onClick={next}>Продолжить</Button></> : null}
      {step === 'question' ? <section className={`${s.card} ${s.questionCard}`}>{field('question', 'Вопрос события')}{field('outcomeA', 'Исход 1')}{field('outcomeB', 'Исход 2')}{kind === 'public' ? <label className={s.category}>Категория<span className={s.selectWrap}><select value={draft.category} onChange={e => change('category', e.target.value as EventDraft['category'])} disabled={submitting}>{Object.entries(categoryNames).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select><img src={chevronIcon} alt="" /></span></label> : null}</section> : null}
      {step === 'conditions' ? <>{kind === 'private' ? <section className={s.card}>{field('rules', 'Правила пари')}</section> : null}{criteria}{kind === 'private' ? <section className={s.card}>{field('proof', 'Материалы для проверки · необязательно', false, true)}<p className={s.note}>Результат определяет создатель по условиям пари, когда примет решение.</p></section> : sources}{date('closeAt', 'Дата и время начала')}{kind === 'guarantor' ? date('endsAt', 'Предполагаемое завершение') : null}</> : null}
      {step === 'review' ? <>{review('Тип события', 'type', <p>{names[kind]}</p>)}{review('Вопрос и исходы', 'question', <><strong>{draft.question}</strong><p>Исход 1 · {draft.outcomeA}<br />Исход 2 · {draft.outcomeB}</p></>)}{kind === 'public' ? review('Категория', 'question', <p>{categoryNames[draft.category]}</p>) : null}{review('Условия события', 'conditions', <>{kind === 'private' ? <p>{draft.rules}</p> : null}<h3>Исход 1 · {draft.outcomeA}</h3><p>{draft.criterionA}</p><h3>Исход 2 · {draft.outcomeB}</h3><p>{draft.criterionB}</p>{kind !== 'private' ? <><hr /><p className={s.note}>Основной источник</p><p>{draft.sourceName}<br />{draft.sourceUrl}</p>{draft.backupUrl ? <p>{draft.backupName}<br />{draft.backupUrl}</p> : null}</> : draft.proof ? <p>{draft.proof}</p> : null}<p className={s.note}>Начало события</p><p>{formatDate(draft.closeAt)}<br />Время указано в UTC</p>{kind === 'guarantor' ? <><p className={s.note}>Предполагаемое завершение</p><p>{formatDate(draft.endsAt)}<br />Время указано в UTC</p></> : null}</>)}</> : null}
      {step === 'guarantor' ? profile ? <GuarantorDetails guarantor={profile} onBack={() => setProfileId(null)} onChoose={() => { change('guarantorId', profile.user_id); setProfileId(null) }} /> : <><p className={s.note}>Изучите профиль, затем отправьте приглашение. Условия и вознаграждение согласуются после ответа гаранта.</p>{guarantorsLoading ? <p role="status">Загружаем гарантов…</p> : guarantorsError ? <section className={s.card}><p role="alert">Не удалось загрузить гарантов.</p><Button onClick={onRetryGuarantors}>Повторить</Button></section> : !guarantors.length ? <p className={s.note}>Гарантов пока нет. Черновик сохранён.</p> : guarantors.map(g => <section key={g.user_id} className={`${s.card} ${g.user_id === draft.guarantorId ? s.selected : ''}`}><div className={s.cardHeading}><button className={s.chooseGuarantor} type="button" disabled={!g.available || submitting} onClick={() => change('guarantorId', g.user_id)}><strong>{g.name}</strong><span>{g.available ? 'Принимает приглашения' : 'Сейчас недоступен'}</span></button><button type="button" className={s.link} onClick={() => setProfileId(g.user_id)}>Профиль →</button></div><p>{g.topics}</p><p className={s.note}>{g.rating == null ? 'Без оценок' : `${g.rating} из 5`} · {g.completed} проверок</p></section>)}{errors.guarantorId ? <p className={s.error} role="alert">{errors.guarantorId}</p> : null}</> : null}
    </main>
    {step === 'type' ? <BottomNavigation active="create" onChange={onNavChange} /> : !profile ? <footer className={s.footer}><Button className={s.cta} fullWidth onClick={next} loading={submitting} disabled={disabled || (step === 'guarantor' && (!selected?.available || guarantorsLoading || guarantorsError))}>{cta}</Button></footer> : null}
    <dialog ref={menu} className={s.menu} aria-label="Меню BetTON" onClick={e => { if (e.target === e.currentTarget) menu.current?.close() }}><nav><div className={s.menuHeading}><strong>Bet<span>TON</span></strong><button type="button" aria-label="Закрыть меню" onClick={() => menu.current?.close()}>×</button></div>{[['Главная', () => onNavChange?.('markets')], ['Мои ставки', () => onNavChange?.('portfolio')], ['Мои события', actions.onOpenMyEvents], ['Профиль', actions.onOpenProfile], ['Гарант', actions.onOpenGuarantors], ['История', actions.onOpenHistory], ['Настройки', actions.onOpenSettings], ['Помощь', actions.onOpenHelp]].map(([label, action]) => <button type="button" key={String(label)} onClick={() => { menu.current?.close(); if (typeof action === 'function') action() }}>{String(label)}</button>)}</nav></dialog>
    <dialog ref={invitation} className={s.invitation} aria-label="Пригласить гаранта?" onCancel={e => { if (submitting) e.preventDefault(); else setInviteConfirm(false) }} onClick={e => { if (!submitting && e.target === e.currentTarget) setInviteConfirm(false) }}><section><div className={s.inviteHeading}><h2>Пригласить гаранта?</h2><button type="button" aria-label="Закрыть" disabled={submitting} onClick={() => setInviteConfirm(false)}>×</button></div>{selected ? <><strong>{selected.name}</strong><p className={s.note}>{selected.rating == null ? 'Без оценок' : `★ ${selected.rating.toFixed(1)}`} · {selected.completed} проверок</p><p>Тариф можно обсудить при согласовании условий.</p><p className={s.note}>Приём ставок откроется после подтверждения одной редакции создателем и гарантом.</p></> : null}{errorMessage ? <p className={s.error} role="alert">{errorMessage}</p> : null}<Button fullWidth className={s.cta} loading={submitting} disabled={!selected?.available || disabled} onClick={() => onSubmit(draft)}>Отправить приглашение</Button></section></dialog>
  </div>
}

function formatDate(value: string) {
  if (!value) return 'Выберите дату и время';
  const date = new Date(value + 'Z');
  if (!Number.isFinite(date.getTime())) return 'Выберите дату и время';
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date).replace(' г.', '') + ' · ' + value.slice(11, 16);
}

function DateControl({ name, label, value, onChange, disabled, invalid }: { name: string; label: string; value: string; onChange: (value: string) => void; disabled: boolean; invalid: boolean }) {
  return <label className={s.date}><img alt="" src={calendarIcon} /><span>{formatDate(value)}</span><input id={'v1-event-' + name} className={s.nativeDate} aria-label={label} type="datetime-local" value={value} onChange={e => onChange(e.target.value)} disabled={disabled} required aria-invalid={invalid} /></label>
}
