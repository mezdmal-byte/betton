import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Button } from '../components/Button/Button'
import type { OnboardingScreenProps } from '../screens/OnboardingScreen'
import type { EventTypeInfoProps, EventType } from '../screens/EventTypeInfo'
import { syncTelegramBackButton } from '../telegram/webapp'
import s from './OnboardingV1.module.css'
const assets=import.meta.glob('../assets/visual-v1/onboarding/*.svg',{eager:true,query:'?url',import:'default'}) as Record<string,string>
function Art({name,className}:{name:string;className?:string}){return <img src={assets[`../assets/visual-v1/onboarding/${name}.svg`]} className={className} alt="" draggable={false}/>}
const frames=['828:15062','828:15111','828:15154','828:15200']
const titles=[['Что такое','BetTON'],['Как это','работает'],['Создавайте','свои события'],['Станьте','гарантом']]
const descriptions=['Прогнозируйте события и заключайте ставки напрямую с другими участниками.','Выберите исход и сумму. Примите предложение участника или задайте свой коэффициент.','Создайте публичное событие или частное — с доступом по ссылке.','Помогайте определять результаты частных событий и получайте вознаграждение.']
export function OnboardingV1({onContinue,onSkip,initialStep=0}:OnboardingScreenProps){
  const [step,setStep]=useState(Math.min(3,Math.max(0,initialStep))),[detail,setDetail]=useState<EventType|null>(null)
  const scroll=useRef<HTMLElement>(null)
  useEffect(()=>syncTelegramBackButton(Boolean(detail||step),()=>detail?setDetail(null):setStep(v=>Math.max(0,v-1))),[step,detail])
  useEffect(()=>{scroll.current?.scrollTo(0,0)},[step])
  if(detail)return <EventTypeInfoV1 kind={detail} onClose={()=>setDetail(null)}/>
  return <div className={s.screen} data-figma-frame={frames[step]}>
    <header className={s.header}><strong>Bet<em>TON</em></strong><button type="button" onClick={onSkip??onContinue}>Пропустить</button></header>
    <main className={s.body} ref={scroll}><h1>{titles[step]![0]}<span className={step===0?s.italic:''}>{step===0?<>Bet<em>TON</em></>:titles[step]![1]}</span></h1><p className={s.description}>{descriptions[step]}</p>
      <ArtCanvas height={step===0?405:step===2?367:391}>{step===0?<Match/>:step===1?<Matching/>:step===2?<Types onDetail={setDetail}/>:<Guarantor/>}</ArtCanvas>
    </main>
    <footer className={s.footer}><nav className={s.dots} aria-label="Экраны знакомства">{frames.map((id,i)=><button key={id} type="button" aria-label={`${i+1} из 4`} aria-current={i===step?'step':undefined} onClick={()=>setStep(i)}><span/></button>)}</nav><Button fullWidth className={s.next} onClick={()=>step<3?setStep(step+1):onContinue?.()}>{step===3?'Начать':'Далее  →'}</Button></footer>
  </div>
}
function ArtCanvas({height,children}:{height:number;children:ReactNode}){
 const ref=useRef<HTMLDivElement>(null),[scale,setScale]=useState(1)
 useEffect(()=>{const el=ref.current;if(!el)return;const update=()=>setScale(Math.min(1,el.clientWidth/350));update();const o=new ResizeObserver(update);o.observe(el);return()=>o.disconnect()},[])
 return <div ref={ref} className={s.viewport} style={{height:height*scale,'--art-scale':scale} as CSSProperties}><div className={s.canvas} style={{height}} data-onboarding-illustration>{children}</div></div>
}
function Match(){return <section className={s.match} aria-label="Пример встречной ставки"><span className={s.example}>ПРИМЕР СОБЫТИЯ</span><h2>Спартак — Зенит</h2><p className={s.caption}>Два участника · разные исходы</p><Art name="28916" className={s.glowA}/><Art name="828ea" className={s.glowB}/><Art name="ef7fd" className={s.personA}/><Art name="528f6" className={s.personB}/><span className={s.exchange}><Art name="6fe15"/></span><div className={s.playerA}><b>Алексей</b><span>За Спартак</span></div><div className={s.playerB}><b>Мария</b><span>За Зенит</span></div><p className={s.matchNote}>Ставка заключается, когда есть встречное предложение.</p></section>}
function Matching(){return <section className={s.matching} aria-label="Как находится встречное предложение"><strong className={s.offerLabel}>ВАШЕ ПРЕДЛОЖЕНИЕ</strong><div className={s.inputExample}><Art name="e5dcf"/><div><b>Спартак</b><span>100 TON  ·  1,85×</span></div></div><div className={s.process}>Встречное предложение</div><span className={s.vertical}/><span className={s.horizontal}/><div className={s.found}><Art name="bc20c"/><b>Есть</b><span>Ставка<br/>заключена</span></div><div className={s.waiting}><Art name="7b04f"/><b>Пока нет</b><span>Предложение<br/>ожидает</span></div><div className={s.matchingNote}><Art name="302a8"/><p>Свой коэффициент позволяет разместить предложение на ваших условиях.</p></div></section>}
const typeNames={public:'Публичное событие',private:'Частное без гаранта',guarantor:'Частное с гарантом'}
function Types({onDetail}:{onDetail:(type:EventType)=>void}){return <section className={s.types}>{(['public','private','guarantor'] as const).map((kind,i)=><button type="button" key={kind} className={s.type} onClick={()=>onDetail(kind)}><span className={`${s.typeIcon} ${i===1?s.blue:''}`}><Art name={['3adda','335a3','c2f42'][i]!}/></span><b>{typeNames[kind]}</b><span className={s.typeNote}>{['Для всех после модерации','По ссылке · результат определяет автор','Решение принимает гарант'][i]}</span><span className={s.more}>Подробнее →</span></button>)}<div className={s.free}><Art name="40354"/><b>Создать событие можно бесплатно</b></div></section>}
function Guarantor(){return <section className={s.guarantor}><div className={s.roles}>{['Создатель','Гарант','Участники'].map((role,i)=><div key={role}><Art name={i===1?'8e2c4':'52660'} className={s.roleCircle}/><Art name={['b3b42','4f08f','3ce34'][i]!} className={s.roleIcon}/><b>{role}</b></div>)}</div><div className={s.stages}>{['Согласуйте условия','Подтвердите результат','Получите вознаграждение'].map((label,i)=><div key={label}><span><Art name={['04d4a','60b1e','400b9'][i]!}/></span><b>{label}</b><small>{['Правила и вознаграждение','После завершения события','За выполненную работу'][i]}</small></div>)}</div></section>}
const detailData={
 public:{frame:'977:28104',halo:'6eb87',hero:'0cb60',caption:'Для всех после модерации',icons:['52e62','8b504','e47ae','de1e3'],rows:['После одобрения модерацией\nдоступно всем пользователям.','Модерация проверяет, можно ли\nоднозначно определить исход.','Способ проверки и источник\nуказаны в условиях события.','Результат определяется\nпо опубликованным условиям.']},
 private:{frame:'977:28151',halo:'00d07',hero:'1a5a8',caption:'Участие по ссылке',icons:['04aaf','eb5e0','d9b21','7e09f'],rows:['Доступно любому участнику,\nу которого есть ссылка.','Результат подтверждает\nсоздатель события.','Ответственность за доверие\nи выбор лежит на участниках.','Перед ставкой прочитайте условия\nи убедитесь, что доверяете автору.']},
 guarantor:{frame:'977:28195',halo:'6eb87',hero:'8e0d7',caption:'Независимая проверка результата',icons:['52e62','8b504','e47ae','7b593'],rows:['Событие доступно участникам\nпо ссылке.','Итог подтверждает выбранный\nнезависимый гарант.','Условия заранее согласуются\nс гарантом до начала ставок.','Гарант получает вознаграждение\nза выполненную работу.']}
}
export function EventTypeInfoV1({kind,onClose}:EventTypeInfoProps){const d=detailData[kind];useEffect(()=>syncTelegramBackButton(true,onClose),[onClose]);return <div className={s.detailScreen} data-figma-frame={d.frame}><main className={s.detailBody}><div className={s.detailIntro}><Art name={d.halo} className={s.halo}/><Art name={d.hero} className={s.hero}/><h1>{typeNames[kind]}</h1><p>{d.caption}</p></div><ul className={s.conditions}>{d.rows.map((row,i)=><li key={row}><span><Art name={d.icons[i]!}/></span><p>{row}</p></li>)}</ul>{kind==='guarantor'?<><p className={s.final}>Решение гаранта окончательное.<br/>Участники выбирают, кому доверять.</p><div className={s.period}><p>24 часа после окончания события</p><p>Нет решения — отмена и возврат ставок</p></div></>:null}</main><footer className={s.detailFooter}><Button fullWidth onClick={onClose} className={s.close}>Понятно</Button></footer></div>}
