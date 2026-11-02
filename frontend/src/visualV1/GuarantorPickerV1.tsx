import { useState } from 'react'
import { ShieldCheck, Star, Check, SlidersHorizontal } from 'lucide-react'
import type { Guarantor } from '../api/guarantors'
import s from './GuarantorPickerV1.module.css'

type Props={guarantors:Guarantor[];selectedId?:number|null;question:string;outcomes:string[];disabled?:boolean;onSelect:(id:number)=>void;onProfile:(id:number)=>void}
export function GuarantorPickerV1({guarantors,selectedId,question,outcomes,disabled,onSelect,onProfile}:Props){
 const [sort,setSort]=useState<'experience'|'rating'>('experience'),[availableOnly,setAvailableOnly]=useState(false)
 const rows=guarantors.filter(g=>!availableOnly||g.available).sort((a,b)=>Number(b.available)-Number(a.available)||(sort==='rating'?(b.rating??-1)-(a.rating??-1):b.completed-a.completed)||a.name.localeCompare(b.name,'ru'))
 return <div className={s.picker}>
  <section className={s.context}><small>Частное пари с гарантом</small><h2>{question}</h2><p>{outcomes.join(' / ')}</p></section>
  <p className={s.note}>Сравните опыт и описание. Тариф и правила согласуются после ответа гаранта.</p>
  <nav className={s.filters} aria-label="Выбор гаранта"><button type="button" aria-current={sort==='experience'?'page':undefined} onClick={()=>setSort('experience')}>По опыту</button><button type="button" aria-current={sort==='rating'?'page':undefined} onClick={()=>setSort('rating')}>По рейтингу</button><button type="button" aria-pressed={availableOnly} onClick={()=>setAvailableOnly(v=>!v)}><SlidersHorizontal size={14} aria-hidden="true"/>Доступные</button></nav>
  {rows.length?rows.map(g=><section className={`${s.card} ${selectedId===g.user_id?s.selected:''}`} key={g.user_id}>
   <div className={s.heading}><span className={s.avatar}><ShieldCheck size={24} aria-hidden="true"/></span><div><h3>{g.name}</h3><span className={g.available?s.available:s.offline}>{g.available?'Принимает приглашения':'Сейчас недоступен'}</span></div>{selectedId===g.user_id?<Check className={s.check} size={20} aria-label="Выбран"/>:null}</div>
   <p className={s.stats}><Star size={14} aria-hidden="true"/>{g.rating==null?'Без оценок':`${g.rating.toFixed(1)} из 5`}<span>· {g.completed} проверок</span></p>
   {g.topics?<p className={s.topics}>{g.topics}</p>:null}
   {g.bio?<div className={s.bio}><small>О себе</small><p>{g.bio}</p></div>:null}
   <div className={s.actions}><button type="button" onClick={()=>onProfile(g.user_id)}>Подробнее</button><button type="button" aria-pressed={selectedId===g.user_id} disabled={disabled||!g.available} onClick={()=>onSelect(g.user_id)}>{selectedId===g.user_id?'Выбран':'Выбрать'}</button></div>
  </section>):<p role="status" className={s.note}>По выбранному фильтру гарантов нет.</p>}
 </div>
}
