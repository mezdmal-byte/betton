import { useState } from 'react'
import { Button } from '../components/Button/Button'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { useT } from '../i18n'
import styles from './OnboardingScreen.module.css'

export type OnboardingState = 'ready' | 'loading' | 'auth-required' | 'auth-error'
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
  notice?: string
}

export function OnboardingScreen({
  onContinue,
  state = 'ready',
  initialStep = 0,
  onRetry,
}: OnboardingScreenProps) {
  const t = useT()
  const [step, setStep] = useState(Math.max(0, Math.min(initialStep, 5)))

  if (state !== 'ready') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}><h1>{state === 'loading' ? 'BetTON' : state === 'auth-required' ? 'Нужен вход' : 'Не удалось войти'}</h1></header>
        <main className={styles.body}>
          {state === 'loading' ? (
            <StatusMessage tone="loading" title={t('loading')}>{t('loading.body')}</StatusMessage>
          ) : state === 'auth-required' ? (
            <>
              <section className={styles.stateCard}>Авторизуйтесь через Telegram, чтобы продолжить.</section>
              <Button fullWidth onClick={onRetry ?? onContinue}>Войти через Telegram</Button>
            </>
          ) : (
            <>
              <StatusMessage tone="error" title="Ошибка Telegram авторизации">
                Проверьте, что Mini App открыт из Telegram, и повторите попытку.
              </StatusMessage>
              {onRetry ? <Button fullWidth onClick={onRetry}>{t('retry')}</Button> : null}
            </>
          )}
        </main>
      </div>
    )
  }

  const steps: Step[] = [
    {
      title: 'Добро пожаловать',
      intro: 'Торгуйте исходами напрямую с другими участниками',
      rows: ['01  Выберите ДА или НЕТ', '02  Смотрите исполнимую цену', '03  Контролируйте открытые ордера'],
    },
    {
      title: 'P2P без букмекера',
      intro: 'Цена формируется встречными заявками участников, а не задаётся платформой.',
      rows: ['Вы видите реальную доступную цену', 'Сделка появляется только при встрече заявок', 'Открытые остатки можно отменить'],
    },
    {
      title: 'Как устроен рынок',
      intro: 'У каждого рынка ровно два исхода и заранее заданные критерии результата.',
      rows: ['Проверьте критерии', 'Проверьте источник', 'Смотрите дату закрытия торговли'],
    },
    {
      title: 'Quick Trade или своя цена',
      notice: 'Всегда проверяйте итоговую цену перед подтверждением.',
      rows: ['QUICK TRADE · IOC — исполнение сразу, остаток отменяется', 'СВОЯ ЦЕНА · LIMIT — остаток ждёт встречную заявку'],
    },
    {
      title: 'Комиссия',
      intro: t('help.fee'),
      rows: ['Комиссия учитывается только в предусмотренных правилами случаях', 'Условия видны до подтверждения действия'],
    },
    {
      title: 'Готовы начать?',
      metric: 'Рынок открыт',
      metricCaption: 'Изучите цену, риск и условия resolution перед ордером.',
      notice: 'Торговля несёт риск. Исполнение зависит от встречных заявок.',
    },
  ]
  const current = steps[step]

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1>{current.title}</h1>
        <span>{String(step + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span>
      </header>

      <main className={styles.body}>
        {current.metric ? (
          <section className={styles.metric}>
            <strong>{current.metric}</strong>
            <p>{current.metricCaption}</p>
          </section>
        ) : null}

        {current.intro ? <p className={styles.intro}>{current.intro}</p> : null}

        {current.rows ? (
          <section className={styles.rows}>
            {current.rows.map((row) => <div key={row}>{row}</div>)}
          </section>
        ) : null}

        {current.notice ? (
          <section className={styles.notice}>
            <strong>!</strong>
            <p>{current.notice}</p>
          </section>
        ) : null}

        <div className={styles.actions}>
          {step > 0 ? <Button variant="secondary" onClick={() => setStep((value) => value - 1)}>Назад</Button> : null}
          <Button
            fullWidth={step === 0}
            onClick={() => {
              if (step < steps.length - 1) setStep((value) => value + 1)
              else onContinue?.()
            }}
          >
            {step === steps.length - 1 ? 'Открыть рынки' : 'Продолжить'}
          </Button>
        </div>
      </main>
    </div>
  )
}
