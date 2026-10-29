import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import { I18nProvider } from '../../../src/i18n'
import { VisualV1Provider } from '../../../src/visualV1/VisualV1Context'
import { NotificationsV1 } from '../../../src/visualV1/NotificationsV1'
import { ProfileV1 } from '../../../src/visualV1/ProfileV1'
import { GuarantorV1 } from '../../../src/visualV1/GuarantorV1'
import { MyEventsV1 } from '../../../src/visualV1/MyEventsV1'
import { accountUser } from '../../../src/fixtures/account'
import { feedMarkets } from '../../../src/fixtures/markets'
import type { Guarantor } from '../../../src/api/guarantors'
import type { NotificationItem } from '../../../src/screens/NotificationsScreen'
import '../../../src/styles/tokens.css'
import '../../../src/styles/reset.css'
import '../../../src/styles/global.css'
import v1 from '../../../src/visualV1/VisualV1.module.css'

const notes: NotificationItem[] = [
  { id:'1',kind:'partial-fill',title:'Предложение частично исполнено',metadata:'160 TON · 2 мин',unread:true,detailTitle:'Частичное исполнение',headline:'Предложение частично исполнено',headlineMeta:'160 TON',actionLabel:'Открыть событие' },
  { id:'2',kind:'market-closed',title:'Ожидается результат события',metadata:'18 мин',unread:true },
  { id:'3',kind:'market-resolved',title:'Результат подтверждён',metadata:'Вчера' },
  { id:'4',kind:'order-cancelled',title:'Остаток предложения отменён',metadata:'Вчера' },
]
const events = [
{...feedMarkets[0]!, id:'qa-ton', question:'TON будет выше $12?', status:'open' as const, volumeTon:8420},
{...feedMarkets[0]!, id:'qa-match', question:'Матч состоится 24 сентября?', status:'pending' as const, volumeTon:0},
{...feedMarkets[0]!, id:'qa-eth', question:'ETH выше $8k?', status:'closed' as const, volumeTon:0},
{...feedMarkets[0]!, id:'qa-weather', question:'Погода в Москве', status:'rejected' as const, rejectionReason:'Нужен проверяемый источник', volumeTon:0},
{...feedMarkets[0]!, id:'qa-private', question:'Дмитрий — Артём', status:'closed' as const, visibility:'unlisted' as const, volumeTon:0},
]
const guarantor:Guarantor={user_id:1,name:'Анна',bio:'Проверяю результаты спортивных событий по официальным источникам.',topics:'Спорт, CS2',status:'approved',available:true,available_until:null,completed:12,disputes:0,is_moderator:false,high_reputation:false,rating:4.8,review_count:5,rating_distribution:{'5':4,'4':1},reviews:[]}
function Qa(){
  const screen=new URLSearchParams(location.search).get('s')??'notes'
  const [items,setItems]=useState(notes)
  const [mine,setMine]=useState<Guarantor|null>(screen==='register'?null:guarantor)
  const [action,setAction]=useState('')
  const noop=()=>setAction('Нажатие получено')
  return <I18nProvider><VisualV1Provider enabled><div className={v1.root} style={{height:'100dvh'}} data-qa-action={action}>
    {screen==='notes'?<NotificationsV1 items={items} onBack={noop} onRead={item=>setItems(old=>old.map(n=>n.id===item.id?{...n,unread:false}:n))} onAction={noop}/>:screen==='profile'?<ProfileV1 account={{...accountUser,displayName:'mezdmal',handle:'mezdmal',availableTon:125.4,eventsCreated:128}} onMenu={noop} onNavChange={noop}/>:screen==='events'?<MyEventsV1 markets={events} onOpenMarket={noop} onNavChange={noop}/>:<GuarantorV1 userId={1} isAdmin={false} onBack={noop} onOpen={noop} onNavChange={noop} mine={mine} directory={[guarantor]} cases={screen==='register'?[]:[{market_id:1,question:'Вася против Вани',state:'invited',revision:1,guarantor_id:1,creator_id:2,deadline:null},{market_id:2,question:'Вася против Вани',state:'active',revision:1,guarantor_id:1,creator_id:2,deadline:'2026-10-30T08:00:00Z'}]} applications={[]} loading={false} casesLoading={false} directoryLoading={false} errors={[]} pending={false} clock={Date.parse('2026-10-30T06:36:00Z')} onSubmit={(path,body)=>{if(path.endsWith('availability'))setMine(old=>old?{...old,available:!old.available}:old);else if(path==='/guarantors/me')setMine({...guarantor,...body});noop()}}/>}
  </div></VisualV1Provider></I18nProvider>
}
createRoot(document.getElementById('root')!).render(<Qa/> )
