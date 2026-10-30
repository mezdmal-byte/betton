import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '../components/Button/Button'
import type { ProfileScreenProps } from '../screens/ProfileScreen'
import { useI18n, type Locale } from '../i18n'
import { useTheme } from '../theme/ThemeProvider'
import type { ThemePreference } from '../theme/theme'
import { closeTelegramWebApp, syncTelegramBackButton } from '../telegram/webapp'
import { AccountAsset, AccountHeaderV1 } from './AccountV1Shared'
import { useVisualV1Actions } from './VisualV1Context'
import s from './SettingsWalletV1.module.css'

const images=import.meta.glob('../assets/visual-v1/settings/*.svg',{eager:true,query:'?url',import:'default'}) as Record<string,string>
function SettingIcon({name,size=22}:{name:string;size?:number}){return <span className={s.asset} style={{width:size,height:size}}><img src={images[`../assets/visual-v1/settings/${name}.svg`]} alt=""/></span>}
type View='main'|'language'|'security'|'about'|'terms'|'privacy'
type LegacyChoice={kind:'theme';value:Exclude<ThemePreference,'light'>}|{kind:'language';value:Exclude<Locale,'ru'>}
export function legacySettingsUrl(href:string){const url=new URL(href);url.searchParams.set('ui','legacy');return url.href}

/** Only Russian light V1 is approved. Other choices explicitly retain the existing interface. */
export function SettingsV1({onBack,onNavChange,onLocaleChange,onMenu}:Pick<ProfileScreenProps,'onBack'|'onNavChange'|'onLocaleChange'|'onMenu'>){
 const i18n=useI18n(),theme=useTheme(),actions=useVisualV1Actions()
 const [view,setView]=useState<View>('main'),[language,setLanguage]=useState<Locale>('ru'),[choice,setChoice]=useState<LegacyChoice|null>(null)
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLElement|null>(null)
 const showChoice=(next:LegacyChoice)=>{trigger.current=document.activeElement instanceof HTMLElement?document.activeElement:null;setChoice(next)}
 const dismiss=()=>{dialog.current?.close();setChoice(null);requestAnimationFrame(()=>trigger.current?.focus())}
 const back=()=>{if(choice)dismiss();else if(view!=='main')setView('main');else onBack?.()}
 useEffect(()=>syncTelegramBackButton(true,back),[view,choice,onBack])
 useEffect(()=>{if(choice&&!dialog.current?.open)dialog.current?.showModal()},[choice])
 const confirmLegacy=()=>{if(!choice)return;if(choice.kind==='theme')theme.setPreference(choice.value);else (onLocaleChange??i18n.setLocale)(choice.value);window.location.assign(legacySettingsUrl(window.location.href))}
 const openHelp=()=>{if(actions.onOpenHelp)actions.onOpenHelp();else onMenu?.('help')}
 const saveLanguage=()=>{if(language==='ru'){(onLocaleChange??i18n.setLocale)('ru');setView('main')}else showChoice({kind:'language',value:language})}
 const titles={main:'Настройки',language:'Язык',security:'Безопасность',about:'О BetTON',terms:'Условия использования',privacy:'Конфиденциальность'}
 const frames={main:'819:60879',language:'821:7987',security:'821:8039',about:'821:8062',terms:'822:8319',privacy:'822:8339'}
 function row(label:string,icon:ReactNode,action:()=>void,meta?:string){return <button type="button" className={s.row} onClick={action}><span className={s.iconSlot}>{icon}</span><span className={s.rowText}><b>{label}</b>{meta?<small>{meta}</small>:null}</span><AccountAsset name="0de93" size={16}/></button>}
 return <div className={s.screen} data-figma-frame={frames[view]}><AccountHeaderV1 onBack={back}/><main className={s.body}>
  <div className={s.title}><h1>{titles[view]}</h1>{view==='main'?<p>Аккаунт и приложение</p>:view==='security'?<p>Сессия Telegram</p>:view==='about'?<p>P2P-пари в Telegram</p>:view==='terms'||view==='privacy'?<p>Документ готовится</p>:null}</div>
  {view==='main'?<div className={s.group}><section className={s.theme}><div className={s.themeTitle}><SettingIcon name="sun" size={19}/><b>Тема</b></div><div className={s.segments} role="group" aria-label="Тема">{(['system','light','dark'] as const).map(id=><button key={id} type="button" aria-pressed={id==='light'} onClick={()=>id==='light'?theme.setPreference('light'):showChoice({kind:'theme',value:id})}>{id==='system'?'Системная':id==='light'?'Светлая':'Тёмная'}</button>)}</div></section>{row('Язык',<SettingIcon name="globe"/>,()=>setView('language'),'Русский')}{row('Уведомления',<SettingIcon name="bell"/>,()=>actions.onOpenNotifications?actions.onOpenNotifications():onNavChange?.('notifications'),'Внутри приложения')}{row('Безопасность',<AccountAsset name="2a3af" size={22}/>,()=>setView('security'),'Сессии Telegram')}{row('О приложении',<AccountAsset name="15236" size={22}/>,()=>setView('about'))}</div>:null}
  {view==='language'?<div className={s.group} role="radiogroup" aria-label="Язык">{([['ru','Русский'],['en','English'],['zh','中文']] as const).map(([id,label])=><button key={id} type="button" role="radio" aria-checked={language===id} className={s.row} onClick={()=>setLanguage(id)}><span className={s.iconSlot}><AccountAsset name="15236" size={22}/></span><span className={s.rowText}><b>{label}</b>{language===id?<small>Выбрано</small>:null}</span><AccountAsset name="0de93" size={16}/></button>)}</div>:null}
  {view==='security'?<><section className={s.card}><AccountAsset name="2a3af" size={28}/><h2>Вход через Telegram</h2><p>Доступ к аккаунту связан с вашей сессией Telegram.</p></section><button className={s.textAction} type="button" onClick={openHelp}>Правила и безопасность</button><Button fullWidth variant="secondary" className={s.button} onClick={closeTelegramWebApp}>Закрыть приложение</Button></>:null}
  {view==='about'?<><section className={s.card}><h2>Ставки между участниками</h2><p>Вы выбираете событие, исход и условия. Доступные предложения публикуют другие участники.</p></section><div className={s.group}>{row('Как это работает',<AccountAsset name="15236" size={22}/>,openHelp)}{row('Правила BetTON',<AccountAsset name="2a3af" size={22}/>,openHelp)}{row('Условия использования',<AccountAsset name="4b750" size={22}/>,()=>setView('terms'),'Документ готовится')}{row('Конфиденциальность',<AccountAsset name="2a3af" size={22}/>,()=>setView('privacy'),'Документ готовится')}</div></>:null}
  {view==='terms'||view==='privacy'?<section className={s.card}><h2>{view==='terms'?'Документ ещё не опубликован':'Политика ещё не опубликована'}</h2><p>{view==='terms'?'Этот экран не является готовыми условиями использования.':'Текст будет доступен после подготовки и утверждения документа.'}</p></section>:null}
 </main>{view==='language'?<footer className={s.footer}><Button fullWidth className={s.button} onClick={saveLanguage}>Сохранить</Button></footer>:null}
 <dialog className={s.dialog} ref={dialog} aria-labelledby="v1-preference-title" onCancel={event=>{event.preventDefault();dismiss()}} onClick={event=>{if(event.target===event.currentTarget)dismiss()}}><section><h2 id="v1-preference-title">{choice?.kind==='theme'?`${choice.value==='dark'?'Тёмная тема':'Системная тема'} доступна в прежнем оформлении`:'Выбранный язык доступен в прежнем оформлении'}</h2><p>Светлое оформление пока доступно на русском языке. Прежнее оформление сохранит выбранную настройку.</p><Button fullWidth className={s.button} onClick={confirmLegacy}>Открыть прежнее оформление</Button><Button fullWidth variant="secondary" className={s.button} onClick={dismiss}>Остаться здесь</Button></section></dialog>
 </div>
}
