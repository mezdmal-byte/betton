import type { BottomNavigationProps } from '../components/BottomNavigation/BottomNavigation'
import { useVisualV1Actions } from './VisualV1Context'
import s from './NavigationV1.module.css'
const assets = import.meta.glob('../assets/visual-v1/navigation/*.svg', {eager:true,query:'?url',import:'default'}) as Record<string,string>
export function NavigationV1({active,onChange}:BottomNavigationProps) {
  const a=useVisualV1Actions()
  const items=[['markets','Главная'],['portfolio','Мои ставки'],['create','Создать'],['events','Мои события'],['profile','Профиль']] as const
  return <nav className={s.nav} aria-label="Основная навигация">{items.map(([id,label],i)=>{
    const selected=id==='events'?a.activeMyEvents:!a.activeMyEvents&&active===id
    const source=id==='profile'?(selected?'profile':'feed'):id==='markets'&&selected?'feed':id==='events'&&selected?'events':id==='portfolio'&&selected?'portfolio':'profile'
    return <button type="button" key={id} className={`${s.tab} ${selected?s.active:''} ${id==='create'?s.create:''}`} aria-current={selected?'page':undefined} onClick={()=>id==='events'?a.onOpenMyEvents?.():onChange?.(id)}><span className={s.slot}><img src={assets[`../assets/visual-v1/navigation/${source}-${i}.svg`]} alt=""/></span><span>{label}</span></button>
  })}</nav>
}
