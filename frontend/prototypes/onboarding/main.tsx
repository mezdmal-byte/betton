import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nProvider } from '../../src/i18n'
import { OnboardingScreen } from '../../src/screens/OnboardingScreen'
import { EventTypeInfo, type EventType } from '../../src/screens/EventTypeInfo'
import { copy, type Locale } from './copy'
import { PremiumMinimal } from './PremiumMinimal'
import { MotionExperience } from './MotionExperience'
import { InteractiveEducation } from './InteractiveEducation'
import '../../src/styles/tokens.css'
import '../../src/styles/reset.css'
import '../../src/styles/global.css'
import './picker.css'
import s from './onboarding.module.css'

const query=new URLSearchParams(location.search)
const names=['Minimal','Motion','Learn']
function Lab(){
  const [variant,setVariant]=useState(()=>{const value=Number(query.get('v'));return Number.isInteger(value)&&value>=1&&value<=3?value-1:0})
  const [replay,setReplay]=useState(0),[locale,setLocale]=useState<Locale>((['ru','en','zh'].includes(query.get('lang')||'')?query.get('lang'):'ru') as Locale)
  const [theme,setTheme]=useState(query.get('theme')==='dark'?'dark':'light'),[ready,setReady]=useState(false)
  const picker=useRef<HTMLElement>(null),highlight=useRef<HTMLSpanElement>(null)
  const c=copy[locale]
  useEffect(()=>{document.documentElement.setAttribute('data-theme',theme);document.documentElement.lang=locale;const url=new URL(location.href);url.searchParams.set('v',String(variant+1));url.searchParams.set('lang',locale);url.searchParams.set('theme',theme);history.replaceState(null,'',url)},[variant,locale,theme])
  useLayoutEffect(()=>{const move=()=>{const active=picker.current?.querySelector<HTMLElement>('[data-active]');if(active&&highlight.current){highlight.current.style.width=active.offsetWidth+'px';highlight.current.style.transform=`translateX(${active.offsetLeft}px)`}};move();window.addEventListener('resize',move);const frame=requestAnimationFrame(()=>requestAnimationFrame(()=>setReady(true)));return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',move)}},[variant,locale])
  useEffect(()=>{const key=(e:KeyboardEvent)=>{const target=e.target as HTMLElement;if(/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)||target.isContentEditable||e.metaKey||e.ctrlKey||e.altKey)return;const n=Number(e.key);if(n>=1&&n<=3)setVariant(n-1);else if(e.key==='ArrowRight'){e.preventDefault();setVariant(v=>(v+1)%3)}else if(e.key==='ArrowLeft'){e.preventDefault();setVariant(v=>(v+2)%3)}else if(e.key.toLowerCase()==='r')setReplay(v=>v+1)};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)},[])
  const Variant=[PremiumMinimal,MotionExperience,InteractiveEducation][variant]
  return <div className={s.lab}><div className={s.tools}><label>{c.language}<select aria-label="Language" value={locale} onChange={e=>setLocale(e.target.value as Locale)}><option value="ru">RU</option><option value="en">EN</option><option value="zh">中文</option></select></label><span>{c.demo}</span><label>{c.theme}<select aria-label="Theme" value={theme} onChange={e=>setTheme(e.target.value)}><option value="light">Light</option><option value="dark">Dark</option></select></label></div><Variant key={`${variant}-${replay}-${locale}`} c={c}/>
    <nav className="proto-picker" aria-label="Prototype variants" data-position="top" data-ready={ready?'':undefined} ref={picker}><span className="proto-picker-highlight" aria-hidden="true" ref={highlight}/>{names.map((name,i)=><button key={name} className="proto-picker-item" data-active={i===variant?'':undefined} aria-current={i===variant?'true':undefined} onClick={()=>setVariant(i)}>{name}</button>)}<span className="proto-picker-divider" aria-hidden="true"/><button className="proto-picker-item proto-picker-replay" aria-label="Replay animation (R)" onClick={()=>setReplay(v=>v+1)}>↻</button></nav>
  </div>
}
const baseline=query.has('baseline'),kind=query.get('kind') as EventType|null
createRoot(document.getElementById('root')!).render(baseline?<I18nProvider><div style={{maxWidth:430,height:'100%',margin:'auto'}}>{kind?<EventTypeInfo kind={kind} onClose={()=>{}}/>:<OnboardingScreen initialStep={Number(query.get('step')||0)}/>}</div></I18nProvider>:<Lab/>)
