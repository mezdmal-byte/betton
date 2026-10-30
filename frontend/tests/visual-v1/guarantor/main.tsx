/** Isolated data; never imported by the application. */
import {createRoot} from 'react-dom/client'
import {useState} from 'react'
import {GuarantorWorkflowV1} from '../../../src/visualV1/GuarantorWorkflowV1'
import type {GuarantorCase} from '../../../src/api/guarantors'
import type {EventTermsV3} from '../../../src/api/eventGovernanceV3'
import {VisualV1Provider} from '../../../src/visualV1/VisualV1Context'
import v1 from '../../../src/visualV1/VisualV1.module.css'
import '../../../src/styles/tokens.css'
import '../../../src/styles/reset.css'
import '../../../src/styles/global.css'
const p=new URLSearchParams(location.search),now=Date.parse('2026-10-30T12:00:00Z')
const initial:GuarantorCase={market_id:9,question:'BTC выше $100 000?',state:p.get('state')??'review',revision:3,creator_id:1,guarantor_id:2,guarantor_name:'Анна',creator_confirmed:3,criteria:'Цена BTC выше $100 000 на момент проверки.',source:'Цена закрытия BTC/USD.',description:'',outcomes:['Да','Нет'],close_at:'2026-10-31T12:00:00Z',ends_at:p.get('state')==='active'?'2026-10-30T11:00:00Z':'2026-10-31T13:00:00Z',result_due_at:'2026-10-31T11:00:00Z',deadline:'2026-10-30T12:05:00Z',extension_by:null,proposed_outcome:null,decision_reason:null,consent:false,participant:true,messages:[],reward:{mode:'percent',fixed_ton:'0',percent:'5',accepted_by:[1],proposed_by:1},reward_payments_supported:true}
;(window as any).__requests=[]
function Fixture(){const[event,setEvent]=useState(initial),[pending,setPending]=useState(false);(window as any).__bump=()=>setEvent(e=>({...e,revision:e.revision+1}));const terms={revision:event.revision,rules:event.criteria,resolution_method:event.source,close_at:event.close_at,ends_at:event.ends_at} as EventTermsV3;return <VisualV1Provider enabled><div className={v1.root}><GuarantorWorkflowV1 event={event} userId={Number(p.get('user')??2)} clock={now} terms={terms} initialOpen initialTab={p.get('tab')==='terms'?'terms':'chat'} pending={pending} onAction={async request=>{(window as any).__requests.push(request);setPending(true);await new Promise(r=>setTimeout(r,100));setPending(false);if(p.has('fail'))throw new Error('Сервер отклонил запрос');if(request.action==='accept')setEvent(e=>({...e,state:'collecting'}));return event}} onUpdate={async request=>{(window as any).__requests.push(request);if(p.has('fail'))throw new Error('Сервер отклонил запрос')}}/></div></VisualV1Provider>}
createRoot(document.getElementById('root')!).render(<Fixture/> )
