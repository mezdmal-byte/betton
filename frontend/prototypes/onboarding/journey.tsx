import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Check, ChevronRight, ShieldCheck, Users } from 'lucide-react'
import { syncTelegramBackButton } from '../../src/telegram/webapp'
import { type Copy, type Kind } from './copy'
import s from './onboarding.module.css'

export type Variant = 'premium'|'motion'|'education'
export function useJourney() {
  const [step,setStep]=useState(0), [detail,setDetail]=useState<Kind|null>(null), [done,setDone]=useState(false)
  const back=()=>{if(detail)setDetail(null);else if(done)setDone(false);else setStep(v=>Math.max(0,v-1))}
  useEffect(()=>syncTelegramBackButton(Boolean(detail||step||done),back),[detail,step,done])
  return {step,setStep,detail,setDetail,done,setDone,back}
}
export type JourneyState = ReturnType<typeof useJourney>
export function Chrome({c,state,children,variant}:{c:Copy;state:JourneyState;children:ReactNode;variant:Variant}) {
  const {step,detail,done}=state
  const screen=useRef<HTMLElement>(null)
  useLayoutEffect(()=>{
    const content=screen.current?.querySelector('main')??screen.current?.querySelector<HTMLElement>('[data-detail]')
    if(content)content.scrollTop=0
    const heading=screen.current?.querySelector('h1')
    if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}
  },[step,detail,done])
  return <article ref={screen} className={`${s.journey} ${s[variant]}`} data-direction={variant}>
    <header className={s.header}><strong>BetTON<span aria-hidden="true">.</span></strong><button onClick={()=>state.setDone(true)}>{c.skip}</button></header>
    {detail ? <section className={s.detail} data-detail><button className={s.back} onClick={state.back}><ArrowLeft size={18}/>{c.back}</button><ShieldCheck size={48} strokeWidth={1.5}/><h1 tabIndex={-1}>{c.details[detail][0]}</h1><p>{c.details[detail][1]}</p><button className={s.primary} onClick={state.back}>{c.close}<Check size={18}/></button></section>
      : done ? <section className={s.detail} data-detail><Check size={48}/><h1>{c.done}</h1><p>{c.doneNote}</p><button className={s.primary} onClick={()=>{state.setStep(0);state.setDone(false)}}>{c.again}<ArrowRight size={18}/></button></section>
      : <>{children}<footer className={s.footer}><nav aria-label="Introduction pages" className={s.progress}>{c.titles.map((_,i)=><button key={i} aria-label={`${i+1} / 5`} aria-current={i===step?'step':undefined} onClick={()=>state.setStep(i)}><span/></button>)}</nav><div className={s.actions}><button className={s.back} onClick={state.back} disabled={step===0}><ArrowLeft size={18}/>{c.back}</button><button className={s.primary} onClick={()=>step===4?state.setDone(true):state.setStep(step+1)}>{step===4?c.start:c.next}<ArrowRight size={18}/></button></div></footer></>}
  </article>
}

export function Example({c,state,variant}:{c:Copy;state:JourneyState;variant:Variant}) {
  const [played,setPlayed]=useState(false), [available,setAvailable]=useState(60), [kind,setKind]=useState<'limit'|'ioc'>('limit'), [profit,setProfit]=useState(100)
  useEffect(()=>setPlayed(false),[state.step])
  const exercise=variant==='education', motion=variant==='motion'
  const amount=played||exercise?available:0
  const execution=<div className={s.execution} aria-live="polite" data-execution><div><span>{c.filled}</span><strong>{amount} TON</strong></div><div><span>{kind==='ioc'?c.returned:c.remaining}</span><strong>{100-amount} TON</strong></div></div>
  if(state.step===2)return <div className={s.types}>{(['public','private','guarantor'] as const).map((key,i)=><button key={key} onClick={()=>state.setDetail(key)}><span className={s.typeNumber}>{i+1}</span><span><strong>{c.types[i]}</strong><small>{c.typeNotes[i]}</small></span><ChevronRight size={18}/></button>)}</div>
  if(state.step===3){const cents=profit;return <section className={s.feeExample}><div className={s.profit}><span>{c.profit}</span><strong>{profit} <small>TON</small></strong></div>{exercise?<label>{c.profit}<input aria-label={c.profit} type="range" min="20" max="200" step="20" value={profit} onChange={e=>setProfit(Number(e.target.value))}/></label>:null}<div className={s.feeLine}><span>{c.fee} · 1%</span><strong>{(cents/100).toFixed(2)} TON</strong></div><div className={s.splitBar}><span/><span/></div><dl className={s.distribution}><div><dt>{c.creator} · 75%</dt><dd>{(cents*.75/100).toFixed(2)} TON</dd></div><div><dt>{c.platform} · 25%</dt><dd>{(cents*.25/100).toFixed(2)} TON</dd></div></dl><p className={s.note}>{c.feeNote}</p></section>}
  if(state.step===4)return <section className={s.guarantee}><ShieldCheck className={s.shield} size={64} strokeWidth={1.2}/><ol>{c.steps.map((text,i)=><li key={text}><span className={played&&i===0?s.checked:''}>{played&&i===0?<Check size={14}/>:i+1}</span><p>{text}</p></li>)}</ol><button className={s.secondary} onClick={()=>setPlayed(!played)}>{played?c.agreed:exercise?c.agree:c.show}</button><p className={s.note}>{c.guaranteeNote}</p></section>
  return <section className={`${s.marketExample} ${played?s.executed:''}`}>
    <div className={s.marketTitle}><Users size={20}/><h2>{c.question}</h2></div>
    {exercise?execution:null}
    <div className={s.offers} data-motion={motion}><div className={s.offerA}><span>{c.offer}</span><strong>{c.yes}</strong><small>{c.stake}</small></div><div className={s.cross} aria-hidden="true"><ArrowRight size={22}/></div><div className={s.offerB}><span>{c.opposing}</span><strong>{c.no}</strong><small>{available} TON · 2,00×</small></div></div>
    {exercise?<><label className={s.liquidity}>{c.liquidity}<strong>{available} TON</strong><input type="range" aria-label={c.liquidity} value={available} min="0" max="100" step="10" onChange={e=>setAvailable(Number(e.target.value))}/></label><div className={s.orderKind}><button aria-pressed={kind==='limit'} onClick={()=>setKind('limit')}>{c.limit}</button><button aria-pressed={kind==='ioc'} onClick={()=>setKind('ioc')}>{c.ioc}</button></div></>:null}
    {!exercise?execution:null}
    <p className={s.note}>{kind==='limit'?c.waiting:c.returned}. {c.matchNote}</p>
    {!exercise?<button className={s.secondary} onClick={()=>setPlayed(!played)}>{played?c.replay:c.match}<ArrowRight size={17}/></button>:null}
  </section>
}
