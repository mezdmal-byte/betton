import { useState, type ReactNode } from 'react'
import { useContext } from 'react'
import { NotificationBadgeContext } from '../components/BottomNavigation/NotificationBadgeContext'
import { useVisualV1Actions } from './VisualV1Context'
import s from './AccountV1.module.css'
import wordmark from '../assets/visual-v1/wordmark.svg'
import { DrawerV1, type DrawerUserV1 } from './DrawerV1'
const images = import.meta.glob('../assets/visual-v1/account/*.svg', { eager:true, query:'?url', import:'default' }) as Record<string,string>
export function AccountAsset({ name, size=24 }: {name:string;size?:number}) { return <span className={s.asset} style={{width:size,height:size}} aria-hidden="true"><img src={images[`../assets/visual-v1/account/${name}.svg`]} alt="" draggable={false}/></span> }
export function AccountHeaderV1({ onBack, main=false, account, onNavigate }: {onBack?:()=>void;main?:boolean;account?:DrawerUserV1|null;onNavigate?:(id:'markets'|'create')=>void}) {
 const a=useVisualV1Actions(),unread=useContext(NotificationBadgeContext),[menu,setMenu]=useState(false)
 return <><header className={s.header}><div className={s.headerSide}><button className={s.iconButton} type="button" aria-label={main?'Меню':'Назад'} onClick={main?()=>setMenu(true):onBack}><AccountAsset name={main?'cd126':'f259b'} size={main?21:20}/></button>{main?<button className={s.iconButton} type="button" aria-label={`Уведомления${unread?` · ${unread}`:''}`} onClick={a.onOpenNotifications}><AccountAsset name="656d7" size={21}/>{unread?<span className={s.dot}/>:null}</button>:null}</div><img className={s.brand} src={wordmark} width={101} height={32} alt="BetTON"/><span className={s.headerSide}/></header>{menu?<DrawerV1 user={account} onClose={()=>setMenu(false)} onMarkets={()=>onNavigate?.('markets')} onCreate={()=>onNavigate?.('create')} onProfile={a.onOpenProfile}/>:null}</>
}
export function AccountTitleV1({title,subtitle}:{title:string;subtitle?:string}){return <div className={s.title}><h1>{title}</h1>{subtitle?<p>{subtitle}</p>:null}</div>}
export function AccountStateV1({title,children}:{title:string;children?:ReactNode}){return <section className={s.empty}><h2>{title}</h2>{children?<p>{children}</p>:null}</section>}
