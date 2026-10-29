import type { ReactNode } from 'react'
import { AccountHeaderV1 } from './AccountV1Shared'
import checkIcon from '../assets/visual-v1/event/f48de.svg'
import s from './TradeV1.module.css'

export function TradeResultV1({title,frame,onBack,children,actions,success=false}:{title:string;frame:string;onBack?:()=>void;children:ReactNode;actions:ReactNode;success?:boolean}){
 return <div className={s.resultPage} data-figma-frame={frame}><AccountHeaderV1 onBack={onBack}/><main className={s.resultMain}><h1>{title}</h1><section className={s.resultCard}>{success?<img className={s.resultCheck} src={checkIcon} alt=""/>:null}{children}</section></main><footer className={s.resultActions}>{actions}</footer></div>
}
