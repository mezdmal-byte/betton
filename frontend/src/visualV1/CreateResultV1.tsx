import { useState } from 'react'
import type { CreateMarketResultProps } from '../app/CreateMarketResult'
import { GuarantorPanel } from '../app/GuarantorPanel'
import { Button } from '../components/Button/Button'
import { copyShareLink } from '../api/share'
import sentIcon from '../assets/visual-v1/create/sent.svg'
import createdIcon from '../assets/visual-v1/create/created.svg'
import backIcon from '../assets/visual-v1/create/back.svg'
import s from './CreateResultV1.module.css'

export function CreateResultV1({ market, shareLink, onOpen, onBack, onToFeed, onNavChange }: CreateMarketResultProps) {
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const pending = market.status === 'pending'
  const privateEvent = market.visibility === 'unlisted'
  const waiting = privateEvent && market.status === 'closed'
  const open = market.status === 'open'
  const copy = async () => { const ok = await copyShareLink(shareLink); setCopied(ok); setCopyFailed(!ok) }

  if (waiting) return <div className={s.screen} data-figma-frame="819:59354"><header className={s.header}><button type="button" aria-label="Назад" onClick={onBack}><img src={backIcon} alt="" /></button><div><h1>Гарант</h1><p>Приглашение и согласование</p></div></header><main className={s.body}><section className={s.card}><h2>{market.question}</h2><p className={s.note}>{market.outcomes.join(' / ')}</p></section><GuarantorPanel marketId={market.id} userId={market.creator_id} /></main><footer className={s.footer}><Button className={s.cta} fullWidth onClick={onOpen}>Открыть событие</Button></footer></div>

  return <div className={s.screen} data-figma-frame={sharing ? copied ? '819:59188' : '819:59165' : pending ? '819:58771' : '819:59151'}>
    {sharing ? <header className={s.header}><button type="button" aria-label="Назад" onClick={() => setSharing(false)}><img src={backIcon} alt="" /></button><div><h1>Пригласить участников</h1><p>Частное без гаранта</p></div></header> : null}
    <main className={sharing ? s.body : s.successScroll}>
      {sharing ? <><section className={s.card}><h2>{market.question}</h2><p className={s.note}>{market.outcomes.join(' / ')}</p></section><section className={s.card}><h2>Приглашение по ссылке</h2><p>Событие доступно тем, у кого есть ссылка.</p><p className={s.note}>Перед первой ставкой участники увидят правила и имя создателя.</p><Button fullWidth className={s.cta} disabled={!shareLink} onClick={() => { void copy() }}>Скопировать ссылку</Button>{copied ? <p className={s.copied} role="status">Ссылка скопирована</p> : null}{copyFailed ? <><p className={s.error} role="alert">Не удалось скопировать. Выделите ссылку и скопируйте вручную.</p><input aria-label="Ссылка на событие" className={s.linkInput} readOnly value={shareLink} onFocus={e => e.currentTarget.select()} /></> : null}</section></> : <section className={s.successContent}><span className={s.hero}><img src={pending ? sentIcon : createdIcon} alt="" /></span><h1>{pending ? <>Заявка отправлена<br />на модерацию</> : privateEvent && open ? <>Частное событие<br />создано</> : open ? 'Событие создано' : market.status === 'rejected' ? 'Событие отклонено' : 'Состояние события'}</h1><p>{pending ? 'Событие появится в общей ленте после одобрения модератором.' : privateEvent && open ? 'Теперь можно пригласить участников.' : market.rejection_reason || (open ? 'Событие доступно участникам.' : 'Откройте событие, чтобы посмотреть текущий статус.')}</p><button className={s.link} type="button" onClick={pending ? () => onNavChange?.('create') : onOpen}>{pending ? 'Создать ещё' : 'Перейти к событию'}</button></section>}
    </main>
    <footer className={s.footer}><Button fullWidth className={s.cta} onClick={sharing || pending || !privateEvent || !open ? onOpen : () => setSharing(true)}>{sharing ? 'Перейти к событию' : pending ? 'К моим событиям' : privateEvent && open ? 'Пригласить участников' : 'Открыть событие'}</Button>{!pending && !privateEvent && !open ? <button type="button" className={s.link} onClick={onToFeed}>К событиям</button> : null}</footer>
  </div>
}
