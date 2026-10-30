import {useEffect,useRef,useState,type ReactNode} from 'react'
import type {WalletScreenProps,WalletNetwork,WalletTab} from '../screens/WalletScreen'
import {Button} from '../components/Button/Button'
import {AccountAsset,AccountHeaderV1} from './AccountV1Shared'
import {syncTelegramBackButton} from '../telegram/webapp'
import s from './SettingsWalletV1.module.css'

/** Wallet integration is not connected. Application balances are not on-chain balances. */
export function WalletV1({tab,network='ton',onBack,onTabChange,onNetworkChange}:WalletScreenProps){
 const [view,setView]=useState<WalletTab|'home'>(tab??'home'),[selectedNetwork,setSelectedNetwork]=useState(network),[networkOpen,setNetworkOpen]=useState(false)
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLElement|null>(null)
 useEffect(()=>setView(tab??'home'),[tab]);useEffect(()=>setSelectedNetwork(network),[network])
 const closeNetwork=()=>{dialog.current?.close();setNetworkOpen(false);requestAnimationFrame(()=>trigger.current?.focus())}
 const back=()=>{if(networkOpen)closeNetwork();else if(onBack)onBack();else setView('home')}
 useEffect(()=>syncTelegramBackButton(true,back),[view,networkOpen,onBack])
 useEffect(()=>{if(networkOpen&&!dialog.current?.open)dialog.current?.showModal()},[networkOpen])
 const showNetwork=()=>{trigger.current=document.activeElement instanceof HTMLElement?document.activeElement:null;setNetworkOpen(true)}
 const changeNetwork=(next:WalletNetwork)=>{setSelectedNetwork(next);onNetworkChange?.(next);closeNetwork()}
 const changeView=(next:WalletTab)=>{setView(next);onTabChange?.(next)}
 const asset=selectedNetwork==='ton'?'TON':'SOL'
 function row(label:string,meta:string,icon:ReactNode,action?:()=>void){const contents=<><span className={s.iconSlot}>{icon}</span><span className={s.rowText}><b>{label}</b><small>{meta}</small></span></>;return action?<button className={s.row} type="button" onClick={action}>{contents}</button>:<div className={s.row}>{contents}</div>}
 return <div className={s.screen} data-figma-frame={view==='home'?'819:60815':view==='deposit'?'821:8251':'821:8307'}><AccountHeaderV1 onBack={back}/><main className={s.body}><div className={s.title}><h1>{view==='home'?'Кошелёк':view==='deposit'?'Пополнение':'Вывод'}</h1></div>
 {view==='home'?<><section className={s.card}><small>Баланс кошелька</small><strong className={s.balance}>— {asset}</strong><small>Не подключён</small></section><div className={s.notice}><AccountAsset name="15236" size={22}/><p>Кошелёк пока не подключён. Не отправляйте средства.</p></div><div className={s.group}>{row('Сеть','—',<AccountAsset name="cc62e" size={22}/>,showNetwork)}{row('Адрес','Недоступен',<AccountAsset name="da346" size={22}/>)}{row('История операций','Недоступна',<AccountAsset name="97e70" size={22}/>)}</div><div className={s.walletActions}><Button className={s.mutedButton} fullWidth onClick={()=>changeView('deposit')}>Пополнить</Button><Button className={s.mutedButton} fullWidth onClick={()=>changeView('withdraw')}>Вывести</Button></div></>:<><div className={s.notice}><AccountAsset name="15236" size={22}/><p>{view==='deposit'?'Пополнение пока недоступно. Не отправляйте средства.':'Вывод пока недоступен. Операция не создана.'}</p></div><div className={`${s.group} ${s.walletSeparated}`}>{view==='deposit'?<>{row('Сеть',asset,<AccountAsset name="15236" size={22}/>,showNetwork)}{row('Адрес','Недоступен',<AccountAsset name="da346" size={22}/>)}</>:<>{row('Получатель','Не указан',<AccountAsset name="8e38d" size={22}/>)}{row('Сумма','— '+asset,<AccountAsset name="4b750" size={22}/>)}{row('Комиссия сети','Нет данных',<AccountAsset name="15236" size={22}/>)}</>}</div></>}
 </main><footer className={s.footer}>{view==='withdraw'?<button type="button" className={s.networkAction} onClick={showNetwork}>Сеть: {selectedNetwork==='ton'?'TON':'Solana'}</button>:null}<Button className={view==='home'?s.mutedButton:s.button} variant="secondary" fullWidth onClick={back}>{view==='home'?'Подключить позже':'Вернуться'}</Button></footer><dialog className={s.dialog} ref={dialog} aria-labelledby="v1-wallet-network-title" onCancel={event=>{event.preventDefault();closeNetwork()}} onClick={event=>{if(event.target===event.currentTarget)closeNetwork()}}><section><h2 id="v1-wallet-network-title">Сеть</h2><p>Выбор сети не подключает кошелёк. Пополнение и вывод пока недоступны.</p><div className={s.networkOptions}>{(['ton','solana'] as const).map(id=><button type="button" key={id} aria-pressed={selectedNetwork===id} onClick={()=>changeNetwork(id)}>{id==='ton'?'TON':'Solana'}</button>)}</div><Button fullWidth variant="secondary" className={s.button} onClick={closeNetwork}>Закрыть</Button></section></dialog></div>
}
