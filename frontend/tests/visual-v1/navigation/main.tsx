import { createRoot } from 'react-dom/client'
import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import './navigation.css'
import './picker.css'
import { I18nProvider } from '../../../src/i18n'
import { VisualV1ActionsProvider, VisualV1Provider } from '../../../src/visualV1/VisualV1Context'
import { NotificationBadgeContext } from '../../../src/components/BottomNavigation/NotificationBadgeContext'
import { MarketsScreen } from '../../../src/screens/MarketsScreen'
import { FeedFiltersV1 } from '../../../src/visualV1/FeedFiltersV1'
import type { FeedViewState } from '../../../src/app/ConnectedMarketsScreen'
import type { MarketFixture } from '../../../src/types/market'
import v1 from '../../../src/visualV1/VisualV1.module.css'
import '../../../src/styles/tokens.css'
import '../../../src/styles/reset.css'
import '../../../src/styles/global.css'

// Explicit QA fixtures reproduce approved frame 819:45192; never used by ConnectedApp.
const base: MarketFixture = { id:'1',category:'Dota 2 · ESL One · Плей-офф',categoryKey:'esports',timeLeft:'',question:'Team Liquid — Team Spirit',creator:{handle:'creator',displayName:'Автор',initials:'А'},volumeTon:48620,activeOffersNano:'12435000000000',offersCount:28,participants:12,status:'open',outcomeA:{label:'Team Liquid',odds:1.74,liquidityTon:100},outcomeB:{label:'Team Spirit',odds:2.10,liquidityTon:100},description:'',resolution:'',closeLabel:'Сегодня, 23:00' }
const fixtures: MarketFixture[] = [base,{...base,id:'2',category:'Футбол · Лига чемпионов УЕФА',categoryKey:'sport',question:'Реал Мадрид — Бавария',closeLabel:'Завтра, 22:00',activeOffersNano:'9842000000000',offersCount:36,volumeTon:31266,outcomeA:{...base.outcomeA,label:'Реал Мадрид',odds:1.95},outcomeB:{...base.outcomeB,label:'Бавария',odds:1.87}},{...base,id:'3',category:'CS2 · BLAST Premier · Групповой этап',question:'NAVI — G2 Esports',closeLabel:'Сегодня, 20:30',activeOffersNano:'7618000000000',offersCount:22,volumeTon:26145,outcomeA:{...base.outcomeA,label:'NAVI',odds:2.05},outcomeB:{...base.outcomeB,label:'G2 Esports',odds:1.68}},{...base,id:'4',category:'Теннис · ATP',question:'Новак Джокович — Карлос Алькарас',outcomeA:{...base.outcomeA,label:'Новак Джокович',odds:2.14},outcomeB:{...base.outcomeB,label:'Карлос Алькарас',odds:1.62}}]
fixtures.push(...fixtures.map((market,i)=>({...market,id:String(i+5),question:market.question+' · тестовый пример '+(i+5)})))
function Qa() {
 const [view,setView]=useState<FeedViewState>({query:'',sort:'popular',category:'all',status:'open'})
 const [filters,setFilters]=useState(false),[action,setAction]=useState('')
 const params=new URLSearchParams(location.search),isLegacy=params.get('ui')==='legacy'
 const long=params.get('long')==='1'
 const markets=long?[{...base,question:'Очень длинный вопрос о том, какой из двух возможных исходов наступит по итогам международного соревнования с дополнительными условиями и уточнениями?',outcomeA:{...base.outcomeA,label:'Первый очень длинный вариант исхода'},outcomeB:{...base.outcomeB,label:'Второй очень длинный вариант исхода'},activeOffersNano:'123456789123456789123456789'}]:fixtures
 return <I18nProvider><VisualV1Provider enabled={!isLegacy}><VisualV1ActionsProvider value={{onOpenNotifications:()=>setAction('notifications'),onOpenProfile:()=>setAction('profile'),onOpenMyEvents:()=>setAction('events')}}><NotificationBadgeContext.Provider value={1}><div className={isLegacy?'':v1.root} style={{height:'100%',position:'relative'}} data-visual="v1" data-qa-view={JSON.stringify(view)} data-qa-action={action}><MarketsScreen markets={markets} selectedOutcomes={{'1':'a','2':'a','3':'b','4':'b'}} query={view.query} category={view.category} sort={view.sort} filtersOpen={filters} onFiltersClick={()=>setFilters(true)} onCategoryChange={category=>setView(old=>({...old,category}))} onSortChange={sort=>setView(old=>({...old,sort}))} onQueryChange={query=>setView(old=>({...old,query}))} onSelectMarket={market=>setAction('market:'+market.id)} onSelectOutcome={(market,side)=>setAction('trade:'+market.id+':'+side)} onNavChange={id=>setAction('nav:'+id)} onProfileClick={()=>setAction('profile')} activeOffersNano="100000000000"/>{!isLegacy?<FeedFiltersV1 open={filters} category={view.category} status={view.status} offers={view.offers} closeBefore={view.closeBefore} onClose={()=>setFilters(false)} onApply={(status,category,offers,closeBefore)=>setView(old=>({...old,status,category,offers,closeBefore}))}/>:null}</div></NotificationBadgeContext.Provider></VisualV1ActionsProvider></VisualV1Provider></I18nProvider>
}

const names=['Закреплённая','Шапка уходит','Фокус на ленте']
function Variant({variant}:{variant:number}){
 const ref=useRef<HTMLDivElement>(null)
 useEffect(()=>{
  const root=ref.current!,main=root.querySelector('main')!
  let previous=0
  const scroll=()=>{const top=main.scrollTop;root.style.setProperty('--header-offset',`${Math.min(52,top)}px`);if(Math.abs(top-previous)>10){root.dataset.navHidden=String(top>previous&&top>100);previous=top}}
  main.addEventListener('scroll',scroll,{passive:true});return()=>main.removeEventListener('scroll',scroll)
 },[])
 return <div className="prototype-frame" data-navigation-variant={variant+1} ref={ref}><Qa/></div>
}
function Prototype(){
 const [variant,setVariant]=useState(()=>(()=>{const n=Number(new URLSearchParams(location.search).get('v'));return [1,2,3].includes(n)?n-1:0})())
 const [replay,setReplay]=useState(0),picker=useRef<HTMLElement>(null),highlight=useRef<HTMLSpanElement>(null)
 const select=(i:number)=>{setVariant(i);setReplay(r=>r+1);const url=new URL(location.href);url.searchParams.set('v',String(i+1));history.replaceState(null,'',url)}
 useLayoutEffect(()=>{const update=()=>{const el=picker.current!.querySelector<HTMLElement>('[data-active]')!;highlight.current!.style.width=el.offsetWidth+'px';highlight.current!.style.transform=`translateX(${el.offsetLeft}px)`};update();window.addEventListener('resize',update);requestAnimationFrame(()=>requestAnimationFrame(()=>picker.current?.setAttribute('data-ready','')));return()=>window.removeEventListener('resize',update)},[variant])
 useEffect(()=>{const key=(e:KeyboardEvent)=>{const t=e.target as HTMLElement;if(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable||e.ctrlKey||e.altKey||e.metaKey||e.shiftKey)return;const n=Number(e.key);if(n>=1&&n<=3)select(n-1);else if(e.key==='ArrowRight')select((variant+1)%3);else if(e.key==='ArrowLeft')select((variant+2)%3);else if(e.key.toLowerCase()==='r')setReplay(r=>r+1)};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[variant])
 return <><nav className="proto-picker" aria-label="Prototype variants" data-position="top" ref={picker}><span className="proto-picker-highlight" aria-hidden="true" ref={highlight}/>{names.map((name,i)=><button className="proto-picker-item" key={name} data-active={variant===i?'':undefined} aria-current={variant===i?'true':undefined} onClick={()=>select(i)}>{name}</button>)}<span className="proto-picker-divider" aria-hidden="true"/><button className="proto-picker-item proto-picker-replay" aria-label="Replay animation (R)" onClick={()=>setReplay(r=>r+1)}>↻</button></nav><Variant key={`${variant}:${replay}`} variant={variant}/></>
}
document.documentElement.dataset.bettonCompact='true'
document.documentElement.dataset.bettonHost='true'
createRoot(document.getElementById('root')!).render(<Prototype/>)
