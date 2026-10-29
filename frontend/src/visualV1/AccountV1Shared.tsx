import { useState, type ReactNode } from 'react'
import { useContext } from 'react'
import { NotificationBadgeContext } from '../components/BottomNavigation/NotificationBadgeContext'
import { useVisualV1Actions } from './VisualV1Context'
import s from './AccountV1.module.css'
const images = import.meta.glob('../assets/visual-v1/account/*.svg', { eager:true, query:'?url', import:'default' }) as Record<string,string>
export function AccountAsset({ name, size=24 }: {name:string;size?:number}) { return <span className={s.asset} style={{width:size,height:size}} aria-hidden="true"><img src={images[`../assets/visual-v1/account/${name}.svg`]} alt="" draggable={false}/></span> }
export function AccountHeaderV1({ onBack, main=false }: {onBack?:()=>void;main?:boolean}) {
 const a=useVisualV1Actions(),unread=useContext(NotificationBadgeContext),[menu,setMenu]=useState(false)
 return <><header className={s.header}><div className={s.headerSide}><button className={s.iconButton} type="button" aria-label={main?'Меню':'Назад'} onClick={main?()=>setMenu(true):onBack}><AccountAsset name={main?'cd126':'f259b'} size={main?21:20}/></button>{main?<button className={s.iconButton} type="button" aria-label={`Уведомления${unread?` · ${unread}`:''}`} onClick={a.onOpenNotifications}><AccountAsset name="656d7" size={21}/>{unread?<span className={s.dot}/>:null}</button>:null}</div><strong className={s.brand}>Bet<em>TON</em></strong><span className={s.headerSide}/></header>{menu?<div className={s.dialogBackdrop} onClick={()=>setMenu(false)}><nav className={s.drawer} aria-label="Меню BetTON" onClick={e=>e.stopPropagation()}>{[['Мои события',a.onOpenMyEvents],['Профиль',a.onOpenProfile],['Гарант',a.onOpenGuarantors],['История',a.onOpenHistory],['Настройки',a.onOpenSettings],['Помощь',a.onOpenHelp]].map(([label,action])=><button type="button" key={String(label)} onClick={()=>{setMenu(false);if(typeof action==='function')action()}}>{String(label)}</button>)}<button type="button" onClick={()=>setMenu(false)}>Закрыть меню</button></nav></div>:null}</>
}
export function AccountTitleV1({title,subtitle}:{title:string;subtitle?:string}){return <div className={s.title}><h1>{title}</h1>{subtitle?<p>{subtitle}</p>:null}</div>}
export function AccountStateV1({title,children}:{title:string;children?:ReactNode}){return <section className={s.empty}><h2>{title}</h2>{children?<p>{children}</p>:null}</section>}
