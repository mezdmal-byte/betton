import { useState, type ReactNode } from 'react'
import { Button } from '../components/Button/Button'
import styles from './OnboardingScreen.module.css'

export type OnboardingState = 'ready' | 'splash' | 'loading' | 'auth-required' | 'auth-error'

export type OnboardingScreenProps = {
  onContinue?: () => void
  state?: OnboardingState
  initialStep?: number
  onRetry?: () => void
}

type Step = {
  title: string
  intro?: string
  metric?: string
  metricCaption?: string
  rows?: string[]
  cards?: Array<{ title: string; body: string }>
  notice?: string
  nextLabel?: string
}

const READY_STEPS: Step[] = [
  {
    title: 'Добро пожаловать',
    intro: 'Торгуйте исходами напрямую с другими участниками',
    rows: [
      '01  Выберите ДА или НЕТ',
      '02  Смотрите исполнимую цену',
      '03  Контролируйте открытые ордера',
    ],
    nextLabel: 'Продолжить',
  },
  {
    title: 'Это P2P',
    metric: '2 стороны',
    metricCaption: 'Позиции ДА и НЕТ сводятся между пользователями',
    rows: [
      'Вы выбираете исход и сумму',
      'Заявка встречается со встречной ценой',
      'Backend подтверждает реальное исполнение',
    ],
    nextLabel: 'Понятно',
  },
  {
    title: 'Как работает рынок',
    metric: 'ДА / НЕТ',
    metricCaption: 'Коэффициент — текущее предложение другого участника',
    rows: [
      '1 · Рынок открыт для торговли',
      '2 · Ордера исполняются полностью или частично',
      '3 · После resolution рассчитываются позиции',
    ],
    nextLabel: 'Далее',
  },
  {
    title: 'Два способа торговли',
    cards: [
      {
        title: 'QUICK TRADE · IOC',
        body: 'Исполняет доступные встречные заявки. Неисполненный остаток отменяется.',
      },
      {
        title: 'СВОЯ ЦЕНА · LIMIT',
        body: 'Вы задаёте цену. Остаток остаётся в книге и может не исполниться.',
      },
    ],
    nextLabel: 'Далее',
  },
  {
    title: 'Честная комиссия',
    metric: '1%',
    metricCaption: 'только с чистой прибыли победителя',
    notice: 'Пример: чистая прибыль 100 TON → комиссия 1 TON.',
    rows: [
      'Ставка не облагается комиссией',
      'При проигрыше сервисная комиссия — 0',
      'При возврате или void комиссия — 0',
    ],
    nextLabel: 'Далее',
  },
  {
    title: 'Готовы начать?',
    metric: 'Рынок открыт',
    metricCaption: 'Изучите цену, риск и условия resolution перед ордером.',
    notice: 'Торговля несёт риск. Исполнение зависит от встречных заявок.',
    nextLabel: 'Открыть рынки',
  },
]

export function OnboardingScreen({
  onContinue,
  state = 'ready',
  initialStep = 0,
  onRetry,
}: OnboardingScreenProps) {
  const [step, setStep] = useState(
    Math.max(0, Math.min(initialStep, READY_STEPS.length - 1)),
  )

  if (state === 'splash') {
    return (
      <EntryShell title="BetTON" context="P2P РЫНОК ПРОГНОЗОВ">
        <Metric value="BetTON" caption="Рынок говорит цифрами. Быстро, честно, без казино." />
        <Notice>CORE onboarding · текущая часть продукта</Notice>
      </EntryShell>
    )
  }

  if (state === 'loading') {
    return (
      <EntryShell title="BetTON">
        <Metric value="P2P" caption="Рынок прогнозов на TON" />
        <Rows
          rows={[
            '01  Загружаем публичные рынки…',
            '02  Проверяем Telegram-сессию',
            '03  Баланс не изменяется оптимистично',
          ]}
        />
      </EntryShell>
    )
  }

  if (state === 'auth-required') {
    return (
      <EntryShell title="Нужен Telegram">
        <Metric
          value="Авторизация"
          caption="Чтобы торговать и видеть свои ордера, подтвердите Telegram-сессию."
        />
        <Rows
          rows={[
            'Публичные рынки доступны без входа',
            'Торговля требует подтверждённого профиля',
          ]}
        />
        <Button fullWidth onClick={onRetry ?? onContinue}>
          Войти через Telegram
        </Button>
      </EntryShell>
    )
  }

  if (state === 'auth-error') {
    return (
      <EntryShell title="Не удалось войти">
        <Metric
          value="Сессия отклонена"
          caption="Telegram не подтвердил авторизацию. Средства и ордера не изменены."
        />
        <Notice>Проверьте соединение и откройте Mini App заново.</Notice>
        {onRetry ? <Button fullWidth onClick={onRetry}>Повторить</Button> : null}
      </EntryShell>
    )
  }

  const current = READY_STEPS[step]!

  return (
    <EntryShell title={current.title}>
      {current.metric ? (
        <Metric value={current.metric} caption={current.metricCaption ?? ''} />
      ) : null}

      {current.intro ? <p className={styles.intro}>{current.intro}</p> : null}

      {current.cards ? (
        <div className={styles.cards}>
          {current.cards.map((card) => (
            <section key={card.title} className={styles.card}>
              <strong>{card.title}</strong>
              <p>{card.body}</p>
            </section>
          ))}
        </div>
      ) : null}

      {current.notice ? <Notice>{current.notice}</Notice> : null}
      {current.rows ? <Rows rows={current.rows} /> : null}

      <div className={styles.actions}>
        {step > 0 ? (
          <Button variant="secondary" onClick={() => setStep((value) => value - 1)}>
            Назад
          </Button>
        ) : null}
        <Button
          fullWidth={step === 0}
          onClick={() => {
            if (step < READY_STEPS.length - 1) {
              setStep((value) => value + 1)
            } else {
              onContinue?.()
            }
          }}
        >
          {current.nextLabel ?? 'Далее'}
        </Button>
      </div>
    </EntryShell>
  )
}

function EntryShell({
  title,
  context,
  children,
}: {
  title: string
  context?: string
  children: ReactNode
}) {
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1>{title}</h1>
        {context ? <p>{context}</p> : null}
      </header>
      <main className={styles.body}>{children}</main>
    </div>
  )
}

function Metric({ value, caption }: { value: string; caption: string }) {
  return (
    <section className={styles.metric}>
      <strong>{value}</strong>
      <p>{caption}</p>
    </section>
  )
}

function Rows({ rows }: { rows: string[] }) {
  return (
    <section className={styles.rows}>
      {rows.map((row) => <div key={row}>{row}</div>)}
    </section>
  )
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <section className={styles.notice}>
      <strong>!</strong>
      <p>{children}</p>
    </section>
  )
}
