import { ChevronLeft, Info } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/Button/Button'
import { Chip } from '../components/Chip/Chip'
import { DateTimeField } from '../components/DateTimeField/DateTimeField'
import { IconButton } from '../components/IconButton/IconButton'
import { TextField } from '../components/TextField/TextField'
import { defaultCreateDraft } from '../fixtures/account'
import { CREATOR_SHARE_COMPACT, CREATOR_SHARE_DETAIL } from '../lib/constants'
import type { CreateMarketDraft, VisibilityId } from '../types/account'
import styles from './CreateMarketScreen.module.css'

const CATEGORIES = [
  { id: 'sport', label: 'Спорт' },
  { id: 'politics', label: 'Политика' },
  { id: 'other', label: 'Другое' },
] as const

const VISIBILITY: Array<{ id: VisibilityId; label: string; disabled?: boolean }> = [
  { id: 'public', label: 'Публичное' },
  { id: 'unlisted', label: 'По ссылке' },
  { id: 'private', label: 'Приватное', disabled: true },
]

export type CreateMarketScreenProps = {
  draft?: CreateMarketDraft
  feeOpen?: boolean
  pickerOpen?: boolean
  onBack?: () => void
  submitDisabled?: boolean
  submitting?: boolean
  errorMessage?: string | null
  closeAtLabel?: string
  closeAtLocal?: string
  onCloseAtChange?: (localValue: string) => void
  onSubmit?: (draft: CreateMarketDraft) => void
  visibilityNote?: string | null
}

export function CreateMarketScreen({
  draft = defaultCreateDraft,
  feeOpen = false,
  pickerOpen = false,
  onBack,
  submitDisabled = false,
  submitting = false,
  errorMessage = null,
  closeAtLabel,
  closeAtLocal,
  onCloseAtChange,
  onSubmit,
  visibilityNote = 'Приватное недоступно в preview: backend принимает только public и unlisted.',
}: CreateMarketScreenProps) {
  const [question, setQuestion] = useState(draft.question)
  const [category, setCategory] = useState(draft.category)
  const [outcomeA, setOutcomeA] = useState(draft.outcomeA)
  const [outcomeB, setOutcomeB] = useState(draft.outcomeB)
  const [closeAt] = useState(draft.closeAt)
  const [visibility, setVisibility] = useState<VisibilityId>(
    draft.visibility === 'private' ? 'public' : draft.visibility,
  )
  const [description, setDescription] = useState(draft.description)
  const [feeExpanded, setFeeExpanded] = useState(feeOpen)
  const [picker, setPicker] = useState(pickerOpen)

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <IconButton label="Назад" size="md" onClick={onBack}>
          <ChevronLeft size={22} />
        </IconButton>
        <strong>Создать событие</strong>
      </header>
      <div className={styles.body}>
        <TextField
          id="create-question"
          label="Вопрос события"
          placeholder="Кто победит в матче?"
          value={question}
          multiline
          onChange={setQuestion}
        />

        <section className={styles.section}>
          <span className={styles.sectionLabel} id="create-category-label">
            Категория
          </span>
          <div className={styles.pills} role="group" aria-labelledby="create-category-label">
            {CATEGORIES.map((item) => (
              <Chip
                key={item.id}
                compact
                selected={item.id === category}
                onClick={() => setCategory(item.id)}
              >
                {item.label}
              </Chip>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <span className={styles.sectionLabel} id="create-outcomes-label">
            Исходы
          </span>
          <div className={styles.outcomes} role="group" aria-labelledby="create-outcomes-label">
            <TextField
              id="create-outcome-a"
              className={styles.outcomeA}
              aria-label="Первый исход"
              value={outcomeA}
              onChange={setOutcomeA}
            />
            <TextField
              id="create-outcome-b"
              className={styles.outcomeB}
              aria-label="Второй исход"
              value={outcomeB}
              onChange={setOutcomeB}
            />
          </div>
        </section>

        <DateTimeField
          id="create-close"
          label="Закрытие"
          value={closeAtLabel ?? closeAt}
          pickerValue={closeAtLocal}
          open={picker}
          onOpenChange={setPicker}
          onPickerChange={onCloseAtChange}
        />

        <section className={styles.section}>
          <span className={styles.sectionLabel} id="create-visibility-label">
            Видимость
          </span>
          <div className={styles.pills} role="group" aria-labelledby="create-visibility-label">
            {VISIBILITY.map((item) => (
              <Chip
                key={item.id}
                compact
                selected={item.id === visibility}
                disabled={item.disabled}
                onClick={() => {
                  if (item.disabled) return
                  setVisibility(item.id)
                }}
              >
                {item.disabled ? `${item.label} · нет` : item.label}
              </Chip>
            ))}
          </div>
          {visibilityNote ? <p className={styles.visibilityNote}>{visibilityNote}</p> : null}
        </section>

        <TextField
          id="create-description"
          label="Как разрешится"
          hint="Опишите условия так, чтобы результат можно было однозначно проверить."
          placeholder="Официальный протокол, источник и граница исхода."
          value={description}
          multiline
          onChange={setDescription}
        />

        <div className={styles.fee}>
          <div className={styles.feeRow}>
            <p id="creator-fee-compact">{CREATOR_SHARE_COMPACT}</p>
            <IconButton
              label={
                feeExpanded
                  ? 'Скрыть объяснение вознаграждения автору'
                  : 'Подробнее о вознаграждении автору'
              }
              size="md"
              aria-expanded={feeExpanded}
              aria-controls="creator-fee-detail"
              onClick={() => setFeeExpanded((current) => !current)}
            >
              <Info size={16} strokeWidth={1.8} />
            </IconButton>
          </div>
          {feeExpanded ? (
            <p id="creator-fee-detail">{CREATOR_SHARE_DETAIL}</p>
          ) : null}
        </div>
      </div>
      <div className={styles.actions}>
        {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
        <Button
          fullWidth
          disabled={submitDisabled || submitting}
          loading={submitting}
          onClick={() =>
            onSubmit?.({
              question,
              category,
              outcomeA,
              outcomeB,
              closeAt: closeAtLabel ?? closeAt,
              visibility,
              description,
            })
          }
        >
          {submitting ? 'Создаём…' : 'Создать событие'}
        </Button>
      </div>
    </div>
  )
}
