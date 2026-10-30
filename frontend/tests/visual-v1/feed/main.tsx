import { createRoot } from 'react-dom/client'
import { useState } from 'react'
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
function Qa() {
 const [view,setView]=useState<FeedViewState>({query:'',sort:'popular',category:'all',status:'open'})
 const [filters,setFilters]=useState(false),[action,setAction]=useState('')
 const params=new URLSearchParams(location.search),isLegacy=params.get('ui')==='legacy'
 const long=params.get('long')==='1'
 const markets=long?[{...base,question:'Очень длинный вопрос о том, какой из двух возможных исходов наступит по итогам международного соревнования с дополнительными условиями и уточнениями?',outcomeA:{...base.outcomeA,label:'Первый очень длинный вариант исхода'},outcomeB:{...base.outcomeB,label:'Второй очень длинный вариант исхода'},activeOffersNano:'123456789123456789123456789'}]:fixtures
 return <I18nProvider><VisualV1Provider enabled={!isLegacy}><VisualV1ActionsProvider value={{onOpenNotifications:()=>setAction('notifications'),onOpenProfile:()=>setAction('profile'),onOpenMyEvents:()=>setAction('events')}}><NotificationBadgeContext.Provider value={1}><div className={isLegacy?'':v1.root} style={{height:'100dvh',position:'relative'}} data-qa-view={JSON.stringify(view)} data-qa-action={action}><MarketsScreen markets={markets} selectedOutcomes={{'1':'a','2':'a','3':'b','4':'b'}} query={view.query} category={view.category} sort={view.sort} filtersOpen={filters} onFiltersClick={()=>setFilters(true)} onCategoryChange={category=>setView(old=>({...old,category}))} onSortChange={sort=>setView(old=>({...old,sort}))} onQueryChange={query=>setView(old=>({...old,query}))} onSelectMarket={market=>setAction('market:'+market.id)} onSelectOutcome={(market,side)=>setAction('trade:'+market.id+':'+side)} onNavChange={id=>setAction('nav:'+id)} onProfileClick={()=>setAction('profile')} activeOffersNano="100000000000"/>{!isLegacy?<FeedFiltersV1 open={filters} category={view.category} status={view.status} offers={view.offers} closeBefore={view.closeBefore} onClose={()=>setFilters(false)} onApply={(status,category,offers,closeBefore)=>setView(old=>({...old,status,category,offers,closeBefore}))}/>:null}</div></NotificationBadgeContext.Provider></VisualV1ActionsProvider></VisualV1Provider></I18nProvider>
}
createRoot(document.getElementById('root')!).render(<Qa/> )
