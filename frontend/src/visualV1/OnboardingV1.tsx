import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowDown, ArrowRight, ChevronRight, CircleCheck, Clock3, RefreshCw } from 'lucide-react'
import { Button } from '../components/Button/Button'
import type { OnboardingScreenProps } from '../screens/OnboardingScreen'
import type { EventTypeInfoProps, EventType } from '../screens/EventTypeInfo'
import { syncTelegramBackButton } from '../telegram/webapp'
import wordmark from '../assets/visual-v1/wordmark.svg'
import original from '../assets/visual-v1/onboarding-original.png'
import s from './OnboardingV1.module.css'

const assets = import.meta.glob('../assets/visual-v1/onboarding/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
function Art({ name, className }: { name: string; className?: string }) {
  return <img src={assets[`../assets/visual-v1/onboarding/${name}.svg`]} className={className} alt="" draggable={false}/>
}
// Measured illustration-only windows in the supplied 1704 × 923 original.
// Source bytes are unchanged. No UI copy, cards, buttons or screen are flattened.
const crops = {
  stadium: [57, 398, 334, 44], redPlayer: [57, 441, 123, 132], bluePlayer: [270, 441, 122, 132],
  spartak: [109, 582, 55, 29], zenit: [282, 580, 60, 31], offer: [514, 343, 74, 77],
  handshake: [506, 613, 91, 68], waiting: [709, 610, 72, 70],
  public: [901, 321, 83, 84], private: [901, 481, 83, 84], guarantor: [901, 641, 83, 84],
  creator: [1303, 325, 95, 95], verifier: [1435, 325, 98, 96], participants: [1558, 325, 98, 96],
  terms: [1317, 499, 63, 65], result: [1317, 597, 63, 65], reward: [1317, 699, 63, 65],
} satisfies Record<string, [number, number, number, number]>
function SourceArt({ name, className = '' }: { name: keyof typeof crops; className?: string }) {
  const [x, y, width, height] = crops[name]
  return <span aria-hidden="true" className={`${s.sourceArt} ${className}`} data-source-art={name}
    style={{ aspectRatio: `${width}/${height}`, backgroundImage: `url(${original})`, backgroundSize: `${1704 / width * 100}% auto`, backgroundPosition: `${x / (1704 - width) * 100}% ${y / (923 - height) * 100}%` } as CSSProperties}/>
}
const frames = ['828:15062', '828:15111', '828:15154', '828:15200']
const titles = [['Что такое', 'BetTON'], ['Как это', 'работает'], ['Создавайте', 'свои события'], ['Станьте', 'гарантом']]
const descriptions = ['Прогнозируйте события и заключайте ставки напрямую с другими участниками.', 'Выберите исход и сумму. Примите предложение участника или задайте свой коэффициент.', 'Создайте публичное событие или частное — с доступом по ссылке.', 'Помогайте определять результаты частных событий и получайте вознаграждение.']
export function OnboardingV1({ onContinue, onSkip, initialStep = 0 }: OnboardingScreenProps) {
  const [step, setStep] = useState(Math.min(3, Math.max(0, initialStep)))
  const [detail, setDetail] = useState<EventType | null>(null)
  const scroll = useRef<HTMLElement>(null)
  useEffect(() => syncTelegramBackButton(Boolean(detail || step), () => detail ? setDetail(null) : setStep(v => Math.max(0, v - 1))), [step, detail])
  useEffect(() => { scroll.current?.scrollTo(0, 0) }, [step, detail])
  if (detail) return <EventTypeInfoV1 kind={detail} onClose={() => setDetail(null)}/>
  return <div className={s.screen} data-figma-frame={frames[step]} data-onboarding-step={step + 1}>
    <header className={s.header}><img src={wordmark} alt="BetTON" width={101} height={32}/><button type="button" onClick={onSkip ?? onContinue}>Пропустить</button></header>
    <main className={s.body} ref={scroll}>
      <h1>{titles[step][0]}<span>{step === 0 ? <>Bet<em>TON</em></> : titles[step][1]}</span></h1>
      <p className={s.description}>{descriptions[step]}</p>
      <div className={s.illustration} data-onboarding-illustration>{step === 0 ? <Match/> : step === 1 ? <Matching/> : step === 2 ? <Types onDetail={setDetail}/> : <Guarantor/>}</div>
    </main>
    <footer className={s.footer}>
      <nav className={s.dots} aria-label="Экраны знакомства">{frames.map((id, i) => <button key={id} type="button" aria-label={`${i + 1} из 4`} aria-current={i === step ? 'step' : undefined} onClick={() => setStep(i)}><span/></button>)}</nav>
      <Button fullWidth className={s.next} onClick={() => step < 3 ? setStep(step + 1) : onContinue?.()}><span>{step === 3 ? 'Начать' : 'Далее'}</span>{step < 3 ? <ArrowRight size={20} aria-hidden="true"/> : null}</Button>
    </footer>
  </div>
}
function Note({ children }: { children: ReactNode }) { return <p className={s.note}><Art name="302a8"/><span>{children}</span></p> }
function Match() {
  return (<><section className={s.match} aria-label="Пример встречной ставки">
    <div className={s.example}><Art name="52e62"/>Пример события</div>
    <h2>Спартак — Зенит</h2><p className={s.caption}>Пример двух исходов</p>
    <div className={s.matchScene}><SourceArt name="stadium" className={s.stadium}/><SourceArt name="redPlayer" className={s.player}/><b>VS</b><SourceArt name="bluePlayer" className={s.player}/></div>
    <div className={s.outcomes}><div><SourceArt name="spartak" className={s.teamLogo}/><b>Спартак</b><strong>1,85</strong></div><div><SourceArt name="zenit" className={s.teamLogo}/><b>Зенит</b><strong>2,10</strong></div></div>
  </section><Note>Ставка заключается, когда есть встречное предложение.</Note></>
  )
}
function Matching() {
  return <section className={s.matching} aria-label="Как находится встречное предложение">
    <div className={s.offer}><SourceArt name="offer" className={s.offerAvatar}/><div className={s.offerCopy}><b>Ваше предложение</b><strong>Спартак</strong><dl><div><dt>Сумма</dt><dd>100 TON</dd></div><div><dt>Коэффициент</dt><dd>1,85×</dd></div></dl></div></div>
    <ArrowDown className={s.flowArrow} size={22} aria-hidden="true"/>
    <div className={s.process}><RefreshCw size={23} aria-hidden="true"/><b>Встречное<br/>предложение</b></div>
    <div className={s.branches}><div><ArrowDown size={20} aria-hidden="true"/><section className={s.found}><b><CircleCheck size={22} aria-hidden="true"/>Есть</b><SourceArt name="handshake" className={s.branchArt}/><span>Ставка<br/>заключена</span></section></div><div><ArrowDown size={20} aria-hidden="true"/><section className={s.waiting}><b><Clock3 size={22} aria-hidden="true"/>Пока нет</b><SourceArt name="waiting" className={s.branchArt}/><span>Предложение<br/>ожидает</span></section></div></div>
    <Note>Свой коэффициент позволяет разместить предложение на ваших условиях.</Note>
  </section>
}
const typeNames = { public: 'Публичное событие', private: 'Частное без гаранта', guarantor: 'Частное с гарантом' }
function Types({ onDetail }: { onDetail: (type: EventType) => void }) {
  return <section className={s.types}>{(['public', 'private', 'guarantor'] as const).map((kind, i) => <button type="button" key={kind} className={s.type} onClick={() => onDetail(kind)}>
    <SourceArt name={kind} className={s.typeIcon}/><span className={s.typeCopy}><b>{typeNames[kind]}</b><span>{['Для всех после модерации', 'Результат определяет автор', 'Решение принимает гарант'][i]}</span><span className={s.more}>Подробнее <ArrowRight size={15} aria-hidden="true"/></span></span><ChevronRight size={18} aria-hidden="true"/>
  </button>)}<Note>Создать событие можно бесплатно.</Note></section>
}
function Guarantor() {
  return <section className={s.guarantor} aria-label="Роль гаранта"><div className={s.roles}>
    <div><SourceArt name="creator"/><b>Создатель<br/>события</b></div><ArrowRight size={20} aria-hidden="true"/>
    <div><SourceArt name="verifier"/><b>Гарант</b></div><ArrowRight size={20} aria-hidden="true"/>
    <div><SourceArt name="participants"/><b>Участники<br/>события</b></div>
  </div><div className={s.stages}>{(['terms', 'result', 'reward'] as const).map((name, i) => <div key={name}><SourceArt name={name} className={s.stageArt}/><span><b>{['Согласуйте условия', 'Подтвердите результат', 'Получите вознаграждение'][i]}</b><small>{['Правила и вознаграждение', 'После завершения события', 'За выполненную работу'][i]}</small></span></div>)}</div></section>
}
const detailData={
 public:{frame:'977:28104',halo:'6eb87',hero:'0cb60',caption:'Для всех после модерации',icons:['52e62','8b504','e47ae','de1e3'],rows:['После одобрения модерацией\nдоступно всем пользователям.','Модерация проверяет, можно ли\nоднозначно определить исход.','Способ проверки и источник\nуказаны в условиях события.','Результат определяется\nпо опубликованным условиям.']},
 private:{frame:'977:28151',halo:'00d07',hero:'1a5a8',caption:'Участие по ссылке',icons:['04aaf','eb5e0','d9b21','7e09f'],rows:['Доступно любому участнику,\nу которого есть ссылка.','Результат подтверждает\nсоздатель события.','Ответственность за доверие\nи выбор лежит на участниках.','Перед ставкой прочитайте условия\nи убедитесь, что доверяете автору.']},
 guarantor:{frame:'977:28195',halo:'6eb87',hero:'8e0d7',caption:'Независимая проверка результата',icons:['52e62','8b504','e47ae','7b593'],rows:['Событие доступно участникам\nпо ссылке.','Итог подтверждает выбранный\nнезависимый гарант.','Условия заранее согласуются\nс гарантом до начала ставок.','Гарант получает вознаграждение\nза выполненную работу.']}
}
export function EventTypeInfoV1({kind,onClose}:EventTypeInfoProps){const d=detailData[kind];useEffect(()=>syncTelegramBackButton(true,onClose),[onClose]);return <div className={s.detailScreen} data-figma-frame={d.frame}><main className={s.detailBody}><div className={s.detailIntro}><Art name={d.halo} className={s.halo}/><Art name={d.hero} className={s.hero}/><h1>{typeNames[kind]}</h1><p>{d.caption}</p></div><ul className={s.conditions}>{d.rows.map((row,i)=><li key={row}><span><Art name={d.icons[i]!}/></span><p>{row}</p></li>)}</ul>{kind==='guarantor'?<><p className={s.final}>Решение гаранта окончательное.<br/>Участники выбирают, кому доверять.</p><div className={s.period}><p>24 часа после предполагаемого окончания</p><p>Нет решения — отмена и возврат ставок</p></div></>:null}</main><footer className={s.detailFooter}><Button fullWidth onClick={onClose} className={s.close}>Понятно</Button></footer></div>}
