import { useMemo,useState } from 'react'
import type { MyEventsScreenProps } from '../screens/MyEventsScreen'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { Button } from '../components/Button/Button'
import { formatTonFull } from '../lib/format'
import type {MarketFixture} from '../types/market'
import {AccountAsset,AccountHeaderV1,AccountStateV1,AccountTitleV1} from './AccountV1Shared'
import s from './AccountV1.module.css'
function status(m:MarketFixture){switch(m.status){case 'pending':return ['На модерации',s.warning,'df8f8'];case 'rejected':return ['Отклонено',s.danger,'d0df9'];case 'closed':return ['Ожидает решения',s.eventBlue, '679dd'];case 'resolved':return ['Результат подтверждён',s.success,'fd5df'];case 'cancelled':return ['Отменено',s.danger,'11dc5'];default:return ['Открыто',s.success,'0c4e7']}}
export function MyEventsV1({markets=[],viewState='ready',errorMessage,onRetry,onOpenMarket,onNavChange}:MyEventsScreenProps){
 const [tab,setTab]=useState('all');const shown=useMemo(()=>markets.filter(m=>tab==='all'||(tab==='open'?['open','closing','pending'].includes(m.status):['closed','resolved','cancelled','rejected'].includes(m.status))),[markets,tab])
 return <div className={s.screen} data-figma-frame="819:60537"><AccountHeaderV1 main/><main className={s.body}><AccountTitleV1 title="Мои события" subtitle={`${markets.length} событий`}/>{markets.length?<div className={s.tabs} role="tablist" aria-label="Статус событий">{[['all','Все'],['open','Открытые'],['done','Завершённые']].map(([id,label])=><button key={id} type="button" role="tab" aria-selected={tab===id} onClick={()=>setTab(id)}>{label}</button>)}</div>:null}
 {viewState==='loading'?<AccountStateV1 title="Загружаем события…"/>:viewState==='unauthenticated'?<AccountStateV1 title="Откройте BetTON через Telegram">Для просмотра ваших событий требуется вход.</AccountStateV1>:viewState==='error'?<><div className={s.error} role="alert">{errorMessage||'Не удалось загрузить события.'}</div><Button variant="secondary" onClick={onRetry}>Повторить</Button></>:shown.length?<div className={s.list}>{shown.map(m=>{const [label,tone,icon]=status(m);return <button type="button" className={s.eventCard} key={m.id} onClick={()=>onOpenMarket?.(m)}><span className={s.eventHeading}><span className={`${s.eventIcon} ${m.status === 'rejected' ? s.eventYellow : tone}`}><AccountAsset name={icon} size={22}/></span><span className={s.eventCopy}><strong>{m.question}</strong><span className={`${s.status} ${tone}`}>{label}</span></span><AccountAsset name="0de93" size={16}/></span><span className={s.eventMeta}>{m.status==='closed'?'Приём ставок закрыт':m.status==='pending'?'Ожидает проверки':m.status==='rejected'?m.rejectionReason||'Нужна правка':formatTonFull(m.volumeTon)}</span></button>})}</div>:<AccountStateV1 title={tab==='all'?'Событий пока нет':'В этой вкладке пока нет событий'}>Создайте событие и пригласите участников.</AccountStateV1>}
 {viewState==='ready'&&!markets.length?<Button fullWidth className={s.button} onClick={()=>onNavChange?.('create')}>Создать событие</Button>:null}
 </main><BottomNavigation active="profile" onChange={onNavChange}/></div>
}
