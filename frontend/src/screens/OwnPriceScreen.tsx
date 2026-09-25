import { useState } from 'react'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { Button } from '../components/Button/Button'
import { OwnPricePanel, type OwnPriceStage } from '../components/OwnPricePanel/OwnPricePanel'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { marketYesNo, orderBookA, orderBookB, recentTrades } from '../fixtures/markets'
import { useT } from '../i18n'
import { formatOdds, formatTonFull } from '../lib/format'
import type { MarketFixture, OrderBookLevel, OutcomeSide, RecentTrade } from '../types/market'
import styles from './OwnPriceScreen.module.css'

export type OwnPriceScreenProps = {
  market?: MarketFixture
  onBack?: () => void
  onNavChange?: (id: NavId) => void
  onQuickTrade?: (side: OutcomeSide) => void
  selectedSide?: OutcomeSide
  odds?: number
  amount?: number
  book?: OrderBookLevel[]
  trades?: RecentTrade[]
  onSelectSide?: (side: OutcomeSide) => void
  onOddsChange?: (odds: number) => void
  onAmountChange?: (amount: number) => void
  onSubmit?: () => void
  matchedTon?: number | null
  restTon?: number | null
  previewMode?: 'local' | 'backend'
  submitting?: boolean
  disabled?: boolean
  errorMessage?: string | null
  availableTon?: number | null
  success?: boolean
  placedOrder?: {
    id: number
    odds: number
    amountTon: number
    filledTon: number
    remainingTon: number
    status: string
  } | null
  cancellingOrder?: boolean
  onCancelRemainder?: () => void
  viewState?: 'ready' | 'loading' | 'error' | 'forbidden'
  onRetry?: () => void
  noticeMessage?: string | null
  bookState?: 'ready' | 'loading' | 'error'
  tradesState?: 'ready' | 'loading' | 'error'
  onRetryBook?: () => void
  onRetryTrades?: () => void
}

export function OwnPriceScreen({
  market = marketYesNo,
  onBack,
  onNavChange,
  onQuickTrade,
  selectedSide,
  odds,
  amount,
  book,
  trades = recentTrades,
  onSelectSide,
  onOddsChange,
  onAmountChange,
  onSubmit,
  matchedTon = null,
  restTon = null,
  previewMode = 'local',
  submitting = false,
  disabled = false,
  errorMessage = null,
  availableTon = null,
  success = false,
  placedOrder = null,
  cancellingOrder = false,
  onCancelRemainder,
  viewState = 'ready',
  onRetry,
  noticeMessage = null,
  bookState = 'ready',
  tradesState = 'ready',
  onRetryBook,
  onRetryTrades,
}: OwnPriceScreenProps) {
  const t = useT()
  const [side, setSide] = useState<OutcomeSide>(selectedSide ?? 'a')
  const [localOdds, setLocalOdds] = useState(odds ?? market.outcomeA.odds ?? 1.82)
  const [localAmount, setLocalAmount] = useState(amount ?? 100)
  const [stage, setStage] = useState<OwnPriceStage>('entry')
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const activeSide = onSelectSide ? (selectedSide ?? side) : side
  const activeOdds = onOddsChange ? (odds ?? localOdds) : localOdds
  const activeAmount = onAmountChange ? (amount ?? localAmount) : localAmount
  const activeBook = book ?? (activeSide === 'a' ? orderBookA : orderBookB)
  const title = placedOrder
    ? cancelConfirm
      ? 'Отменить остаток?'
      : placedOrder.status === 'open' && placedOrder.remainingTon > 0
        ? 'Ордер размещён'
        : 'Ордер завершён'
    : success
      ? 'Ордер размещён'
      : stage === 'preview'
        ? 'Предпросмотр ордера'
        : stage === 'confirm'
          ? 'Подтверждение ордера'
          : 'Своя цена'

  const selectSide = (next: OutcomeSide) => {
    setStage('entry')
    if (onSelectSide) onSelectSide(next)
    else {
      setSide(next)
      setLocalOdds((next === 'a' ? market.outcomeA.odds : market.outcomeB.odds) ?? localOdds)
    }
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        {viewState === 'ready' ? <strong className={styles.marketQuestion}>{market.question}</strong> : null}
        <div className={styles.titleRow}>
          <button type="button" className={styles.backButton} onClick={onBack} aria-label={t('back')}>←</button>
          <h1>{title}</h1>
        </div>
      </header>

      <main className={styles.body}>
        {viewState === 'loading' ? (
          <StatusMessage tone="loading" title={t('loading')}>{t('loading.body')}</StatusMessage>
        ) : viewState === 'forbidden' ? (
          <StatusMessage tone="warning" title={t('err.forbidden')}>{t('err.forbiddenBody')}</StatusMessage>
        ) : viewState === 'error' ? (
          <>
            <StatusMessage tone="error" title={t('err.request')}>{t('err.requestBody')}</StatusMessage>
            {onRetry ? <Button variant="secondary" onClick={onRetry}>{t('retry')}</Button> : null}
          </>
        ) : (
          <>
            {noticeMessage ? <StatusMessage tone="warning" title={noticeMessage} /> : null}
            {placedOrder ? (
              <>
                <section className={styles.orderMetric}>
                  <strong>{formatTonFull(placedOrder.remainingTon)}</strong>
                  <span>
                    {placedOrder.status === 'open' && placedOrder.remainingTon > 0
                      ? 'неисполненный остаток'
                      : 'остаток после завершения'}
                  </span>
                </section>

                {cancelConfirm ? (
                  <>
                    <section className={styles.orderDetails}>
                      <OrderDetailRow label="Исполнено" value={formatTonFull(placedOrder.filledTon)} />
                      <OrderDetailRow label="Будет отменено" value={formatTonFull(placedOrder.remainingTon)} />
                      <OrderDetailRow label="Резерв вернётся" value={formatTonFull(placedOrder.remainingTon)} />
                    </section>
                    {errorMessage ? (
                      <StatusMessage tone="error" title={t('err.request')}>{errorMessage}</StatusMessage>
                    ) : null}
                    <Button
                      fullWidth
                      loading={cancellingOrder}
                      disabled={cancellingOrder || placedOrder.remainingTon <= 0 || !onCancelRemainder}
                      onClick={onCancelRemainder}
                    >
                      Отменить {formatTonFull(placedOrder.remainingTon)}
                    </Button>
                    <Button
                      variant="secondary"
                      fullWidth
                      disabled={cancellingOrder}
                      onClick={() => setCancelConfirm(false)}
                    >
                      Назад к ордеру
                    </Button>
                  </>
                ) : (
                  <>
                    <section className={styles.orderDetails}>
                      <OrderDetailRow label="Лимит" value={formatOdds(placedOrder.odds) + '×'} />
                      <OrderDetailRow label="Объём ордера" value={formatTonFull(placedOrder.amountTon)} />
                      <OrderDetailRow label="Исполнено" value={formatTonFull(placedOrder.filledTon)} />
                      <OrderDetailRow label="Остаток" value={formatTonFull(placedOrder.remainingTon)} />
                    </section>
                    {errorMessage ? (
                      <StatusMessage tone="error" title={t('err.request')}>{errorMessage}</StatusMessage>
                    ) : null}
                    {placedOrder.status === 'open' && placedOrder.remainingTon > 0 ? (
                      <Button fullWidth onClick={() => setCancelConfirm(true)}>
                        Отменить остаток
                      </Button>
                    ) : (
                      <section className={styles.orderState}>
                        <strong>
                          {placedOrder.status === 'cancelled' ? 'ОРДЕР ОТМЕНЁН' : 'ОРДЕР ЗАВЕРШЁН'}
                        </strong>
                        <p>
                          {placedOrder.remainingTon > 0
                            ? 'Остаток больше не активен.'
                            : 'Неисполненного остатка больше нет.'}
                        </p>
                      </section>
                    )}
                    <Button variant="secondary" fullWidth onClick={onBack}>
                      Назад к рынку
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                <OwnPricePanel
              question={market.question}
              outcomeALabel={market.outcomeA.label}
              outcomeBLabel={market.outcomeB.label}
              outcomeAOdds={market.outcomeA.odds}
              outcomeBOdds={market.outcomeB.odds}
              selectedSide={activeSide}
              odds={activeOdds}
              amount={activeAmount}
              book={activeBook}
              trades={trades}
              matchedTon={matchedTon}
              restTon={restTon}
              previewMode={previewMode}
              submitting={submitting}
              disabled={disabled}
              errorMessage={errorMessage}
              availableTon={availableTon}
              success={success}
              bookState={bookState}
              tradesState={tradesState}
              onRetryBook={onRetryBook}
              onRetryTrades={onRetryTrades}
              stage={stage}
              onStageChange={setStage}
              onSelectSide={selectSide}
              onOddsChange={(next) => {
                setStage('entry')
                if (onOddsChange) onOddsChange(next)
                else setLocalOdds(next)
              }}
              onAmountChange={(next) => {
                setStage('entry')
                if (onAmountChange) onAmountChange(next)
                else setLocalAmount(next)
              }}
              onSubmit={onSubmit}
            />

            {stage === 'entry' && !success ? (
              <div className={styles.destinations}>
                <Button
                  variant="secondary"
                  fullWidth
                  disabled={!onQuickTrade}
                  onClick={onQuickTrade ? () => onQuickTrade(activeSide) : undefined}
                >
                  Быстрый вход
                </Button>
                <Button variant="secondary" fullWidth onClick={onBack}>
                  Назад к рынку
                </Button>
              </div>
            ) : null}

                {success ? (
                  <Button variant="secondary" fullWidth onClick={onBack}>
                    Назад к рынку
                  </Button>
                ) : null}
              </>
            )}
          </>
        )}
      </main>

      <BottomNavigation active="markets" onChange={onNavChange} />
    </div>
  )
}


function OrderDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.orderDetailRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

