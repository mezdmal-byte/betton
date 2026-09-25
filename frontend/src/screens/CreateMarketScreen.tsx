import { CircleHelp } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { Button } from '../components/Button/Button'
import { Chip } from '../components/Chip/Chip'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { TextField } from '../components/TextField/TextField'
import { ThemeToggle } from '../components/ThemeToggle/ThemeToggle'
import { defaultCreateDraft } from '../fixtures/account'
import { useT } from '../i18n'
import type { CreateMarketDraft, VisibilityId } from '../types/account'
import styles from './CreateMarketScreen.module.css'

type WizardStep =
  | 'start'
  | 'question'
  | 'description'
  | 'criteria'
  | 'sources'
  | 'category'
  | 'close'
  | 'visibility'
  | 'review'
  | 'validation'

const FLOW_STEPS: Exclude<WizardStep, 'start' | 'validation'>[] = [
  'question',
  'description',
  'criteria',
  'sources',
  'category',
  'close',
  'visibility',
  'review',
]

export type CreateMarketScreenProps = {
  draft?: CreateMarketDraft
  feeOpen?: boolean
  pickerOpen?: boolean
  onBack?: () => void
  onNavChange?: (id: NavId) => void
  submitDisabled?: boolean
  submitting?: boolean
  errorMessage?: string | null
  closeAtLabel?: string
  closeAtLocal?: string
  onCloseAtChange?: (localValue: string) => void
  onSubmit?: (draft: CreateMarketDraft) => void
  visibilityNote?: string | null
  unauthenticated?: boolean
}

export function CreateMarketScreen({
  draft = defaultCreateDraft,
  onBack,
  onNavChange,
  submitDisabled = false,
  submitting = false,
  errorMessage = null,
  closeAtLabel,
  closeAtLocal = '',
  onCloseAtChange,
  onSubmit,
  visibilityNote,
  unauthenticated = false,
}: CreateMarketScreenProps) {
  const t = useT()
  const [step, setStep] = useState<WizardStep>('start')
  const [question, setQuestion] = useState(draft.question)
  const [description, setDescription] = useState(draft.description)
  const [resolutionCriteria, setResolutionCriteria] = useState('')
  const [primarySource, setPrimarySource] = useState('')
  const [additionalSource, setAdditionalSource] = useState('')
  const [category, setCategory] = useState(draft.category)
  const [outcomeA, setOutcomeA] = useState(draft.outcomeA)
  const [outcomeB, setOutcomeB] = useState(draft.outcomeB)
  const [visibility, setVisibility] = useState<VisibilityId>(
    draft.visibility === 'private' ? 'unlisted' : draft.visibility,
  )
  const [confirming, setConfirming] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const categories = [
    { id: 'sport', label: t('cat.sport') },
    { id: 'politics', label: t('cat.politics') },
    { id: 'crypto', label: t('cat.crypto') },
    { id: 'other', label: t('cat.other') },
  ]

  const currentIndex = FLOW_STEPS.indexOf(step as Exclude<WizardStep, 'start' | 'validation'>)
  const logicalStep = currentIndex >= 0 ? currentIndex + 1 : 8
  const progress = Math.max(0, Math.min(100, (logicalStep / FLOW_STEPS.length) * 100))

  const closeDate = closeAtLocal ? closeAtLocal.slice(0, 10) : ''
  const closeTime = closeAtLocal ? closeAtLocal.slice(11, 16) : ''

  const composedDescription = useMemo(() => {
    const bits = [
      description.trim(),
      resolutionCriteria.trim() ? 'Критерии результата: ' + resolutionCriteria.trim() : '',
      primarySource.trim() ? 'Основной источник: ' + primarySource.trim() : '',
      additionalSource.trim() ? 'Дополнительный источник: ' + additionalSource.trim() : '',
    ].filter(Boolean)
    return bits.join('\n\n')
  }, [additionalSource, description, primarySource, resolutionCriteria])

  const goBack = () => {
    if (step === 'start') {
      onBack?.()
      return
    }
    if (step === 'validation') {
      setStep('review')
      return
    }
    if (step === 'question') {
      setStep('start')
      return
    }
    const index = FLOW_STEPS.indexOf(step as Exclude<WizardStep, 'start' | 'validation'>)
    if (index > 0) setStep(FLOW_STEPS[index - 1]!)
  }

  const goNext = () => {
    const index = FLOW_STEPS.indexOf(step as Exclude<WizardStep, 'start' | 'validation'>)
    if (index >= 0 && index < FLOW_STEPS.length - 1) {
      setConfirming(false)
      setStep(FLOW_STEPS[index + 1]!)
    }
  }

  const validate = () => {
    const errors: string[] = []
    const q = question.trim()
    const a = outcomeA.trim()
    const b = outcomeB.trim()
    if (q.length < 8 || q.length > 512) errors.push('Вопрос должен содержать 8–512 символов')
    if (!a || !b || a.toLowerCase() === b.toLowerCase()) errors.push('Должно быть ровно два разных исхода')
    if (closeAtLocal && new Date(closeAtLocal).getTime() <= Date.now()) errors.push('Дедлайн должен быть в будущем')
    if (!primarySource.trim()) errors.push('Основной источник обязателен')
    setValidationErrors(errors)
    if (errors.length > 0) {
      setConfirming(false)
      setStep('validation')
      return false
    }
    return true
  }

  const submit = () => {
    if (!validate()) return
    onSubmit?.({
      question: question.trim(),
      category,
      outcomeA: outcomeA.trim(),
      outcomeB: outcomeB.trim(),
      closeAt: closeAtLabel ?? draft.closeAt,
      visibility,
      description: composedDescription,
    })
  }

  if (step === 'start') {
    return (
      <div className={styles.screen}>
        <header className={styles.startHeader}>
          <div className={styles.contextRow}>
            <button type="button" className={styles.backText} onClick={onBack}>← Назад</button>
            <Brand />
          </div>
          <div className={styles.titleRow}><h1>Создать рынок</h1></div>
          <ThemeToggle className={styles.themeToggle} />
        </header>

        <main className={styles.body}>
          <strong className={styles.eyebrow}>P2P PREDICTION MARKET</strong>
          <p className={styles.intro}>
            Сформулируйте проверяемый вопрос, задайте ровно два исхода и источник результата.
          </p>
          <Details
            rows={[
              '8 шагов · около 3 минут',
              'Комиссия создания · 0 TON',
              'Рынок нельзя изменить после открытия',
            ]}
            accentFirst
          />
          <Notice>
            Публичные рынки проходят модерацию. Unlisted доступны только по точной ссылке.
          </Notice>
          {unauthenticated ? (
            <StatusMessage tone="warning" title={t('err.openInTg')}>
              {t('err.openInTgBody')}
            </StatusMessage>
          ) : null}
          <Button fullWidth disabled={unauthenticated} onClick={() => setStep('question')}>
            Начать
          </Button>
        </main>

        <BottomNavigation active="create" onChange={onNavChange} />
      </div>
    )
  }

  if (step === 'validation') {
    return (
      <WizardShell
        title="Нужно исправить"
        step={8}
        danger
        onBack={goBack}
        onNavChange={onNavChange}
      >
        <Details rows={validationErrors.length > 0 ? validationErrors : ['Проверьте обязательные поля']} dangerFirst />
        <Notice danger>Исправьте отмеченные поля и повторите отправку.</Notice>
        <Button fullWidth onClick={() => setStep('question')}>Исправить ошибки</Button>
      </WizardShell>
    )
  }

  const title = stepTitle(step)

  return (
    <WizardShell
      title={confirming && step === 'review' ? 'Подтверждение' : title}
      step={logicalStep}
      progress={progress}
      onBack={goBack}
      onNavChange={onNavChange}
    >
      {step === 'question' ? (
        <>
          <p className={styles.intro}>Событие должно допускать однозначный ответ.</p>
          <TextField
            id="create-question"
            label="Вопрос рынка"
            placeholder="BTC будет выше $150 000 к концу 2026 года?"
            value={question}
            multiline
            onChange={setQuestion}
          />
          <span className={styles.counter}>{question.length} / 512</span>
          <div className={styles.twoColumns}>
            <TextField id="create-outcome-a" label="Исход 1" value={outcomeA} onChange={setOutcomeA} />
            <TextField id="create-outcome-b" label="Исход 2" value={outcomeB} onChange={setOutcomeB} />
          </div>
          <Button fullWidth onClick={goNext}>Далее</Button>
        </>
      ) : null}

      {step === 'description' ? (
        <>
          <p className={styles.intro}>Коротко объясните, что именно проверяет рынок.</p>
          <TextField
            id="create-description"
            label="Описание"
            placeholder="Контекст события без двусмысленности"
            value={description}
            multiline
            onChange={setDescription}
          />
          <Notice>Не дублируйте критерии результата — они будут на следующем шаге.</Notice>
          <Button fullWidth onClick={goNext}>Далее</Button>
        </>
      ) : null}

      {step === 'criteria' ? (
        <>
          <p className={styles.intro}>Опишите условие, по которому исход можно определить без спора.</p>
          <TextField
            id="create-resolution"
            label="Критерии результата"
            placeholder="Как именно определяется победивший исход?"
            value={resolutionCriteria}
            multiline
            onChange={setResolutionCriteria}
          />
          <Notice>Критерии должны быть известны участникам до открытия рынка.</Notice>
          <Button fullWidth onClick={goNext}>Далее</Button>
        </>
      ) : null}

      {step === 'sources' ? (
        <>
          <p className={styles.intro}>Укажите источник, по которому будет проверяться результат.</p>
          <TextField
            id="create-primary-source"
            label="Основной источник"
            placeholder="Официальный сайт, API, документ или публикация"
            value={primarySource}
            onChange={setPrimarySource}
          />
          <TextField
            id="create-additional-source"
            label="Дополнительный источник · необязательно"
            placeholder="Резервный источник"
            value={additionalSource}
            onChange={setAdditionalSource}
          />
          <Button fullWidth onClick={goNext}>Далее</Button>
        </>
      ) : null}

      {step === 'category' ? (
        <>
          <p className={styles.intro}>Категория помогает найти рынок в ленте.</p>
          <div className={styles.choiceGrid}>
            {categories.map((item) => (
              <Chip
                key={item.id}
                selected={item.id === category}
                onClick={() => setCategory(item.id)}
              >
                {item.label}
              </Chip>
            ))}
          </div>
          <Button fullWidth onClick={goNext}>Далее</Button>
        </>
      ) : null}

      {step === 'close' ? (
        <>
          <p className={styles.intro}>После дедлайна новые заявки приниматься не будут.</p>
          <div className={styles.dateGrid}>
            <label>
              <span>Дата закрытия</span>
              <input
                type="date"
                value={closeDate}
                onChange={(event) => {
                  const date = event.target.value
                  if (!date) return
                  onCloseAtChange?.(date + 'T' + (closeTime || '12:00'))
                }}
              />
            </label>
            <label>
              <span>Время</span>
              <input
                type="time"
                value={closeTime}
                onChange={(event) => {
                  const time = event.target.value
                  if (!time || !closeDate) return
                  onCloseAtChange?.(closeDate + 'T' + time)
                }}
              />
            </label>
          </div>
          <Details rows={[closeAtLabel ? 'Закрытие · ' + closeAtLabel : 'Выберите дату и время']} accentFirst />
          <Button fullWidth onClick={goNext}>Далее</Button>
        </>
      ) : null}

      {step === 'visibility' ? (
        <>
          <p className={styles.intro}>Выберите, где будет доступен рынок после создания.</p>
          <div className={styles.visibilityGrid}>
            <button
              type="button"
              className={visibility === 'public' ? styles.selectedCard : styles.choiceCard}
              onClick={() => setVisibility('public')}
            >
              <strong>Public</strong>
              <span>Показывается в поиске, категориях и публичной ленте.</span>
            </button>
            <button
              type="button"
              className={visibility === 'unlisted' ? styles.selectedCard : styles.choiceCard}
              onClick={() => setVisibility('unlisted')}
            >
              <strong>Unlisted</strong>
              <span>Доступен только по точной ссылке.</span>
            </button>
          </div>
          <Notice>
            {visibilityNote ??
              (visibility === 'unlisted'
                ? t('create.visibilityHintUnlisted')
                : t('create.visibilityHintPublic'))}
          </Notice>
          <Button fullWidth onClick={goNext}>Далее</Button>
        </>
      ) : null}

      {step === 'review' && !confirming ? (
        <>
          <p className={styles.intro}>Проверьте всё до отправки. После открытия рынок нельзя изменить.</p>
          <Details
            rows={[
              question || 'Вопрос не указан',
              outcomeA + ' / ' + outcomeB,
              categoryLabel(category, t),
              closeAtLabel ? 'Закрытие · ' + closeAtLabel : 'Дедлайн не указан',
              visibility === 'unlisted' ? 'Unlisted' : 'Public',
              primarySource ? 'Источник · ' + primarySource : 'Источник не указан',
            ]}
            accentFirst
          />
          {errorMessage ? <Notice danger>{errorMessage}</Notice> : null}
          <Button
            fullWidth
            disabled={submitDisabled}
            onClick={() => {
              if (validate()) setConfirming(true)
            }}
          >
            Отправить на создание
          </Button>
        </>
      ) : null}

      {step === 'review' && confirming ? (
        <>
          <section className={styles.primaryMetric}>
            <strong>{visibility === 'unlisted' ? 'Unlisted' : 'Public'}</strong>
            <span>рынок будет создан с этими параметрами</span>
          </section>
          <Details rows={[question, outcomeA + ' / ' + outcomeB, closeAtLabel ?? 'Дедлайн']} />
          <Notice>Подтвердите отправку. После создания изменить условия рынка нельзя.</Notice>
          {errorMessage ? <Notice danger>{errorMessage}</Notice> : null}
          <Button
            fullWidth
            loading={submitting}
            disabled={submitDisabled || submitting}
            onClick={submit}
          >
            {submitting ? 'Создаём рынок…' : 'Подтвердить отправку'}
          </Button>
          <Button variant="secondary" fullWidth disabled={submitting} onClick={() => setConfirming(false)}>
            Вернуться к проверке
          </Button>
        </>
      ) : null}
    </WizardShell>
  )
}

function WizardShell({
  title,
  step,
  progress = (step / 8) * 100,
  danger = false,
  onBack,
  onNavChange,
  children,
}: {
  title: string
  step: number
  progress?: number
  danger?: boolean
  onBack: () => void
  onNavChange?: (id: NavId) => void
  children: ReactNode
}) {
  return (
    <div className={styles.screen}>
      <header className={styles.wizardHeader}>
        <div className={styles.contextRow}>
          <button type="button" className={styles.backText} onClick={onBack}>← Назад</button>
          <Brand />
        </div>
        <div className={styles.titleRow}><h1>{title}</h1></div>
        <div className={styles.progress}>
          <div className={styles.progressLabels}>
            <strong className={danger ? styles.dangerText : undefined}>Шаг {step} из 8</strong>
            <span>До отправки можно изменить</span>
          </div>
          <div className={styles.progressTrack}>
            <i
              className={danger ? styles.progressDanger : undefined}
              style={{ width: String(progress) + '%' }}
            />
          </div>
        </div>
      </header>
      <main className={styles.body}>{children}</main>
      <BottomNavigation active="create" onChange={onNavChange} />
    </div>
  )
}

function Brand() {
  return <span className={styles.brand}><b>Bet</b><b>TON</b></span>
}

function Notice({
  children,
  danger = false,
}: {
  children: ReactNode
  danger?: boolean
}) {
  return (
    <section className={danger ? styles.noticeDanger : styles.notice}>
      <CircleHelp size={16} strokeWidth={1.7} aria-hidden="true" />
      <p>{children}</p>
    </section>
  )
}

function Details({
  rows,
  accentFirst = false,
  dangerFirst = false,
}: {
  rows: string[]
  accentFirst?: boolean
  dangerFirst?: boolean
}) {
  return (
    <section className={styles.details}>
      {rows.map((row, index) => (
        <div
          key={String(index) + row}
          className={
            index === 0 && dangerFirst
              ? styles.detailDanger
              : index === 0 && accentFirst
                ? styles.detailAccent
                : undefined
          }
        >
          {row || '—'}
        </div>
      ))}
    </section>
  )
}

function stepTitle(step: WizardStep): string {
  if (step === 'question') return 'Вопрос рынка'
  if (step === 'description') return 'Описание'
  if (step === 'criteria') return 'Критерии результата'
  if (step === 'sources') return 'Источник результата'
  if (step === 'category') return 'Категория'
  if (step === 'close') return 'Закрытие торговли'
  if (step === 'visibility') return 'Public или Unlisted'
  return 'Проверка рынка'
}

function categoryLabel(category: string, t: ReturnType<typeof useT>): string {
  if (category === 'sport') return t('cat.sport')
  if (category === 'politics') return t('cat.politics')
  if (category === 'crypto') return t('cat.crypto')
  return t('cat.other')
}
