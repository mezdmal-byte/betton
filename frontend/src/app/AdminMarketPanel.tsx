import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { isApiError } from '../api/client'
import { errorDetail } from '../api/errors'
import {
  approveMarket,
  closeMarket,
  rejectMarket,
  resolveMarket,
  voidMarket,
} from '../api/moderation'
import { queryKeys } from '../api/query'
import type { MarketOut } from '../api/types'
import { Button } from '../components/Button/Button'
import { TextField } from '../components/TextField/TextField'
import { useT } from '../i18n'
import { invalidateAfterTrade } from './invalidate'
import styles from './AdminMarketPanel.module.css'

type Flow =
  | { kind: 'approve' }
  | { kind: 'reject' }
  | { kind: 'close'; stage: 'review' | 'confirm' }
  | { kind: 'void'; stage: 'review' | 'reason' | 'confirm' }
  | { kind: 'resolve'; stage: 'preview' | 'confirm'; outcomeIndex: number; outcomeName: string }
  | null

export function AdminMarketPanel({
  market,
  userId,
}: {
  market: MarketOut
  userId?: number
}) {
  const t = useT()
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')
  const [flow, setFlow] = useState<Flow>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const invalidate = () => {
    invalidateAfterTrade(queryClient, { userId, marketId: market.id })
    void queryClient.invalidateQueries({ queryKey: queryKeys.moderation })
  }

  const run = useMutation({
    mutationFn: (fn: () => Promise<MarketOut>) => fn(),
    onSuccess: (updated) => {
      setFlow(null)
      setReason('')
      setErrorMessage(null)
      setConflict(false)
      setSuccessMessage(successCopy(updated))
      invalidate()
    },
    onError: (error) => {
      setConflict(isApiError(error) && error.status === 409)
      setErrorMessage(errorDetail(error))
    },
  })

  const p2p = (market.mechanism ?? 'p2p') === 'p2p'
  const names = market.outcomes?.length ? market.outcomes : [t('outcome.yes'), t('outcome.no')]

  const execute = () => {
    if (!flow || run.isPending) return
    setErrorMessage(null)
    setConflict(false)

    if (flow.kind === 'approve') run.mutate(() => approveMarket(market.id))
    if (flow.kind === 'reject' && reason.trim()) {
      run.mutate(() => rejectMarket(market.id, reason.trim()))
    }
    if (flow.kind === 'close' && flow.stage === 'confirm') {
      run.mutate(() => closeMarket(market.id))
    }
    if (flow.kind === 'void' && flow.stage === 'confirm' && reason.trim()) {
      run.mutate(() => voidMarket(market.id, reason.trim()))
    }
    if (flow.kind === 'resolve' && flow.stage === 'confirm') {
      run.mutate(() => resolveMarket(market.id, flow.outcomeIndex))
    }
  }

  if (run.isPending) {
    return (
      <section className={styles.root}>
        <Heading title={flow?.kind === 'resolve' ? 'Выполняем расчёт' : 'Выполняем действие'} />
        <section className={styles.metric}>
          <strong>•••</strong>
          <p>Запрос отправлен на backend. Финализация выполняется атомарно.</p>
        </section>
        <Rows rows={['Подпись операции · отправлена', 'Backend · обрабатывает', 'Финализация · ожидается']} />
      </section>
    )
  }

  if (successMessage) {
    return (
      <section className={styles.root}>
        <Heading title="Действие завершено" />
        <section className={styles.successMetric}>
          <strong>✓</strong>
          <p>{successMessage}</p>
        </section>
        <Rows rows={['Backend подтвердил новое состояние рынка', 'Данные рынка обновляются']} />
        <Button fullWidth onClick={() => setSuccessMessage(null)}>К рынку</Button>
      </section>
    )
  }

  if (errorMessage) {
    return (
      <section className={styles.root}>
        <Heading title={conflict ? 'Данные изменились' : 'Действие не завершено'} />
        <section className={conflict ? styles.warningCard : styles.dangerCard}>
          <strong>{errorMessage}</strong>
          <p>
            {conflict
              ? 'Состояние рынка изменилось между просмотром и подтверждением. Действие не применено.'
              : 'Backend не подтвердил действие. Повторяйте только после проверки состояния рынка.'}
          </p>
        </section>
        <div className={styles.actions}>
          <Button
            fullWidth
            onClick={() => {
              setErrorMessage(null)
              setConflict(false)
              invalidate()
            }}
          >
            {conflict ? 'Загрузить актуальные данные' : 'Вернуться'}
          </Button>
          <Button variant="secondary" fullWidth onClick={() => { setErrorMessage(null); setFlow(null) }}>
            Отмена
          </Button>
        </div>
      </section>
    )
  }

  if (!flow) {
    return (
      <section className={styles.root}>
        <Heading title={t('moderation.title')} />
        <section className={styles.stateCard}>
          <strong>{market.question}</strong>
          <p>Статус · {market.status}</p>
          <p>{t('mod.hint')}</p>
        </section>

        {market.status === 'pending' ? (
          <div className={styles.actions}>
            <Button fullWidth onClick={() => setFlow({ kind: 'approve' })}>{t('mod.approve')}</Button>
            <Button variant="secondary" fullWidth onClick={() => setFlow({ kind: 'reject' })}>{t('mod.reject')}</Button>
          </div>
        ) : null}

        {market.status === 'open' ? (
          <div className={styles.actions}>
            <Button variant="secondary" fullWidth onClick={() => setFlow({ kind: 'close', stage: 'review' })}>
              Закрыть торговлю
            </Button>
            {p2p ? (
              <Button variant="secondary" fullWidth onClick={() => setFlow({ kind: 'void', stage: 'review' })}>
                Аннулировать рынок
              </Button>
            ) : null}
          </div>
        ) : null}

        {market.status === 'closed' ? (
          <>
            <section className={styles.stateCard}>
              <strong>Выберите победивший исход</strong>
              <p>Расчёт окончательный. Отдельного backend preview сумм выплат сейчас нет.</p>
            </section>
            <div className={styles.resolveGrid}>
              {names.map((name, index) => (
                <Button
                  key={name}
                  variant="secondary"
                  fullWidth
                  onClick={() => setFlow({ kind: 'resolve', stage: 'preview', outcomeIndex: index, outcomeName: name })}
                >
                  {name}
                </Button>
              ))}
            </div>
            {p2p ? (
              <Button variant="secondary" fullWidth onClick={() => setFlow({ kind: 'void', stage: 'review' })}>
                Аннулировать рынок
              </Button>
            ) : null}
          </>
        ) : null}
      </section>
    )
  }

  if (flow.kind === 'approve') {
    return (
      <section className={styles.root}>
        <Heading title="Подтвердите одобрение" />
        <p className={styles.description}>После публикации рынок станет доступен согласно своей видимости.</p>
        <Rows rows={['Действие · публикация рынка', 'Market ID · ' + market.id]} />
        <ActionPair
          primary="Подтвердить одобрение"
          onPrimary={execute}
          onCancel={() => setFlow(null)}
        />
      </section>
    )
  }

  if (flow.kind === 'reject') {
    return (
      <section className={styles.root}>
        <Heading title="Причина отклонения" />
        <p className={styles.description}>Причина обязательна и будет видна создателю.</p>
        <TextField id="admin-reject" label={t('mod.reasonPh')} value={reason} onChange={setReason} />
        <section className={styles.dangerCard}>
          <strong>Отклонение завершит текущую заявку.</strong>
          <p>Для нового рассмотрения создателю потребуется исправить рынок.</p>
        </section>
        <ActionPair
          primary="Отклонить навсегда"
          primaryDisabled={!reason.trim()}
          danger
          onPrimary={execute}
          onCancel={() => { setReason(''); setFlow(null) }}
        />
      </section>
    )
  }

  if (flow.kind === 'close') {
    if (flow.stage === 'review') {
      return (
        <section className={styles.root}>
          <Heading title="Закрыть торговлю" />
          <p className={styles.description}>Новые сделки будут остановлены.</p>
          <Rows
            rows={[
              'Открытые позиции сохраняются до расчёта',
              p2p
                ? 'Открытые P2P-заявки будут отменены, неисполненные остатки возвращены'
                : 'Рынок перестанет принимать новые ставки',
            ]}
          />
          <ActionPair
            primary="Продолжить"
            onPrimary={() => setFlow({ kind: 'close', stage: 'confirm' })}
            onCancel={() => setFlow(null)}
          />
        </section>
      )
    }
    return (
      <section className={styles.root}>
        <Heading title="Закрыть рынок?" />
        <section className={styles.warningCard}>
          <strong>Действие меняет рынок на Closed.</strong>
          <p>
            {p2p
              ? 'Backend отменит открытые P2P-заявки и вернёт их неисполненные остатки владельцам.'
              : 'После закрытия новые ставки не принимаются.'}
          </p>
        </section>
        <ActionPair
          primary={p2p ? 'Закрыть и вернуть заявки' : 'Закрыть торговлю'}
          onPrimary={execute}
          onCancel={() => setFlow({ kind: 'close', stage: 'review' })}
        />
      </section>
    )
  }

  if (flow.kind === 'void') {
    if (flow.stage === 'review') {
      return (
        <section className={styles.root}>
          <Heading title="Аннулировать рынок" />
          <p className={styles.description}>Void применяется, когда корректное решение невозможно.</p>
          <Rows
            rows={[
              'Исполненные P2P-ставки будут возвращены',
              'Неисполненные остатки заявок будут возвращены',
              'Сервисный сбор при void · 0',
            ]}
          />
          <ActionPair
            primary="Указать причину"
            danger
            onPrimary={() => setFlow({ kind: 'void', stage: 'reason' })}
            onCancel={() => setFlow(null)}
          />
        </section>
      )
    }

    if (flow.stage === 'reason') {
      return (
        <section className={styles.root}>
          <Heading title="Причина аннулирования" />
          <p className={styles.description}>Действие необратимо и причина сохраняется в рынке.</p>
          <TextField id="admin-void" label={t('mod.cancelPh')} value={reason} onChange={setReason} />
          <ActionPair
            primary="Продолжить"
            primaryDisabled={!reason.trim()}
            danger
            onPrimary={() => setFlow({ kind: 'void', stage: 'confirm' })}
            onCancel={() => { setReason(''); setFlow(null) }}
          />
        </section>
      )
    }

    return (
      <section className={styles.root}>
        <Heading title="Подтвердите аннулирование" />
        <section className={styles.dangerCard}>
          <strong>{reason}</strong>
          <p>Backend вернёт применимые P2P-средства и переведёт рынок в Cancelled.</p>
        </section>
        <ActionPair
          primary="Аннулировать и вернуть средства"
          danger
          onPrimary={execute}
          onCancel={() => setFlow({ kind: 'void', stage: 'reason' })}
        />
      </section>
    )
  }

  if (flow.stage === 'preview') {
    return (
      <section className={styles.root}>
        <Heading title="Предпросмотр расчёта" />
        <section className={styles.metric}>
          <strong>{flow.outcomeName}</strong>
          <p>выбранный победивший исход</p>
        </section>
        <Rows
          rows={[
            'Исход · ' + flow.outcomeName,
            'Рынок должен быть Closed',
            'Суммы выплат рассчитает backend атомарно при подтверждении',
            'Отдельный settlement-preview API сейчас отсутствует',
          ]}
        />
        <ActionPair
          primary="Продолжить"
          onPrimary={() => setFlow({ ...flow, stage: 'confirm' })}
          onCancel={() => setFlow(null)}
          cancelLabel="Изменить исход"
        />
      </section>
    )
  }

  return (
    <section className={styles.root}>
      <Heading title="Подтвердите расчёт" />
      <p className={styles.description}>Расчёт окончательный. Проверьте выбранный исход.</p>
      <Rows rows={['Исход · ' + flow.outcomeName, 'Market ID · ' + market.id, 'Backend settlement · атомарный']} />
      <ActionPair
        primary="Исполнить расчёт"
        onPrimary={execute}
        onCancel={() => setFlow({ ...flow, stage: 'preview' })}
      />
    </section>
  )
}

function Heading({ title }: { title: string }) {
  return (
    <div className={styles.heading}>
      <strong>{title}</strong>
      <span>BETTON · SYSTEM</span>
    </div>
  )
}

function Rows({ rows }: { rows: string[] }) {
  return (
    <div className={styles.rows}>
      {rows.map((row, index) => (
        <div key={String(index) + row}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <p>{row}</p>
        </div>
      ))}
    </div>
  )
}

function ActionPair({
  primary,
  primaryDisabled = false,
  danger = false,
  onPrimary,
  onCancel,
  cancelLabel = 'Отмена',
}: {
  primary: string
  primaryDisabled?: boolean
  danger?: boolean
  onPrimary: () => void
  onCancel: () => void
  cancelLabel?: string
}) {
  return (
    <div className={styles.actions}>
      <Button
        fullWidth
        variant={danger ? 'secondary' : undefined}
        disabled={primaryDisabled}
        onClick={onPrimary}
      >
        {primary}
      </Button>
      <Button variant="secondary" fullWidth onClick={onCancel}>{cancelLabel}</Button>
    </div>
  )
}

function successCopy(market: MarketOut): string {
  if (market.status === 'resolved') {
    return market.winning_outcome
      ? 'Расчёт завершён. Победивший исход: ' + market.winning_outcome + '.'
      : 'Расчёт завершён.'
  }
  if (market.status === 'cancelled') return 'Рынок аннулирован; возвраты подтверждены backend.'
  if (market.status === 'closed') return 'Торговля закрыта.'
  if (market.status === 'open') return 'Рынок опубликован.'
  if (market.status === 'rejected') return 'Рынок отклонён.'
  return 'Действие выполнено.'
}
