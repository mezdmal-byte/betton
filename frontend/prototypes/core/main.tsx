import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Exchange } from './Exchange'
import { Folio } from './Folio'
import { Pocket } from './Pocket'
import '../onboarding/picker.css'
import s from './core.module.css'
const variants=[Exchange,Folio,Pocket],names=['Exchange','Folio','Pocket']
function Lab(){
 const params=new URLSearchParams(location.search), initial=Number(params.get('v'))
 const [variant,setVariant]=useState(initial>=1&&initial<=3?initial-1:0),[replay,setReplay]=useState(0),[ready,setReady]=useState(false),[dark,setDark]=useState(params.get('theme')==='dark')
 const picker=useRef<HTMLElement>(null),highlight=useRef<HTMLSpanElement>(null)
 useEffect(()=>{const u=new URL(location.href);u.searchParams.set('v',String(variant+1));u.searchParams.set('theme',dark?'dark':'light');history.replaceState(null,'',u);document.documentElement.dataset.theme=dark?'dark':'light'},[variant,dark])
 useLayoutEffect(()=>{const move=()=>{const active=picker.current?.querySelector<HTMLElement>('[data-active]');if(active&&highlight.current){highlight.current.style.width=active.offsetWidth+'px';highlight.current.style.transform=`translateX(${active.offsetLeft}px)`}};move();window.addEventListener('resize',move);const id=requestAnimationFrame(()=>requestAnimationFrame(()=>setReady(true)));return()=>{cancelAnimationFrame(id);window.removeEventListener('resize',move)}},[variant])
 useEffect(()=>{const key=(e:KeyboardEvent)=>{const t=e.target as HTMLElement;if(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable||e.metaKey||e.ctrlKey||e.altKey)return;const n=Number(e.key);if(n>=1&&n<=3)setVariant(n-1);else if(e.key==='ArrowRight'){e.preventDefault();setVariant(v=>(v+1)%3)}else if(e.key==='ArrowLeft'){e.preventDefault();setVariant(v=>(v+2)%3)}else if(e.key.toLowerCase()==='r')setReplay(v=>v+1)};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)},[])
 const Variant=variants[variant]
 return <div className={s.lab}><div className={s.labTools}><span>Синтетический React-прототип · без API</span><button onClick={()=>setDark(v=>!v)}>{dark?'Светлая':'Тёмная'}</button><a href="http://127.0.0.1:8890/sandbox/?actor=creator">Прежний UI</a></div><Variant key={`${variant}-${replay}`}/><nav className="proto-picker" aria-label="Prototype variants" data-position="top" data-ready={ready?'':undefined} ref={picker}><span className="proto-picker-highlight" aria-hidden="true" ref={highlight}/>{names.map((name,i)=><button key={name} className="proto-picker-item" data-active={variant===i?'':undefined} aria-current={variant===i?'true':undefined} onClick={()=>setVariant(i)}>{name}</button>)}<span className="proto-picker-divider" aria-hidden="true"/><button className="proto-picker-item proto-picker-replay" aria-label="Replay animation (R)" onClick={()=>setReplay(v=>v+1)}>↻</button></nav></div>
}
createRoot(document.getElementById('root')!).render(<Lab/> )
