import { useMemo, useState } from 'react'
import { Button } from '../components/Button/Button'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { TextField } from '../components/TextField/TextField'
import { useT } from '../i18n'
import type { MarketFixture } from '../types/market'
import styles from './ModerationScreen.module.css'

export type ModerationViewState = 'ready' | 'loading' | 'error' | 'no-access'
type ReviewStep = 'queue' | 'review' | 'decision' | 'approve-confirm' | 'reject'

export type ModerationScreenProps = {
  markets?: MarketFixture[]
  viewState?: ModerationViewState
  reasonById?: Record<number, string>
  busyMarketId?: number | null
  errorMessage?: string | null
  onBack?: () => void
  onApprove?: (marketId: number) => void
  onReject?: (marketId: number, reason: string) => void
  onReasonChange?: (marketId: number, reason: string) => void
  onRetry?: () => void
}

export function ModerationScreen({
  markets = [],
  viewState = 'ready',
  reasonById = {},
  busyMarketId = null,
  errorMessage,
  onBack,
  onApprove,
  onReject,
  onReasonChange,
  onRetry,
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
      <div className={styles.screen}>
        <header className={styles.header}>
          <h1>{viewState === 'no-access' ? 'Нет доступа' : 'Модерация'}</h1>
          <span>BETTON · SYSTEM</span>
        </header>
        <main className={styles.body}>
          {viewState === 'no-access' ? (
            <StatusMessage tone="warning" title={t('err.noAccess')}>{t('mod.adminOnly')}</StatusMessage>
          ) : viewState === 'loading' ? (
            <StatusMessage tone="loading" title={t('loading')}>{t('loading.events')}</StatusMessage>
          ) : (
            <>
              <StatusMessage tone="error" title={t('err.request')}>{errorMessage || t('err.requestBody')}</StatusMessage>
              {onRetry ? <Button fullWidth variant="secondary" onClick={onRetry}>{t('retry')}</Button> : null}
            </>
          )}
          {onBack ? <Button variant="secondary" fullWidth onClick={onBack}>{t('back')}</Button> : null}
        </main>
      </div>
    )
  }

  if (markets.length === 0) {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <h1>Очередь модерации</h1>
          <span>ADMIN ONLY · 0 НОВЫХ</span>
        </header>
        <main className={styles.body}>
          <section className={styles.stateCard}>
            <strong>Очередь пуста</strong>
            <p>{t('mod.empty')}</p>
          </section>
          {onBack ? <Button variant="secondary" fullWidth onClick={onBack}>{t('back')}</Button> : null}
        </main>
      </div>
    )
  }

  if (!selected || step === 'queue') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <h1>Очередь модерации</h1>
          <span>ADMIN ONLY · {markets.length} НОВЫХ</span>
        </header>
        <main className={styles.body}>
          <section className={styles.stateCard}>
            <strong>Заявки требуют решения администратора.</strong>
            <div className={styles.queue}>
              {markets.slice(0, 6).map((market, index) => (
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
          </section>
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
        </main>
      </div>
    )
  }

  const marketId = Number(selected.id)
  const reason = reasonById[marketId] ?? ''

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1>
          {step === 'review'
            ? 'Проверка рынка'
            : step === 'decision'
              ? 'Решение модерации'
              : step === 'approve-confirm'
                ? 'Подтверждение'
                : 'Отклонить рынок'}
        </h1>
        <span>BETTON · SYSTEM</span>
      </header>

      <main className={styles.body}>
        {busy ? (
          <section className={styles.metric}>
            <strong>Обрабатываем</strong>
            <p>Решение отправляется на сервер.</p>
          </section>
        ) : null}

        {errorMessage ? (
          <StatusMessage tone="error" title={t('error')}>{errorMessage}</StatusMessage>
        ) : null}

        {step === 'review' ? (
          <>
            <section className={styles.stateCard}>
              <strong>Проверьте формулировку и параметры до решения.</strong>
              <p>Рынок #BTN-{marketId}</p>
              <p>{selected.question}</p>
              <p>Создатель · @{selected.creator.handle}</p>
              <p>Источник / критерий · {selected.resolution || selected.description || 'не указан'}</p>
            </section>
            <Button fullWidth onClick={() => setStep('decision')}>Продолжить проверку</Button>
          </>
        ) : null}

        {step === 'decision' ? (
          <>
            <section className={styles.stateCard}>
              <strong>{selected.question}</strong>
              <p>Проверьте критерий, источник и однозначность двух исходов.</p>
            </section>
            <Button fullWidth disabled={busy} onClick={() => setStep('approve-confirm')}>
              {t('mod.approve')}
            </Button>
            <Button variant="secondary" fullWidth disabled={busy} onClick={() => setStep('reject')}>
              {t('mod.reject')}
            </Button>
          </>
        ) : null}

        {step === 'approve-confirm' ? (
          <>
            <section className={styles.noticeSuccess}>
              <strong>!</strong>
              <p>После одобрения публичный рынок станет доступен в discovery.</p>
            </section>
            <Button
              fullWidth
              disabled={busy}
              onClick={() => onApprove?.(marketId)}
            >
              Подтвердить одобрение
            </Button>
          </>
        ) : null}

        {step === 'reject' ? (
          <>
            <TextField
              id={'reject-' + marketId}
              label={t('mod.reasonPh')}
              value={reason}
              onChange={(value) => onReasonChange?.(marketId, value)}
            />
            <section className={styles.noticeDanger}>
              <strong>!</strong>
              <p>Причина будет показана создателю рынка.</p>
            </section>
            <Button
              variant="secondary"
              fullWidth
              disabled={busy || !reason.trim()}
              onClick={() => onReject?.(marketId, reason.trim())}
            >
              Подтвердить отклонение
            </Button>
          </>
        ) : null}

        <Button
          variant="secondary"
          fullWidth
          disabled={busy}
          onClick={() => {
            if (step === 'review') {
              setSelectedId(null)
              setStep('queue')
            } else if (step === 'decision') setStep('review')
            else setStep('decision')
          }}
        >
          Назад
        </Button>
      </main>
    </div>
  )
}
