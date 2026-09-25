import { ChevronLeft, CircleHelp, Info } from 'lucide-react'
import { useState } from 'react'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { Button } from '../components/Button/Button'
import { Chip } from '../components/Chip/Chip'
import { DateTimeField } from '../components/DateTimeField/DateTimeField'
import { IconButton } from '../components/IconButton/IconButton'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { TextField } from '../components/TextField/TextField'
import { ThemeToggle } from '../components/ThemeToggle/ThemeToggle'
import { defaultCreateDraft } from '../fixtures/account'
import { useT } from '../i18n'
import type { CreateMarketDraft, VisibilityId } from '../types/account'
import styles from './CreateMarketScreen.module.css'

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
  feeOpen = false,
  pickerOpen = false,
  onBack,
  onNavChange,
  submitDisabled = false,
  submitting = false,
  errorMessage = null,
  closeAtLabel,
  closeAtLocal,
  onCloseAtChange,
  onSubmit,
  visibilityNote,
  unauthenticated = false,
}: CreateMarketScreenProps) {
  const t = useT()
  const [step, setStep] = useState<'start' | 'form'>('start')
  const [question, setQuestion] = useState(draft.question)
  const [category, setCategory] = useState(draft.category)
  const [outcomeA, setOutcomeA] = useState(draft.outcomeA)
  const [outcomeB, setOutcomeB] = useState(draft.outcomeB)
  const [closeAt] = useState(draft.closeAt)
  const [visibility, setVisibility] = useState<VisibilityId>(
    draft.visibility === 'private' ? 'unlisted' : draft.visibility,
  )
  const [description, setDescription] = useState(draft.description)
  const [feeExpanded, setFeeExpanded] = useState(feeOpen)
  const [picker, setPicker] = useState(pickerOpen)

  const categories = [
    { id: 'sport', label: t('cat.sport') },
    { id: 'politics', label: t('cat.politics') },
    { id: 'crypto', label: t('cat.crypto') },
    { id: 'other', label: t('cat.other') },
  ]
  const visibilityOptions: Array<{ id: 'public' | 'unlisted'; label: string }> = [
    { id: 'public', label: t('create.public') },
    { id: 'unlisted', label: t('create.unlisted') },
  ]
  const note =
    visibilityNote ??
    (visibility === 'unlisted' ? t('create.visibilityHintUnlisted') : t('create.visibilityHintPublic'))

  if (step === 'start') {
    return (
      <div className={styles.screen}>
        <header className={styles.startHeader}>
          <div className={styles.contextRow}>
            <button type="button" className={styles.backText} onClick={onBack}>← Назад</button>
            <span className={styles.brand}><b>Bet</b><b>TON</b></span>
          </div>
          <div className={styles.startTitleRow}>
            <h1>Создать рынок</h1>
          </div>
          <ThemeToggle className={styles.themeToggle} />
        </header>

        <main className={styles.startBody}>
          <strong className={styles.eyebrow}>P2P PREDICTION MARKET</strong>
          <p className={styles.startIntro}>
            Сформулируйте проверяемый вопрос, задайте ровно два исхода и источник результата.
          </p>

          <section className={styles.startDetails}>
            <div><span>8 шагов · около 3 минут</span></div>
            <div><span>Комиссия создания · 0 TON</span></div>
            <div><span>Рынок нельзя изменить после открытия</span></div>
          </section>

          <section className={styles.notice}>
            <CircleHelp size={16} strokeWidth={1.7} aria-hidden="true" />
            <p>Публичные рынки проходят модерацию. Unlisted доступны только по точной ссылке.</p>
          </section>

          {unauthenticated ? (
            <StatusMessage tone="warning" title={t('err.openInTg')}>
              {t('err.openInTgBody')}
            </StatusMessage>
          ) : null}

          <Button
            fullWidth
            disabled={unauthenticated}
            onClick={() => setStep('form')}
          >
            Начать
          </Button>
        </main>

        <BottomNavigation active="create" onChange={onNavChange} />
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      <header className={styles.formHeader}>
        <IconButton label={t('back')} size="md" onClick={() => setStep('start')}>
          <ChevronLeft size={22} />
        </IconButton>
        <strong>{t('create.title')}</strong>
      </header>

      <div className={styles.body}>
        {unauthenticated ? <StatusMessage tone="warning" title={t('err.openInTg')}>{t('err.openInTgBody')}</StatusMessage> : null}
        <div className={styles.questionBlock}>
          <TextField
            id="create-question"
            label={t('create.question')}
            placeholder={t('create.questionPh')}
            value={question}
            multiline
            onChange={setQuestion}
          />
          <span className={styles.counter}>{question.length}/512</span>
        </div>

        <section className={styles.section}>
          <span className={styles.sectionLabel} id="create-category-label">
            {t('create.category')}
          </span>
          <div className={styles.pills} role="group" aria-labelledby="create-category-label">
            {categories.map((item) => (
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
            {t('create.outcomes')}
          </span>
          <div className={styles.outcomes} role="group" aria-labelledby="create-outcomes-label">
            <TextField
              id="create-outcome-a"
              className={styles.outcomeA}
              aria-label={t('create.outcomeA')}
              value={outcomeA}
              onChange={setOutcomeA}
            />
            <TextField
              id="create-outcome-b"
              className={styles.outcomeB}
              aria-label={t('create.outcomeB')}
              value={outcomeB}
              onChange={setOutcomeB}
            />
          </div>
        </section>

        <DateTimeField
          id="create-close"
          label={t('create.close')}
          value={closeAtLabel ?? closeAt}
          pickerValue={closeAtLocal}
          open={picker}
          onOpenChange={setPicker}
          onPickerChange={onCloseAtChange}
        />

        <section className={styles.section}>
          <span className={styles.sectionLabel} id="create-visibility-label">
            {t('create.visibility')}
          </span>
          <div className={styles.pills} role="group" aria-labelledby="create-visibility-label">
            {visibilityOptions.map((item) => (
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
          {note ? <p className={styles.visibilityNote}>{note}</p> : null}
        </section>

        <TextField
          id="create-description"
          label={t('create.howResolve')}
          hint={t('create.howResolveHint')}
          placeholder={t('create.howResolvePh')}
          value={description}
          multiline
          onChange={setDescription}
        />

        <div className={styles.fee}>
          <div className={styles.feeRow}>
            <Info size={16} strokeWidth={1.8} aria-hidden="true" />
            <p id="creator-fee-compact">{t('create.feesFee')}</p>
            <IconButton
              label={feeExpanded ? t('create.feesHide') : t('create.feesShow')}
              size="md"
              aria-expanded={feeExpanded}
              aria-controls="creator-fee-detail"
              onClick={() => setFeeExpanded((current) => !current)}
            >
              <Info size={15} strokeWidth={1.8} />
            </IconButton>
          </div>
          {feeExpanded ? (
            <div id="creator-fee-detail" className={styles.feeDetail}>
              <p>{t('create.feesP2p')}</p>
              <p>{t('create.moderationNote')}</p>
            </div>
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
          {submitting
            ? t('create.submitting')
            : visibility === 'unlisted'
              ? t('create.submitUnlisted')
              : t('create.submit')}
        </Button>
      </div>

      <BottomNavigation active="create" onChange={onNavChange} />
    </div>
  )
}
