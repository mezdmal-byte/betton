import { useState } from 'react'
import type { Guarantor } from '../api/guarantors'
import { Button } from '../components/Button/Button'
import { AccountAsset, AccountHeaderV1 } from './AccountV1Shared'
import s from './AccountV1.module.css'

export function GuarantorProfileV1({ guarantor: g, onBack, onCreate, onChoose, onHistory }: { guarantor: Guarantor; onBack: () => void; onCreate?: () => void; onChoose?: () => void; onHistory?: () => void }) {
  const [allReviews, setAllReviews] = useState(false)
  const reviews = allReviews ? g.reviews : g.reviews.slice(0, 1)
  return <div className={s.screen} data-figma-frame="819:61187"><AccountHeaderV1 onBack={onBack}/><main className={s.body}>
    <div className={s.guarantorIdentity}><span className={s.smallAvatar}><AccountAsset name="8e38d" size={28}/></span><div><h1>{g.name}</h1><p>{g.is_moderator ? 'Модератор BetTON · гарант' : g.high_reputation ? 'Гарант · высокая репутация' : 'Профиль гаранта'}</p></div></div>
    <section className={s.panel}><div className={s.caseHeading}><AccountAsset name="b804c" size={19}/><strong>{g.topics.trim() || 'Темы не указаны'}</strong></div><p className={s.profileBio}>{g.bio.trim() || 'Гарант пока не добавил описание о себе.'}</p><span className={`${s.status} ${g.available ? s.success : ''}`}>{g.status === 'rejected' ? 'Работа приостановлена' : g.available ? 'Принимает новые пари' : 'Сейчас недоступен'}</span></section>
    <section className={s.panel}><div className={s.caseHeading}><AccountAsset name="f1ff2" size={24}/><h2 className={s.ratingTitle}>{g.rating == null ? 'Без оценок' : `${g.rating.toFixed(1).replace('.', ',')} из 5`}</h2></div><p className={s.muted}>{g.review_count} отзывов участников</p><dl className={s.profileMetrics}>{[['Завершено пари', g.completed], ['Спорных пари', g.disputes], ['Просрочено', g.missed_deadlines ?? '—'], ['Вознаграждение', 'По условиям события']].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
    {onHistory ? <button className={s.textAction} type="button" onClick={onHistory}>События и история проверок →</button> : null}
    {reviews.length ? reviews.map((review, index) => <section className={s.panel} key={index}><div className={s.caseHeading}><AccountAsset name="2bc31" size={19}/><strong>{!allReviews ? 'Последний отзыв' : 'Отзыв участника'} · {review.rating} из 5</strong></div><p>{review.text.trim() ? `«${review.text.trim()}»` : 'Оценка без комментария.'}</p><p className={s.muted}>Участник завершённого пари</p></section>) : <section className={s.panel}><p className={s.muted}>Отзывов пока нет. Оценки оставляют участники завершённых пари.</p></section>}
    {g.reviews.length > 1 ? <button className={s.textAction} type="button" onClick={() => setAllReviews(!allReviews)}>{allReviews ? 'Свернуть отзывы' : `Все доступные отзывы · ${g.reviews.length}`} →</button> : null}
    {allReviews ? <section className={s.panel}><h2>Распределение оценок</h2><dl className={s.profileMetrics}>{[5,4,3,2,1].map(stars => <div key={stars}><dt>{stars} из 5</dt><dd>{g.rating_distribution[String(stars)] ?? 0}</dd></div>)}</dl>{g.review_count > g.reviews.length ? <p className={s.muted}>Показаны последние {g.reviews.length} отзывов из {g.review_count}.</p> : null}</section> : null}
  </main>{onChoose || onCreate ? <footer className={`${s.footer} ${s.guarantorFooter}`}><Button className={s.button} fullWidth disabled={!g.available} onClick={onChoose ?? onCreate}>{onChoose ? 'Выбрать гаранта' : 'Создать событие'}</Button></footer> : null}</div>
}
