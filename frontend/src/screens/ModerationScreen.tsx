import { useMemo, useState, type ReactNode } from 'react'
import { Button } from '../components/Button/Button'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { TextField } from '../components/TextField/TextField'
import { useT } from '../i18n'
import type { MarketFixture } from '../types/market'
import styles from './ModerationScreen.module.css'

export type ModerationViewState = 'ready' | 'loading' | 'error' | 'no-access'
export type ModerationErrorKind = 'failure' | 'conflict'

type ReviewStep =
  | 'queue'
  | 'review'
  | 'criteria'
  | 'source'
  | 'decision'
  | 'approve'
  | 'approve-confirm'
  | 'reject'
  | 'reject-reason'

export type ModerationScreenProps = {
  markets?: MarketFixture[]
  viewState?: ModerationViewState
  reasonById?: Record<number, string>
  busyMarketId?: number | null
  errorMessage?: string | null
  errorKind?: ModerationErrorKind
  successMessage?: string | null
  onBack?: () => void
  onApprove?: (marketId: number) => void
  onReject?: (marketId: number, reason: string) => void
  onReasonChange?: (marketId: number, reason: string) => void
  onRetry?: () => void
  onDismissSuccess?: () => void
}

export function ModerationScreen({
  markets = [],
  viewState = 'ready',
  reasonById = {},
  busyMarketId = null,
  errorMessage,
  errorKind = 'failure',
  successMessage,
  onBack,
  onApprove,
  onReject,
  onReasonChange,
  onRetry,
  onDismissSuccess,
}: ModerationScreenProps) {
  const t = useT()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [step, setStep] = useState<ReviewStep>('queue')
  const selected = useMemo(
    () => markets.find((market) => Number(market.id) === selectedId) ?? null,
    [markets, selectedId],
  )
  const busy = selected ? busyMarketId === Number(selected.id) : busyMarketId != null

  if (viewState !== 'ready') {
    return (
      <AdminShell title={viewState === 'no-access' ? 'Доступ запрещён' : 'Модерация'}>
        {viewState === 'no-access' ? (
          <>
            <section className={styles.stateCard}>
              <strong>Для этого действия нужна роль администратора.</strong>
              <p>Доступ к очереди модерации закрыт.</p>
            </section>
            {onBack ? <Button fullWidth onClick={onBack}>Вернуться</Button> : null}
          </>
        ) : viewState === 'loading' ? (
          <section className={styles.metric}>
            <strong>•••</strong>
            <p>Загружаем очередь модерации.</p>
          </section>
        ) : (
          <>
            <StatusMessage tone="error" title={t('err.request')}>
              {errorMessage || t('err.requestBody')}
            </StatusMessage>
            {onRetry ? <Button fullWidth onClick={onRetry}>{t('retry')}</Button> : null}
            {onBack ? <Button variant="secondary" fullWidth onClick={onBack}>{t('back')}</Button> : null}
          </>
        )}
      </AdminShell>
    )
  }

  if (successMessage) {
    return (
      <AdminShell title="Действие выполнено">
        <section className={styles.successMetric}>
          <strong>✓</strong>
          <p>{successMessage}</p>
        </section>
        <Rows rows={['Backend подтвердил изменение рынка', 'Очередь будет обновлена']} />
        <Button
          fullWidth
          onClick={() => {
            setSelectedId(null)
            setStep('queue')
            onDismissSuccess?.()
          }}
        >
          К очереди
        </Button>
      </AdminShell>
    )
  }

  if (errorMessage && selectedId != null && !busy) {
    return (
      <AdminShell title={errorKind === 'conflict' ? 'Данные изменились' : 'Действие не завершено'}>
        <section className={errorKind === 'conflict' ? styles.warningCard : styles.dangerCard}>
          <strong>{errorMessage}</strong>
          <p>
            {errorKind === 'conflict'
              ? 'Состояние рынка изменилось. Решение не применено.'
              : 'Операция остановлена; проверьте состояние рынка перед повтором.'}
          </p>
        </section>
        <Button fullWidth onClick={onRetry}>
          {errorKind === 'conflict' ? 'Загрузить актуальные данные' : 'Повторить'}
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => {
            setSelectedId(null)
            setStep('queue')
          }}
        >
          К очереди
        </Button>
      </AdminShell>
    )
  }

  if (markets.length === 0) {
    return (
      <AdminShell title="Очередь пуста">
        <section className={styles.stateCard}>
          <strong>Новых заявок на модерацию нет.</strong>
          <p>Последняя проверка · только что</p>
        </section>
        {onRetry ? <Button fullWidth onClick={onRetry}>Обновить</Button> : null}
        {onBack ? <Button variant="secondary" fullWidth onClick={onBack}>{t('back')}</Button> : null}
      </AdminShell>
    )
  }

  if (!selected || step === 'queue') {
    return (
      <AdminShell title="Очередь модерации" context={'ADMIN ONLY · ' + markets.length + ' НОВЫХ'}>
        <p className={styles.description}>Заявки требуют решения администратора.</p>
        <div className={styles.queue}>
          {markets.slice(0, 8).map((market, index) => (
            <button
              key={market.id}
              type="button"
              onClick={() => {
                setSelectedId(Number(market.id))
                setStep('review')
              }}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <span>{market.question} · {market.closeLabel}</span>
            </button>
          ))}
        </div>
        <Button
          fullWidth
          onClick={() => {
            setSelectedId(Number(markets[0]!.id))
            setStep('review')
          }}
        >
          Открыть следующий
        </Button>
        {onBack ? <Button variant="secondary" fullWidth onClick={onBack}>{t('back')}</Button> : null}
      </AdminShell>
    )
  }

  const marketId = Number(selected.id)
  const reason = reasonById[marketId] ?? ''
  const parsed = parseModerationDescription(selected.description)
  const criteria = parsed.criteria || selected.resolution || parsed.body || 'Критерии отдельно не указаны'
  const sources = [parsed.primarySource, parsed.additionalSource].filter(Boolean)

  if (busy) {
    return (
      <AdminShell title="Выполняем действие">
        <section className={styles.metric}>
          <strong>•••</strong>
          <p>Admin-действие отправлено на backend. Не повторяйте запрос до ответа.</p>
        </section>
        <Rows rows={['Запрос отправлен', 'Ожидаем подтверждение backend', 'Финализация · ожидается']} />
      </AdminShell>
    )
  }

  if (step === 'review') {
    return (
      <AdminShell title="Проверка рынка">
        <p className={styles.description}>Проверьте формулировку и параметры до решения.</p>
        <Rows
          rows={[
            'Рынок #BTN-' + marketId,
            selected.question,
            'Создатель · @' + selected.creator.handle,
            'Источник · ' + (parsed.primarySource || 'не указан'),
          ]}
        />
        <Button fullWidth onClick={() => setStep('criteria')}>Продолжить проверку</Button>
        <BackButton onClick={() => { setSelectedId(null); setStep('queue') }} />
      </AdminShell>
    )
  }

  if (step === 'criteria') {
    return (
      <AdminShell title="Критерии решения">
        <p className={styles.description}>Исход должен определяться однозначно.</p>
        <Rows
          rows={[
            'Исход 1 · ' + selected.outcomeA.label,
            'Исход 2 · ' + selected.outcomeB.label,
            criteria,
          ]}
        />
        <Button fullWidth onClick={() => setStep('source')}>К источнику</Button>
        <BackButton onClick={() => setStep('review')} />
      </AdminShell>
    )
  }

  if (step === 'source') {
    return (
      <AdminShell title="Проверка источника">
        <p className={styles.description}>Проверьте, что основной источник доступен и верифицируем.</p>
        <Rows
          rows={
            sources.length > 0
              ? sources.map((source, index) => (index === 0 ? 'Основной · ' : 'Дополнительный · ') + source)
              : ['Основной источник не указан', 'Дополнительный источник отсутствует']
          }
        />
        <Button fullWidth onClick={() => setStep('decision')}>К решению</Button>
        <BackButton onClick={() => setStep('criteria')} />
      </AdminShell>
    )
  }

  if (step === 'decision') {
    return (
      <AdminShell title="Решение модерации">
        <Rows rows={['Рынок #BTN-' + marketId, selected.question, 'Создатель · @' + selected.creator.handle]} />
        <Button fullWidth onClick={() => setStep('approve')}>{t('mod.approve')}</Button>
        <Button variant="secondary" fullWidth onClick={() => setStep('reject')}>{t('mod.reject')}</Button>
        <BackButton onClick={() => setStep('source')} />
      </AdminShell>
    )
  }

  if (step === 'approve') {
    return (
      <AdminShell title="Одобрить рынок">
        <p className={styles.description}>Рынок станет доступен пользователям после публикации.</p>
        <Rows rows={['Рынок #BTN-' + marketId, selected.question, 'Создатель · @' + selected.creator.handle]} />
        <Button fullWidth onClick={() => setStep('approve-confirm')}>Одобрить</Button>
        <BackButton onClick={() => setStep('decision')} />
      </AdminShell>
    )
  }

  if (step === 'approve-confirm') {
    return (
      <AdminShell title="Подтвердите одобрение">
        <p className={styles.description}>После публикации вопрос и условия рынка нельзя менять.</p>
        <Rows rows={['Действие · публикация рынка', 'Market ID · BTN-' + marketId]} />
        <Button fullWidth onClick={() => onApprove?.(marketId)}>Подтвердить одобрение</Button>
        <BackButton label="Отмена" onClick={() => setStep('approve')} />
      </AdminShell>
    )
  }

  if (step === 'reject') {
    return (
      <AdminShell title="Отклонить рынок">
        <p className={styles.description}>Отклонение завершит текущую заявку; причина будет видна создателю.</p>
        <Rows rows={['Рынок #BTN-' + marketId, selected.question, 'Создатель · @' + selected.creator.handle]} />
        <Button variant="secondary" fullWidth onClick={() => setStep('reject-reason')}>Указать причину</Button>
        <BackButton label="Отмена" onClick={() => setStep('decision')} />
      </AdminShell>
    )
  }

  return (
    <AdminShell title="Причина отклонения">
      <p className={styles.description}>Причина обязательна и будет видна создателю.</p>
      <TextField
        id={'reject-' + marketId}
        label={t('mod.reasonPh')}
        value={reason}
        onChange={(value) => onReasonChange?.(marketId, value)}
      />
      <section className={styles.dangerCard}>
        <strong>Решение окончательное для этой заявки.</strong>
        <p>Создатель увидит указанный комментарий в «Мои рынки».</p>
      </section>
      <Button
        variant="secondary"
        fullWidth
        disabled={!reason.trim()}
        onClick={() => onReject?.(marketId, reason.trim())}
      >
        Отклонить навсегда
      </Button>
      <BackButton label="Отмена" onClick={() => setStep('reject')} />
    </AdminShell>
  )
}

function AdminShell({
  title,
  context = 'BETTON · SYSTEM',
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
        <span>{context}</span>
      </header>
      <main className={styles.body}>{children}</main>
    </div>
  )
}

function Rows({ rows }: { rows: string[] }) {
  return (
    <section className={styles.rows}>
      {rows.filter(Boolean).map((row, index) => (
        <div key={String(index) + row}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <p>{row}</p>
        </div>
      ))}
    </section>
  )
}

function BackButton({
  onClick,
  label = 'Назад',
}: {
  onClick: () => void
  label?: string
}) {
  return <Button variant="secondary" fullWidth onClick={onClick}>{label}</Button>
}

function parseModerationDescription(description: string): {
  body: string
  criteria: string
  primarySource: string
  additionalSource: string
} {
  const parts = (description || '')
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
  let criteria = ''
  let primarySource = ''
  let additionalSource = ''
  const body: string[] = []
  for (const part of parts) {
    if (part.startsWith('Критерии результата:')) {
      criteria = part.slice('Критерии результата:'.length).trim()
    } else if (part.startsWith('Основной источник:')) {
      primarySource = part.slice('Основной источник:'.length).trim()
    } else if (part.startsWith('Дополнительный источник:')) {
      additionalSource = part.slice('Дополнительный источник:'.length).trim()
    } else {
      body.push(part)
    }
  }
  return { body: body.join('\n\n'), criteria, primarySource, additionalSource }
}
