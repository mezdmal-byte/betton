import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/Button/Button'
import { Chip } from '../components/Chip/Chip'
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

const VISIBILITY: Array<{ id: VisibilityId; label: string }> = [
  { id: 'public', label: 'Публичное' },
  { id: 'unlisted', label: 'По ссылке' },
  { id: 'private', label: 'Приватное' },
]

export type CreateMarketScreenProps = {
  draft?: CreateMarketDraft
}

export function CreateMarketScreen({ draft = defaultCreateDraft }: CreateMarketScreenProps) {
  const [question, setQuestion] = useState(draft.question)
  const [category, setCategory] = useState(draft.category)
  const [outcomeA, setOutcomeA] = useState(draft.outcomeA)
  const [outcomeB, setOutcomeB] = useState(draft.outcomeB)
  const [closeAt, setCloseAt] = useState(draft.closeAt)
  const [visibility, setVisibility] = useState<VisibilityId>(draft.visibility)
  const [description, setDescription] = useState(draft.description)

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <IconButton label="Назад" size="md">
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
          <span className={styles.sectionLabel}>Категория</span>
          <div className={styles.pills} role="group" aria-label="Категория">
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
          <span className={styles.sectionLabel}>Исходы</span>
          <div className={styles.outcomes}>
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

        <TextField
          id="create-close"
          label="Закрытие"
          value={closeAt}
          onChange={setCloseAt}
        />

        <section className={styles.section}>
          <span className={styles.sectionLabel}>Видимость</span>
          <div className={styles.pills} role="group" aria-label="Видимость">
            {VISIBILITY.map((item) => (
              <Chip
                key={item.id}
                compact
                selected={item.id === visibility}
                onClick={() => setVisibility(item.id)}
              >
                {item.label}
              </Chip>
            ))}
          </div>
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
          <p>{CREATOR_SHARE_COMPACT}</p>
          <p>{CREATOR_SHARE_DETAIL}</p>
        </div>
      </div>
      <div className={styles.actions}>
        <Button fullWidth>Создать событие</Button>
      </div>
    </div>
  )
}
