/** Isolated deterministic moderation QA. No production entry imports this file. */
import {createRoot} from 'react-dom/client'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {I18nProvider} from '../../../src/i18n'
import {VisualV1Provider} from '../../../src/visualV1/VisualV1Context'
import {ConnectedModerationScreen} from '../../../src/app/ConnectedModerationScreen'
import type {MarketOut} from '../../../src/api/types'
import type {EventTermsV3} from '../../../src/api/eventGovernanceV3'
import v1 from '../../../src/visualV1/VisualV1.module.css'
import '../../../src/styles/tokens.css'
import '../../../src/styles/reset.css'
import '../../../src/styles/global.css'
const params=new URLSearchParams(location.search)
const base:MarketOut={id:2048,question:'BTC будет выше $150 000 к концу 2026 года?',description:'',creator_id:7,category:'unique',outcomes:['Выше $150 000','$150 000 или ниже'],status:'pending',close_at:'2026-12-31T23:00:00Z',creator:{id:7,display_name:'northstar',telegram_username:'northstar'}}
let markets:MarketOut[]=[base,{...base,id:2049,question:'TON в топ-5?'},{...base,id:2050,question:'Запуск Mars?'}]
const original:EventTermsV3={event_type:'public',question:base.question,outcomes:[base.outcomes[0]!,base.outcomes[1]!],category:'unique',description:'',rules:'Цена BTC/USD на 31 декабря 2026, 23:59 UTC. Первый исход: строго выше $150 000. Второй: $150 000 или ниже.',criteria:['строго выше $150 000','$150 000 или ниже'],resolution_method:'Цена BTC/USD на 31 декабря 2026, 23:59 UTC.',unverifiable:'Отмена и возврат ставок по общим правилам платформы',primary_source:{name:'CoinMarketCap · Bitcoin',url:'https://coinmarketcap.com/currencies/bitcoin/'},backup_source:null,close_at:'2026-12-31T23:00:00Z',ends_at:null,timing_version:'start-v1',revision:1,creator_id:7,consent:true,moderator_edited:false,reward_payments_supported:true}
let terms={...original},revisions=[{id:1,revision:1,actor_id:7,kind:'created',snapshot:original,created_at:'2026-10-28T10:00:00Z'}]
const requests:unknown[]=[]
Object.assign(window,{__moderationQaRequests:requests})
const nativeFetch=window.fetch.bind(window)
window.fetch=async(input,init)=>{const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.origin),path=url.pathname,method=init?.method??'GET';if(!path.startsWith('/ux-v3/events/')&&!path.startsWith('/moderation/')&&!path.match(/^\/markets\/\d+\/(reject|approve)$/))return nativeFetch(input,init);const body=init?.body?JSON.parse(String(init.body)):null;if(method!=='GET')requests.push({path,method,body});let data:unknown={};let status=200;
 if(path==='/moderation/markets')data=markets;
 else if(path.endsWith('/terms'))data=terms;
 else if(path.endsWith('/revisions'))data=revisions;
 else if(method==='PUT'){if(body.expected_revision!==terms.revision){status=409;data={detail:'Редакция изменилась'}}else{terms={...terms,...body.event,revision:terms.revision+1,moderator_edited:true};revisions=[...revisions,{id:2,revision:terms.revision,actor_id:1,kind:'moderation_edit',snapshot:terms,created_at:'2026-10-29T10:00:00Z'}];data=terms}}
 else if(path.endsWith('/moderation/publish')&&params.get('conflict')){status=409;data={detail:'Редакция изменилась. Обновите заявку.'}}
 else if(path.endsWith('/moderation/publish')&&body.expected_revision!==terms.revision){status=409;data={detail:'Редакция изменилась'}}
 else if(path.endsWith('/moderation/publish')||path.endsWith('/reject')||path.endsWith('/approve')){markets=markets.filter(m=>m.id!==2048);data={...base,status:path.endsWith('/reject')?'rejected':'open'}}
 return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}})
}
const client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})
createRoot(document.getElementById('root')!).render(<I18nProvider><VisualV1Provider enabled={params.get('ui')!=='legacy'}><QueryClientProvider client={client}><div className={params.get('ui')==='legacy'?'':v1.root} style={{height:'100dvh'}}><ConnectedModerationScreen enabled={!params.get('denied')} onBack={()=>document.documentElement.dataset.back='true'}/></div></QueryClientProvider></VisualV1Provider></I18nProvider>)
