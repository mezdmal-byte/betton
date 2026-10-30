import type { ProfileScreenProps } from '../screens/ProfileScreen'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { Button } from '../components/Button/Button'
import { formatInteger, formatTonFull } from '../lib/format'
import { AccountAsset, AccountHeaderV1, AccountStateV1 } from './AccountV1Shared'
import s from './AccountV1.module.css'

export function ProfileV1({account,accountState='ready',onLogin,onMenu,onNavChange}:ProfileScreenProps){
 if(!account)return null
 const menu=[['events','Мои события','4b750'],['bets','Мои ставки','1a43f'],['wallet','Кошелёк','da346'],['guarantors','Гарант','2a3af'],['history','История','97e70'],['settings','Настройки','be0ae'],['help','Помощь','15236']]
 return <div className={s.screen} data-figma-frame="819:61952"><AccountHeaderV1 main/><main className={s.body}>
 {accountState==='unauthenticated'?<><AccountStateV1 title="Войдите через Telegram">Для личного профиля требуется подтверждённая Telegram-сессия.</AccountStateV1><Button fullWidth onClick={onLogin} disabled={!onLogin}>Войти через Telegram</Button></>:<>
 <section className={s.identity}><span className={s.avatar}>{account.photoUrl?<img src={account.photoUrl} alt=""/>:<AccountAsset name="8e38d" size={32}/>}</span><div><strong>{account.displayName||account.handle}</strong><p>{account.isAdmin?'Администратор BetTON':'Обычный пользователь'}</p></div></section>
 <section className={s.panel}><div className={s.panelHead}><strong>Баланс BetTON</strong><button className={`${s.textAction} ${s.profileHistory}`} onClick={()=>onMenu?.('history')}>История →</button></div><strong className={s.balance}>{formatTonFull(account.availableTon)}</strong><div className={s.walletActions}>{[['Пополнить','729dd'],['Вывести','a375d'],['Перевести','56920']].map(([label,icon])=><button key={label} type="button" disabled title="Операции кошелька пока недоступны"><span className={s.walletIcon}><AccountAsset name={icon} size={18}/></span>{label}</button>)}</div></section>
 <button className={s.callout} type="button" onClick={()=>onMenu?.('guarantors')}><strong><AccountAsset name="2a3af" size={19}/>Станьте гарантом</strong><small>Помогайте определять результат частных пари.</small></button>
 <section className={s.panel}><div className={s.panelHead}><strong>Статистика</strong><small className={s.muted}>За всё время</small></div><div className={s.statistics}>{[['6aaf2',account.eventsCreated==null?'—':formatInteger(account.eventsCreated),'Создано событий'],['9341b','—','Ставок сделано'],['f1ff2','—','Процент побед'],['e7b11','—','Результат, TON']].map(([icon,value,label])=><div key={label}><AccountAsset name={icon} size={20}/><strong>{value}</strong><span>{label}</span></div>)}</div></section>
 <nav className={s.menu} aria-label="Профиль">{menu.map(([id,label,icon])=><button type="button" key={id} className={s.menuRow} disabled={id==='wallet'} onClick={()=>id==='bets'?onNavChange?.('portfolio'):onMenu?.(id)}><span className={s.rowIcon}><AccountAsset name={icon} size={22}/></span><strong>{label}</strong><AccountAsset name="0de93" size={16}/></button>)}{account.isAdmin?<button className={s.menuRow} type="button" onClick={()=>onMenu?.('moderation')}><span className={s.rowIcon}><AccountAsset name="2a3af" size={22}/></span><strong>Модерация</strong><AccountAsset name="0de93" size={16}/></button>:null}</nav>
 </>}
 </main><BottomNavigation active="profile" onChange={onNavChange}/></div>
}
