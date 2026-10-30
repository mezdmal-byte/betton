import { Paperclip, Reply, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ChatScreenProps } from '../screens/ChatScreen'
import { Button } from '../components/Button/Button'
import backIcon from '../assets/visual-v1/event/499a5.svg'
import shareIcon from '../assets/visual-v1/event/2106e.svg'
import starIcon from '../assets/visual-v1/event/64d77.svg'
import sendIcon from '../assets/visual-v1/chat/send.svg'
import s from './ChatV1.module.css'

export function ChatV1({title,subtitle,messages,currentUserId,isAdmin=false,loading=false,error=false,sending=false,lobby=false,hasMore=false,attachableMarkets=[],showInternalBack=true,onBack,onLoadOlder,onRetry,onSend,onSendConfirmed,onDelete,onOpenMarket,marketId,onShare,shareValue,sendError,deleteError,deletingMessageId}:ChatScreenProps){
 const [draft,setDraft]=useState(''),[replyToId,setReply]=useState<number>(),[attachOpen,setAttachOpen]=useState(false),[attachedId,setAttachedId]=useState<number>(),[actionsId,setActionsId]=useState<number>(),[focused,setFocused]=useState(false),[shareStatus,setShareStatus]=useState<'copied'|'failed'|null>(null),[favorite,setFavorite]=useState(()=>isFavorite(marketId))
 const scroll=useRef<HTMLElement>(null),screen=useRef<HTMLDivElement>(null),input=useRef<HTMLTextAreaElement>(null),initialized=useRef(false),nearBottom=useRef(true),sendingRef=useRef(false),mounted=useRef(true)
 const latestId=messages.at(-1)?.id??0,reply=messages.find(m=>m.id===replyToId),attachment=attachableMarkets.find(m=>m.id===attachedId)
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[])
 useEffect(()=>{const el=scroll.current;if(!el)return;if(!initialized.current||nearBottom.current){el.scrollTop=el.scrollHeight;initialized.current=true}},[latestId])
 useEffect(()=>{const viewport=window.visualViewport;const update=()=>screen.current?.style.setProperty('--chat-viewport-height',`${viewport?.height??window.innerHeight}px`);update();viewport?.addEventListener('resize',update);return()=>viewport?.removeEventListener('resize',update)},[])
 useEffect(()=>{setFavorite(isFavorite(marketId));setShareStatus(null)},[marketId])
 useEffect(()=>{if(!attachOpen&&actionsId==null)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape'){setAttachOpen(false);setActionsId(undefined);input.current?.focus()}};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[attachOpen,actionsId])
 const busy=sending||sendingRef.current
 async function submit(){const text=draft.trim();if(!text||busy||!currentUserId)return;sendingRef.current=true;try{const body={text,replyToId,attachedMarketId:attachedId};if(onSendConfirmed)await onSendConfirmed(body);else onSend(body);if(mounted.current){setDraft('');setReply(undefined);setAttachedId(undefined);setAttachOpen(false);nearBottom.current=true}}catch{/* The connected mutation supplies its error; keep the draft and context. */}finally{sendingRef.current=false}}
 const toggleFavorite=()=>{if(marketId==null)return;try{const old=readFavorites(),next=old.includes(String(marketId))?old.filter(v=>v!==String(marketId)):[...old,String(marketId)];localStorage.setItem('betton.favorites.v1',JSON.stringify(next));setFavorite(next.includes(String(marketId)))}catch{/* Local preference may be unavailable. */}}
 return <div ref={screen} className={s.screen} data-figma-frame={lobby?undefined:focused?'880:19586':'880:19116'}>
  <header className={s.header}>{showInternalBack?<button type="button" className={s.back} aria-label="Назад" onClick={onBack}><img src={backIcon} alt=""/></button>:null}<h1>{title}</h1>{onShare?<button type="button" className={s.headerAction} aria-label="Поделиться событием" onClick={()=>{void onShare().then(ok=>setShareStatus(ok?'copied':'failed'))}}><img src={shareIcon} alt=""/></button>:null}{marketId!=null?<button type="button" className={s.headerAction} aria-label={favorite?'Удалить из избранного':'В избранное'} aria-pressed={favorite} onClick={toggleFavorite}><img src={starIcon} alt=""/></button>:null}</header>
  <main className={s.scroll} ref={scroll} onScroll={event=>{const el=event.currentTarget;nearBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<90}}>
   {shareStatus==='copied'?<p className={s.note} role="status">Ссылка скопирована</p>:shareStatus==='failed'?<div className={s.failure} role="alert">Не удалось скопировать ссылку.{shareValue?<input aria-label="Ссылка на событие" value={shareValue} readOnly onFocus={e=>e.currentTarget.select()}/>:null}</div>:null}
   {lobby?<p className={s.note}>Показываем последние 100 сообщений. Уведомляем только об ответах вам.</p>:hasMore?<button type="button" className={s.loadMore} onClick={onLoadOlder}>Показать более ранние сообщения</button>:null}
   <section className={s.card} aria-label={lobby?'Сообщения лобби':'Сообщения события'}>{subtitle?<h2>{subtitle}</h2>:null}
    {loading&&!messages.length?<p className={s.state} role="status">Загружаем сообщения…</p>:error&&!messages.length?<div className={s.state} role="alert"><p>Не удалось загрузить сообщения.</p><Button variant="secondary" onClick={onRetry}>Повторить</Button></div>:!loading&&!error&&!messages.length?<p className={s.state}>Сообщений пока нет. Начните обсуждение первым.</p>:null}
    {messages.map(message=>{const own=message.author.id===currentUserId,canDelete=!message.deleted&&(own||isAdmin),active=actionsId===message.id;return <article className={s.message} key={message.id}>
     <span className={`${s.avatar} ${s['avatar'+((Math.abs(message.author.id-1))%3)]}`}>{message.author.photo_url?<img src={message.author.photo_url} alt=""/>:initials(message.author.display_name,own)}</span>
     <div className={s.messageCopy}><div className={s.meta}><strong>{own?'Вы':message.author.display_name}</strong>{message.author.is_admin?<small>администратор</small>:null}<time dateTime={message.created_at??undefined}>· {messageTime(message.created_at)}</time></div>
      {message.reply_to?<div className={s.reply}><b>{message.reply_to.author_name}</b><span>{message.reply_to.deleted?'Сообщение удалено':message.reply_to.text}</span></div>:null}
      <button type="button" className={`${s.messageText} ${message.deleted?s.deleted:''}`} disabled={Boolean(message.deleted)} aria-expanded={active} aria-label={`Действия сообщения ${message.author.display_name}: ${message.text}`} onClick={()=>setActionsId(active?undefined:message.id)}>{message.text}</button>
      {message.attached_market?<button type="button" className={s.attachedMarket} onClick={()=>onOpenMarket?.(message.attached_market!.id)}><b>{message.attached_market.question}</b><span>Открыть событие →</span></button>:null}
      {active&&!message.deleted?<div className={s.messageActions}><button type="button" onClick={()=>{setReply(message.id);setActionsId(undefined);input.current?.focus()}}><Reply size={13} aria-hidden="true"/>Ответить</button>{canDelete?<button type="button" disabled={deletingMessageId===message.id} onClick={()=>onDelete(message.id)}><Trash2 size={13} aria-hidden="true"/>{deletingMessageId===message.id?'Удаляем…':'Удалить'}</button>:null}</div>:null}
     </div></article>})}
    {error&&messages.length?<button className={s.loadMore} type="button" onClick={onRetry}>Не удалось обновить сообщения. Повторить</button>:null}
   </section>{deleteError?<p className={s.failure} role="alert">{deleteError}</p>:null}
  </main>
  <footer className={s.footer}>
   {reply?<div className={s.composeContext}><span><b>Ответ:</b> {reply.author.display_name} · {reply.text}</span><button type="button" aria-label="Отменить ответ" onClick={()=>setReply(undefined)}><X size={16}/></button></div>:null}
   {attachment?<div className={s.composeContext}><span><b>Событие:</b> {attachment.question}</span><button type="button" aria-label="Убрать прикреплённое событие" onClick={()=>setAttachedId(undefined)}><X size={16}/></button></div>:null}
   {attachOpen&&lobby?<section className={s.attachPicker} aria-label="Прикрепить событие"><strong>Прикрепить событие</strong>{attachableMarkets.length?attachableMarkets.map(m=><button key={m.id} type="button" onClick={()=>{setAttachedId(m.id);setAttachOpen(false);input.current?.focus()}}>{m.question}</button>):<p>Нет доступных событий для прикрепления.</p>}<button type="button" onClick={()=>setAttachOpen(false)}>Закрыть</button></section>:null}
   {sendError?<p className={s.failure} role="alert">{sendError}</p>:null}{!currentUserId?<p className={s.note}>Для отправки сообщений откройте BetTON через Telegram.</p>:null}
   <div className={s.composer}>{lobby?<button type="button" className={s.attach} aria-label="Прикрепить событие" aria-expanded={attachOpen} onClick={()=>setAttachOpen(v=>!v)}><Paperclip size={18}/></button>:null}<div className={s.composeRow} onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!(e.relatedTarget instanceof Node)||!e.currentTarget.contains(e.relatedTarget))setFocused(false)}}><textarea ref={input} aria-label="Написать сообщение" placeholder="Написать сообщение…" rows={1} maxLength={1000} value={draft} disabled={sending||!currentUserId} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void submit()}}}/><button type="button" className={s.send} aria-label="Отправить" aria-busy={sending||undefined} disabled={!draft.trim()||sending||!currentUserId} onClick={()=>void submit()}><img src={sendIcon} alt=""/></button></div></div>
   {!lobby&&marketId!=null&&!focused?<div className={s.ticket}><span className={s.handle}/><div><strong>Выбрать ставку</strong><p>Исход и условия — в событии.</p></div><Button className={s.choose} disabled={!onOpenMarket} onClick={()=>onOpenMarket?.(marketId)}>Выбрать</Button></div>:null}
  </footer>
 </div>
}
function initials(name:string,own:boolean){if(own)return 'ВЫ';const parts=name.trim().split(/\s+|_/).filter(Boolean);return (parts.length>1?parts.slice(0,2).map(v=>v[0]).join(''):name.slice(0,2)).toLocaleUpperCase()}
function messageTime(value?:string|null){if(!value)return '';const date=new Date(value);if(!Number.isFinite(date.getTime()))return '';return new Intl.DateTimeFormat('ru-RU',date.toDateString()===new Date().toDateString()?{hour:'2-digit',minute:'2-digit'}:{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(date)}
function readFavorites():string[]{try{const value:unknown=JSON.parse(localStorage.getItem('betton.favorites.v1')||'[]');return Array.isArray(value)?value.filter((v):v is string=>typeof v==='string'):[]}catch{return []}}
function isFavorite(id?:number){return id!=null&&readFavorites().includes(String(id))}
