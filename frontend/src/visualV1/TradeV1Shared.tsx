import { useEffect, useRef, useState, type ReactNode } from 'react'
import { EventV1, EventLogo } from './EventV1'
import type { MarketFixture, OutcomeSide } from '../types/market'
import { formatOdds } from '../lib/format'
import checkIcon from '../assets/visual-v1/event/4e28a.svg'
import s from './TradeV1.module.css'

export function TradeShellV1({ market, side, own=false, onClose, onOtherMode, children, footer, state=false, title, frame, backdrop=true }: { market:MarketFixture; side:OutcomeSide; own?:boolean; onClose?:()=>void; onOtherMode?:()=>void; children:ReactNode; footer:ReactNode; state?:boolean;title?:string;frame?:string;backdrop?:boolean }) {
 const dialog=useRef<HTMLElement>(null),closeRef=useRef(onClose)
 closeRef.current=onClose
 useEffect(()=>{const previous=document.activeElement;const node=dialog.current;node?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();closeRef.current?.()}if(e.key==='Tab'&&node){const elements=Array.from(node.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),[tabindex="0"]'));const first=elements[0],last=elements.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);if(previous instanceof HTMLElement)previous.focus()}},[])
 return <div className={s.root} data-figma-frame={frame??(own?'915:32644':'908:20248')}>{backdrop?<div className={s.background} aria-hidden="true" inert><EventV1 market={market} selectedSide={side} shareAvailable actionsDisabled/></div>:null}<button type="button" className={s.scrim} aria-label="Закрыть ставку" onClick={onClose}/><section ref={dialog} role="dialog" aria-modal="true" aria-label={own?'Свой коэффициент':'Быстрая ставка'} tabIndex={-1} className={s.sheet}>{title?<header className={s.confirmHeader}><h1>{title}</h1><button type="button" onClick={onClose}>Закрыть</button></header>:<><button type="button" className={s.handle} onClick={onClose} aria-label="Закрыть ставку"/><nav className={s.modes} aria-label="Способ ставки"><button type="button" aria-current={!own?'page':undefined} onClick={own?onOtherMode:undefined}>Быстрая ставка</button><button type="button" aria-current={own?'page':undefined} onClick={!own?onOtherMode:undefined}>Свой коэффициент</button></nav></>}<div className={`${s.body} ${own?s.ownBody:''} ${state?s.stateBody:''}`}>{children}</div>{footer}</section></div>
}
export function SelectedOutcomeV1({ market,side,odds,own=false,onSelect }: {market:MarketFixture;side:OutcomeSide;odds?:number|null;own?:boolean;onSelect?:(side:OutcomeSide)=>void}){
 const [picker,setPicker]=useState(false),selected=side==='a'?market.outcomeA:market.outcomeB
 const content=<><EventLogo label={selected.label} size={32}/>{own?<span><b>{selected.label}</b><strong>{formatOdds(odds)}</strong></span>:<><b>{selected.label}</b><strong>{formatOdds(odds??selected.odds)}</strong></>}{own?<i className={s.check} aria-hidden="true"><img src={checkIcon} alt=""/></i>:null}</>
 return <><div className={`${s.selected} ${own?s.ownSelected:''}`}>{onSelect?<button type="button" aria-label={`Выбран исход ${selected.label}. Изменить исход`} onClick={()=>setPicker(true)}>{content}</button>:content}</div>{picker?<div className={s.outcomePicker} role="dialog" aria-modal="true" aria-label="Выберите исход"><h2>Выберите исход</h2>{(['a','b'] as const).map(id=>{const item=id==='a'?market.outcomeA:market.outcomeB;return <button type="button" key={id} aria-pressed={side===id} onClick={()=>{onSelect?.(id);setPicker(false)}}><EventLogo label={item.label} size={32}/>{item.label}<strong>{formatOdds(item.odds)}</strong></button>})}<button type="button" onClick={()=>setPicker(false)}>Назад</button></div>:null}</>
}
export function TradeRowV1({label,value}:{label:string;value:ReactNode}){return <div className={s.row}><span>{label}</span><strong>{value}</strong></div>}
export function NumericTradeFieldV1({label,value,onChange,disabled=false,odds=false}:{label:string;value:number;onChange?:(v:number)=>void;disabled?:boolean;odds?:boolean}){
 const [draft,setDraft]=useState(value>0?String(value):'')
 useEffect(()=>{setDraft(value>0?String(value):'')},[value])
 return <label className={s.field}><span>{label}</span><input inputMode="decimal" type="text" value={draft} disabled={disabled} aria-label={label} placeholder="0" onChange={e=>{const next=e.target.value.replace(',','.');if(!/^\d*(?:\.\d{0,9})?$/.test(next))return;setDraft(next);onChange?.(Number(next)||0)}} onBlur={()=>{if(odds&&value>0)setDraft(value.toFixed(2))}}/></label>
}
