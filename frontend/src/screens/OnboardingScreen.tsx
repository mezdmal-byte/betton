import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Button } from '../components/Button/Button'
import { useI18n } from '../i18n'
import { syncTelegramBackButton } from '../telegram/webapp'
import { EventTypeInfo, type EventType } from './EventTypeInfo'
import { OnboardingArtImage as Art } from './OnboardingAssets'
import styles from './OnboardingScreen.module.css'

export type OnboardingState = 'ready' | 'splash' | 'loading' | 'auth-required' | 'auth-error'
export type OnboardingScreenProps = {
  onContinue?: () => void
  onSkip?: () => void
  state?: OnboardingState
  initialStep?: number
  onRetry?: () => void
}
export const ONBOARDING_FIGMA_FRAMES = ['291:17', '291:66', '291:109', '291:149', '291:184'] as const

const copy = {
  ru: {
    titles: [['Что такое', 'BetTON'], ['Как это', 'работает'], ['Создавайте', 'свои события'], ['Зарабатывайте', 'на своих событиях'], ['Станьте', 'гарантом']],
    descriptions: ['Прогнозируйте события и заключайте ставки напрямую с другими участниками.', 'Выберите исход и сумму ставки. Примите доступное предложение или задайте свой коэффициент.', 'Предлагайте собственные события и выбирайте, кто сможет в них участвовать.', 'Создание бесплатно. Сбор — 1% только с чистой прибыли победителя.', 'Помогайте определять результаты частных событий и получайте вознаграждение.'],
    skip: 'Пропустить', next: 'Далее', start: 'Начать', example: 'ПРИМЕР СОБЫТИЯ', match: 'Спартак — Зенит', participants: 'Два участника · разные исходы', alex: 'Алексей', maria: 'Мария', forA: 'За Спартак', forB: 'За Зенит', matchedNote: 'Ставка заключается, когда есть встречное предложение.',
    offer: 'ВАШЕ ПРЕДЛОЖЕНИЕ', outcome: 'Спартак', matching: 'Поиск встречной ставки', found: 'Нашлась', filled: ['Сделка', 'исполняется'], notFound: 'Не нашлась', waiting: ['Предложение', 'ожидает'], partial: ['Часть ставки может исполниться сразу.', 'Остаток будет ждать встречную заявку.'],
    types: ['Публичное событие', 'Частное без гаранта', 'Частное с гарантом'], typeNotes: ['Для всех после модерации', 'По ссылке · результат определяет автор', 'Окончательное решение — за гарантом'], details: 'Подробнее', free: 'Создать событие можно бесплатно',
    netProfit: 'с чистой прибыли', distribution: 'РАСПРЕДЕЛЕНИЕ СБОРА', creator: 'создателю', platform: 'платформе', feeExample: ['Если прибыль 100 TON: сбор 1 TON,', 'создателю 0,75 TON, платформе 0,25 TON.'],
    rolesTitle: 'СОЗДАТЕЛЬ И ГАРАНТ', roles: ['Создатель', 'Гарант', 'Участники'], stages: ['Согласуйте условия', 'Подтвердите результат', 'Получите вознаграждение'], stageNotes: ['Перед принятием события', 'После завершения события', 'За выполненную работу'],
  },
  en: {
    titles: [['What is', 'BetTON'], ['How it', 'works'], ['Create', 'your own events'], ['Earn from', 'your events'], ['Become', 'a guarantor']],
    descriptions: ['Predict events and place bets directly with other participants.', 'Choose an outcome and stake. Accept an available offer or set your own odds.', 'Propose your own events and choose who can participate.', 'Creation is free. The fee is 1% of the winner’s net profit only.', 'Help determine private event results and receive a reward.'],
    skip: 'Skip', next: 'Next', start: 'Start', example: 'EXAMPLE EVENT', match: 'Spartak — Zenit', participants: 'Two participants · different outcomes', alex: 'Alex', maria: 'Maria', forA: 'For Spartak', forB: 'For Zenit', matchedNote: 'A bet is matched when an opposing offer exists.',
    offer: 'YOUR OFFER', outcome: 'Spartak', matching: 'Finding an opposing bet', found: 'Match found', filled: ['The bet', 'is matched'], notFound: 'No match yet', waiting: ['The offer', 'is waiting'], partial: ['Part of your stake may match immediately.', 'The rest waits for an opposing offer.'],
    types: ['Public event', 'Private, no guarantor', 'Private with guarantor'], typeNotes: ['For everyone after moderation', 'By link · the creator determines the result', 'The guarantor makes the final decision'], details: 'Learn more', free: 'Creating an event is free',
    netProfit: 'of net profit', distribution: 'FEE DISTRIBUTION', creator: 'to the creator', platform: 'to the platform', feeExample: ['On 100 TON profit: the fee is 1 TON,', '0.75 TON to the creator, 0.25 TON to the platform.'],
    rolesTitle: 'CREATOR AND GUARANTOR', roles: ['Creator', 'Guarantor', 'Participants'], stages: ['Agree on the terms', 'Confirm the result', 'Receive a reward'], stageNotes: ['Before accepting an event', 'After the event ends', 'For your work'],
  },
  zh: {
    titles: [['什么是', 'BetTON'], ['它如何', '运作'], ['创建', '自己的事件'], ['从事件中', '获得收益'], ['成为', '担保人']],
    descriptions: ['预测事件，与其他参与者直接对赌。', '选择结果和金额。接受现有报价或设置自己的赔率。', '提出自己的事件，并选择谁可以参与。', '创建免费。仅从获胜者的净利润收取1%服务费。', '帮助确认私人事件的结果，并获得报酬。'],
    skip: '跳过', next: '下一步', start: '开始', example: '事件示例', match: '斯巴达克 — 泽尼特', participants: '两位参与者 · 不同结果', alex: '阿列克谢', maria: '玛丽亚', forA: '支持斯巴达克', forB: '支持泽尼特', matchedNote: '存在对手报价时，投注才会成交。',
    offer: '您的报价', outcome: '斯巴达克', matching: '寻找对手投注', found: '已找到', filled: ['投注', '成交'], notFound: '尚未找到', waiting: ['报价', '等待中'], partial: ['部分投注可能立即成交。', '剩余部分继续等待对手报价。'],
    types: ['公开事件', '无担保人的私人事件', '有担保人的私人事件'], typeNotes: ['审核后向所有人开放', '凭链接参与 · 创建者决定结果', '最终决定由担保人作出'], details: '了解更多', free: '创建事件免费',
    netProfit: '仅收取净利润', distribution: '服务费分配', creator: '给创建者', platform: '给平台', feeExample: ['净利润100 TON：服务费1 TON，', '创建者获得0.75 TON，平台获得0.25 TON。'],
    rolesTitle: '创建者和担保人', roles: ['创建者', '担保人', '参与者'], stages: ['协商条件', '确认结果', '获得报酬'], stageNotes: ['接受事件之前', '事件结束之后', '完成工作后'],
  },
}
type Copy = typeof copy.ru

export function OnboardingScreen({ onContinue, onSkip, state = 'ready', initialStep = 0, onRetry }: OnboardingScreenProps) {
  const { locale } = useI18n()
  const c = copy[locale]
  const [step, setStep] = useState(Math.max(0, Math.min(initialStep, 4)))
  const [detail, setDetail] = useState<EventType | null>(null)
  useEffect(() => syncTelegramBackButton(state === 'ready' && Boolean(detail || step > 0), () => {
    if (detail) setDetail(null)
    else setStep(value => Math.max(0, value - 1))
  }), [detail, state, step])
  if (state !== 'ready') return <EntryState state={state} onContinue={onContinue} onRetry={onRetry} />
  if (detail) return <EventTypeInfo kind={detail} onClose={() => setDetail(null)} />
  const title = c.titles[step]!
  return <div className={styles.screen} data-figma-frame={ONBOARDING_FIGMA_FRAMES[step]}>
    <header className={styles.header}><strong>BetTON</strong><button className={styles.skip} type="button" onClick={onSkip ?? onContinue}>{c.skip}</button></header>
    <section className={styles.intro} aria-labelledby="onboarding-title"><h1 id="onboarding-title">{title[0]}<span>{title[1]}</span></h1><p>{c.descriptions[step]}</p></section>
    <ArtViewport>
      {step === 0 ? <MatchIllustration c={c} /> : null}{step === 1 ? <MatchingIllustration c={c} /> : null}{step === 2 ? <TypesIllustration c={c} onDetail={setDetail} /> : null}{step === 3 ? <FeeIllustration c={c} /> : null}{step === 4 ? <GuarantorIllustration c={c} /> : null}
    </ArtViewport>
    <nav className={styles.progress} aria-label={locale === 'ru' ? 'Экраны знакомства' : 'Introduction pages'}>{ONBOARDING_FIGMA_FRAMES.map((frame, index) => <button type="button" key={frame} aria-label={`${index + 1} / 5`} aria-current={index === step ? 'step' : undefined} onClick={() => setStep(index)}><Art node={index === step ? '291:24' : '291:25'} width={index === step ? 9 : 7} height={index === step ? 9 : 7} /></button>)}</nav>
    <footer className={styles.footer}><Button fullWidth className={styles.next} onClick={() => { if (step < 4) setStep(step + 1); else onContinue?.() }}>{step === 4 ? c.start : `${c.next}  →`}</Button></footer>
  </div>
}

function ArtViewport({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const update = () => setScale(Math.min(1, node.clientWidth / 350))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return <div ref={ref} className={styles.artViewport} style={{ '--art-scale': scale } as CSSProperties}><div className={styles.artCanvas} data-onboarding-illustration>{children}</div></div>
}
function MatchIllustration({ c }: { c: Copy }) {
  return <div className={styles.illustration}>
    <span className={styles.example}>{c.example}</span><h2 className={styles.matchTitle}>{c.match}</h2><p className={styles.participantCaption}>{c.participants}</p>
    <Art node="291:36" width={174} height={174} className={styles.mintGlow} /><Art node="291:37" width={174} height={174} className={styles.coralGlow} />
    <Art node="291:38" width={132} height={150} className={styles.personA} /><Art node="291:47" width={132} height={150} className={styles.personB} />
    <span className={styles.exchange}><Art node="291:57" width={27} height={27} /></span>
    <div className={styles.playerA}><strong>{c.alex}</strong><span>{c.forA}</span></div><div className={styles.playerB}><strong>{c.maria}</strong><span>{c.forB}</span></div><p className={styles.matchNote}>{c.matchedNote}</p>
  </div>
}
function MatchingIllustration({ c }: { c: Copy }) {
  return <div className={styles.illustration}><span className={styles.offerLabel}>{c.offer}</span><div className={styles.inputExample}><Art node="291:83" width={26} height={26} /><div><strong>{c.outcome}</strong><span>100 TON · 1,85×</span></div></div>
    <span className={styles.matchProcess}>{c.matching}</span><span className={styles.connectorVertical} /><span className={styles.connectorHorizontal} />
    <div className={styles.matchFound}><Art node="291:93" width={24} height={24} /><strong>{c.found}</strong><span>{c.filled[0]}<br />{c.filled[1]}</span></div>
    <div className={styles.matchWaiting}><Art node="291:99" width={24} height={24} /><strong>{c.notFound}</strong><span>{c.waiting[0]}<br />{c.waiting[1]}</span></div>
    <div className={styles.partialNote}><Art node="291:105" width={21} height={21} /><p>{c.partial[0]}<br />{c.partial[1]}</p></div>
  </div>
}
function TypesIllustration({ c, onDetail }: { c: Copy; onDetail: (kind: EventType) => void }) {
  const types: EventType[] = ['public', 'private', 'guarantor']
  return <div className={styles.creationModes}>{types.map((kind, index) => <button type="button" key={kind} className={`${styles.typeCard} ${styles[kind]}`} onClick={() => onDetail(kind)}><span className={styles.typeIcon}><Art node={['291:126', '291:133', '291:139'][index]!} width={26} height={26} /></span><strong>{c.types[index]}</strong><span className={styles.typeNote}>{c.typeNotes[index]}</span><span className={styles.more}>{c.details} →</span><span className={styles.typeEdge} /></button>)}<div className={styles.free}><Art node="291:145" width={19} height={19} /><span>{c.free}</span></div></div>
}
function FeeIllustration({ c }: { c: Copy }) {
  return <div className={styles.illustration}><Art node="291:164" width={174} height={174} className={styles.feeGlow} /><div className={styles.feeCircle}><strong>1%</strong><span>{c.netProfit}</span></div><p className={styles.distributionLabel}>{c.distribution}</p><div className={styles.distribution}><span /><span /></div><div className={styles.creatorShare}><Art node="291:172" width={21} height={21} /><strong>75%</strong><span>{c.creator}</span></div><div className={styles.platformShare}><Art node="291:178" width={21} height={21} /><strong>25%</strong><span>{c.platform}</span></div><p className={styles.feeExample}>{c.feeExample[0]}<br />{c.feeExample[1]}</p></div>
}
function GuarantorIllustration({ c }: { c: Copy }) {
  return <div className={styles.illustration}><span className={styles.rolesTitle}>{c.rolesTitle}</span><div className={styles.roles}>{c.roles.map((role, index) => <div key={role}><Art node={['291:201', '291:207', '291:213'][index]!} width={60} height={60} className={styles.roleCircle} /><Art node={['291:202', '291:208', '291:214'][index]!} width={32} height={32} className={styles.roleIcon} /><strong>{role}</strong></div>)}</div><div className={styles.stages}>{c.stages.map((stage, index) => <div key={stage}><span><Art node={['291:221', '291:227', '291:234'][index]!} width={20} height={20} /></span><strong>{stage}</strong><small>{c.stageNotes[index]}</small></div>)}</div></div>
}
function EntryState({ state, onContinue, onRetry }: Pick<OnboardingScreenProps, 'state' | 'onContinue' | 'onRetry'>) {
  const title = state === 'auth-required' ? 'Откройте BetTON в Telegram' : state === 'auth-error' ? 'Не удалось войти' : 'BetTON'
  return <div className={styles.entryState}><h1>{title}</h1><p>{state === 'loading' ? 'Загружаем события…' : state === 'auth-error' ? 'Проверьте соединение и откройте Mini App заново.' : state === 'auth-required' ? 'Для ставок и личного профиля требуется подтверждённая Telegram-сессия.' : 'Ставки на события напрямую между участниками.'}</p>{state === 'auth-required' || state === 'auth-error' ? <Button fullWidth onClick={onRetry ?? onContinue}>{state === 'auth-required' ? 'Войти через Telegram' : 'Повторить'}</Button> : null}</div>
}
