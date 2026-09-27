import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { Button } from '../components/Button/Button'
import { IconButton } from '../components/IconButton/IconButton'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { ThemeToggle } from '../components/ThemeToggle/ThemeToggle'
import {
  accountUser,
  portfolioHistory,
  portfolioOrders,
  portfolioPositions,
} from '../fixtures/account'
import { isMessageKey, useI18n, useT } from '../i18n'
import { formatOdds, formatTonFull } from '../lib/format'
import { formatHistoryTime } from '../lib/time'
import type {
  AccountFixture,
  HistoryFixture,
  OrderFixture,
  PortfolioTab,
  PositionFixture,
  SettlementFixture,
} from '../types/account'
import styles from './PortfolioScreen.module.css'

type PortfolioView = 'overview' | PortfolioTab | 'settled' | 'creator'

export type PortfolioScreenProps = {
  account?: AccountFixture
  tab?: PortfolioTab
  positions?: PositionFixture[]
  orders?: OrderFixture[]
  history?: HistoryFixture[]
  settlements?: SettlementFixture[]
  onNavChange?: (id: NavId) => void
  onProfileClick?: () => void
  onCancelOrder?: (order: OrderFixture) => void
  onSelectMarket?: (marketId: number) => void
  onDeposit?: () => void
  onWithdraw?: () => void
  onBack?: () => void
  variant?: 'tab' | 'history'
  accountState?: 'ready' | 'loading' | 'unauthenticated'
  listState?: 'ready' | 'loading' | 'error'
  onRetry?: () => void
  cancellingOrderId?: string | null
  actionError?: string | null
}

export function PortfolioScreen({
  account = accountUser,
  tab,
  positions = portfolioPositions,
  orders = portfolioOrders,
  history = portfolioHistory,
  settlements = [],
  onNavChange,
  onCancelOrder,
  onSelectMarket,
  onBack,
  variant = 'tab',
  accountState = 'ready',
  listState = 'ready',
  onRetry,
  cancellingOrderId = null,
  actionError = null,
}: PortfolioScreenProps) {
  const t = useT()
  const { locale } = useI18n()
  const [view, setView] = useState<PortfolioView>(
    variant === 'history' ? 'history' : tab ?? 'overview',
  )
  const [selectedPosition, setSelectedPosition] = useState<PositionFixture | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderFixture | null>(null)
  const [cancelOrder, setCancelOrder] = useState<OrderFixture | null>(null)
  const hideNav = variant === 'history'
  const totalExposure = account.inPositionsTon + account.inOrdersTon

  const renderStatus = () => {
    if (listState === 'loading') {
      return (
        <StatusMessage tone="loading" title={t('loading')}>
          {t('loading.body')}
        </StatusMessage>
      )
    }
    if (listState === 'error') {
      return (
        <>
          <StatusMessage tone="error" title={t('err.request')}>
            {t('err.requestBody')}
          </StatusMessage>
          {onRetry ? (
            <Button variant="secondary" onClick={onRetry}>
              {t('retry')}
            </Button>
          ) : null}
        </>
      )
    }
    return null
  }

  return (
    <div className={styles.screen}>
      <header className={hideNav ? styles.headerSecondary : styles.header}>
        {hideNav ? (
          <>
            <IconButton label={t('back')} size="md" onClick={onBack}>
              <ChevronLeft size={22} />
            </IconButton>
            <h1>{t('profile.history')}</h1>
          </>
        ) : (
          <>
            <div className={styles.heading}>
              <span>
                {cancelOrder
                  ? 'ТОЛЬКО НЕИСПОЛНЕННЫЙ ОСТАТОК'
                  : selectedPosition
                    ? 'ПОЗИЦИЯ · ' + selectedPosition.outcomeLabel
                    : selectedOrder
                      ? 'ОРДЕР · ' + selectedOrder.outcomeLabel
                      : 'ОБЗОР'}
              </span>
              <h1>
                {cancelOrder
                  ? 'Отменить ордер?'
                  : selectedPosition
                    ? selectedPosition.question
                    : selectedOrder
                      ? selectedOrder.question
                      : view === 'overview'
                        ? 'Портфель'
                        : viewLabel(view, t)}
              </h1>
            </div>
            {view === 'overview' && !selectedPosition && !selectedOrder && !cancelOrder ? <ThemeToggle /> : null}
          </>
        )}
      </header>

      <main className={styles.body}>
        {accountState === 'unauthenticated' ? (
          <StatusMessage tone="warning" title={t('err.openInTg')}>
            {t('err.openInTgBody')}
          </StatusMessage>
        ) : cancelOrder ? (
          <>
            <section className={styles.detailCard}>
              <DetailRow label="Исполнено" value={formatTonFull(cancelOrder.filledTon)} />
              <DetailRow label="Будет отменено" value={formatTonFull(cancelOrder.remainingTon)} />
              <DetailRow label="Резерв вернётся" value={formatTonFull(cancelOrder.remainingTon)} />
            </section>
            {actionError ? (
              <StatusMessage tone="error" title={t('err.request')}>{actionError}</StatusMessage>
            ) : null}
            <Button
              fullWidth
              loading={cancellingOrderId === cancelOrder.id}
              disabled={cancellingOrderId === cancelOrder.id}
              onClick={() => {
                onCancelOrder?.(cancelOrder)
                setCancelOrder(null)
                setSelectedOrder(null)
              }}
            >
              Отменить {formatTonFull(cancelOrder.remainingTon)}
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setCancelOrder(null)}>
              Назад к ордеру
            </Button>
          </>
        ) : selectedPosition ? (
          <>
            <section className={styles.detailMetric}>
              <strong>{formatTonFull(selectedPosition.amountTon)}</strong>
              <span>объём позиции</span>
            </section>
            <section className={styles.detailCard}>
              <DetailRow label="Объём позиции" value={formatTonFull(selectedPosition.amountTon)} />
              <DetailRow label="Средний коэффициент" value={formatOdds(selectedPosition.avgOdds) + '×'} />
              <DetailRow label="Исход" value={selectedPosition.outcomeLabel} />
              <DetailRow label="Потенциальная выплата" value={formatTonFull(selectedPosition.potentialPayoutTon)} />
            </section>
            <Button fullWidth onClick={() => onSelectMarket?.(selectedPosition.marketId)}>
              Открыть рынок
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setSelectedPosition(null)}>
              Назад к позициям
            </Button>
          </>
        ) : selectedOrder ? (
          <>
            <section className={styles.detailMetric}>
              <strong>{formatTonFull(selectedOrder.remainingTon)}</strong>
              <span>неисполненный остаток</span>
            </section>
            <section className={styles.detailCard}>
              <DetailRow label="Лимит" value={formatOdds(selectedOrder.odds) + '×'} />
              <DetailRow label="Объём ордера" value={formatTonFull(selectedOrder.amountTon)} />
              <DetailRow label="Исполнено" value={formatTonFull(selectedOrder.filledTon)} />
              <DetailRow label="Остаток" value={formatTonFull(selectedOrder.remainingTon)} />
            </section>
            {selectedOrder.canCancel && selectedOrder.remainingTon > 0 ? (
              <Button
                fullWidth
                disabled={cancellingOrderId === selectedOrder.id}
                onClick={() => setCancelOrder(selectedOrder)}
              >
                Отменить остаток
              </Button>
            ) : null}
            <Button variant="secondary" fullWidth onClick={() => onSelectMarket?.(selectedOrder.marketId)}>
              Открыть рынок
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setSelectedOrder(null)}>
              Назад к ордерам
            </Button>
          </>
        ) : view === 'overview' ? (
          <>
            <section className={styles.primaryMetric}>
              <strong>
                {accountState === 'loading' ? '—' : formatTonFull(account.availableTon)}
              </strong>
              <span>{t('account.available').toLowerCase()}</span>
            </section>

            <section className={styles.details}>
              <div>
                <span>В позициях</span>
                <strong>{accountState === 'ready' ? formatTonFull(account.inPositionsTon) : '—'}</strong>
              </div>
              <div>
                <span>В ордерах</span>
                <strong>{accountState === 'ready' ? formatTonFull(account.inOrdersTon) : '—'}</strong>
              </div>
              <div>
                <span>Текущая экспозиция</span>
                <strong>{accountState === 'ready' ? formatTonFull(totalExposure) : '—'}</strong>
              </div>
            </section>

            {renderStatus()}

            <section className={styles.previewSection}>
              <div className={styles.sectionHeader}>
                <h2>{t('portfolio.positions')}</h2>
                <button type="button" onClick={() => setView('positions')}>Все →</button>
              </div>
              {positions[0] ? (
                <button
                  type="button"
                  className={styles.previewRow}
                  onClick={() => setSelectedPosition(positions[0]!)}
                >
                  <strong className={styles.accent}>
                    {positions[0].outcomeLabel} · {positions[0].question}
                  </strong>
                  <span>
                    {formatTonFull(positions[0].amountTon)} · средний коэф. {formatOdds(positions[0].avgOdds)}×
                  </span>
                </button>
              ) : (
                <p className={styles.emptyLine}>{t('empty.positionsTitle')}</p>
              )}
            </section>

            <section className={styles.previewSection}>
              <div className={styles.sectionHeader}>
                <h2>{t('portfolio.orders')}</h2>
                <button type="button" onClick={() => setView('orders')}>Все →</button>
              </div>
              {orders[0] ? (
                <button type="button" className={styles.previewRow} onClick={() => setSelectedOrder(orders[0]!)}>
                  <strong>{orders[0].outcomeLabel} · {orders[0].question}</strong>
                  <span>
                    {formatOdds(orders[0].odds)}× · исполнено {formatTonFull(orders[0].filledTon)} · остаток {formatTonFull(orders[0].remainingTon)}
                  </span>
                </button>
              ) : (
                <p className={styles.emptyLine}>{t('empty.ordersTitle')}</p>
              )}
            </section>

            <section className={styles.previewSection}>
              <div className={styles.sectionHeader}>
                <h2>Рассчитанные позиции</h2>
                <button type="button" onClick={() => setView('settled')}>Все →</button>
              </div>
              {settlements[0] ? (
                <button type="button" className={styles.previewRow} onClick={() => setView('settled')}>
                  <strong className={settlements[0].payoutTon > 0 ? styles.accent : undefined}>
                    {settlements[0].chosenOutcomes.join(' / ') || 'Позиция'} · {settlements[0].question}
                  </strong>
                  <span>
                    Расчёт: {settlements[0].winningOutcome} · выплата {formatTonFull(settlements[0].payoutTon)}
                  </span>
                </button>
              ) : (
                <p className={styles.emptyLine}>Рассчитанных позиций пока нет</p>
              )}
            </section>

            {account.creatorIncomeTon > 0 ? (
              <button type="button" className={styles.creatorDestination} onClick={() => setView('creator')}>
                <span>
                  <strong>Доход автора</strong>
                  <small>{formatTonFull(account.creatorIncomeTon)} начислено всего</small>
                </span>
                <b>›</b>
              </button>
            ) : null}
          </>
        ) : (
          <>
            {!hideNav ? (
              <button type="button" className={styles.backToOverview} onClick={() => setView('overview')}>
                ← Обзор
              </button>
            ) : null}

            {actionError ? (
              <StatusMessage tone="error" title={t('err.request')}>
                {actionError}
              </StatusMessage>
            ) : null}

            {view === 'history' && accountState === 'ready' && account.creatorIncomeTon > 0 ? (
              <section className={styles.creatorIncome}>
                <span>{t('account.creatorIncome')}</span>
                <strong>+{formatTonFull(account.creatorIncomeTon)}</strong>
              </section>
            ) : null}

            {renderStatus()}

            {listState === 'ready' && view === 'positions' ? (
              positions.length === 0 ? (
                <StatusMessage title={t('empty.positionsTitle')}>{t('empty.positionsBody')}</StatusMessage>
              ) : (
                <ul className={styles.list}>
                  {positions.map((item) => (
                    <li key={item.id} className={styles.row}>
                      <button type="button" className={styles.rowButton} onClick={() => setSelectedPosition(item)}>
                        <p className={styles.question}>{item.question}</p>
                        <p className={styles.meta}>
                          <span className={styles.accent}>{item.outcomeLabel}</span>
                          <strong>{formatTonFull(item.amountTon)}</strong>
                        </p>
                        <p className={styles.detail}>
                          {t('pos.avgOdds')} {formatOdds(item.avgOdds)}× · {t('pos.payout')} {formatTonFull(item.potentialPayoutTon)}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : null}

            {listState === 'ready' && view === 'orders' ? (
              orders.length === 0 ? (
                <StatusMessage title={t('empty.ordersTitle')}>{t('empty.ordersBody')}</StatusMessage>
              ) : (
                <ul className={styles.list}>
                  {orders.map((item) => (
                    <li key={item.id} className={styles.row}>
                      <button type="button" className={styles.rowButton} onClick={() => setSelectedOrder(item)}>
                        <p className={styles.question}>{item.question}</p>
                        <p className={styles.meta}>
                          <span>{item.outcomeLabel} · {formatOdds(item.odds)}×</span>
                          <strong>{formatTonFull(item.remainingTon)}</strong>
                        </p>
                        <span className={styles.detail}>
                          {item.filledTon > 0 && item.remainingTon > 0 ? t('order.partial') : t('order.wait')}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : null}

            {listState === 'ready' && view === 'history' ? (
              history.length === 0 ? (
                <StatusMessage title={t('empty.historyTitle')}>{t('empty.historyBody')}</StatusMessage>
              ) : (
                <ul className={styles.list}>
                  {history.map((item) => (
                    <li key={item.id} className={styles.row}>
                      <div className={styles.historyHead}>
                        <p className={styles.question}>{item.question}</p>
                        <p className={styles.time}>{formatHistoryTime(item.createdAt ?? item.time, locale)}</p>
                      </div>
                      <p className={styles.meta}>
                        <span>{historyAction(item, t)}</span>
                        <strong>{formatSigned(item.amountTon)}</strong>
                      </p>
                    </li>
                  ))}
                </ul>
              )
            ) : null}

            {listState === 'ready' && view === 'settled' ? (
              settlements.length === 0 ? (
                <StatusMessage title="Рассчитанных позиций пока нет">
                  После расчёта рынков позиции появятся здесь.
                </StatusMessage>
              ) : (
                <ul className={styles.list}>
                  {settlements.map((item) => (
                    <li key={item.id} className={styles.row}>
                      <p className={item.payoutTon > 0 ? styles.settlementWin : styles.question}>
                        {(item.chosenOutcomes.join(' / ') || 'Позиция') + ' · ' + item.question}
                      </p>
                      <p className={styles.detail}>
                        Расчёт: {item.winningOutcome} · выплата {formatTonFull(item.payoutTon)}
                      </p>
                      {item.cancellationReason ? (
                        <p className={styles.detail}>Причина: {item.cancellationReason}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )
            ) : null}

            {view === 'creator' ? (
              <>
                <section className={styles.detailMetric}>
                  <strong>{formatTonFull(account.creatorIncomeTon)}</strong>
                  <span>начислено всего</span>
                </section>
                <section className={styles.detailCard}>
                  <DetailRow label="Источник данных" value="Account API · creator earnings" />
                  <DetailRow
                    label="Разбивка выплат"
                    value="Backend пока не отдаёт отдельные значения «выплачено / ожидает»"
                  />
                </section>
              </>
            ) : null}
          </>
        )}
      </main>

      {hideNav ? null : <BottomNavigation active="portfolio" onChange={onNavChange} />}
    </div>
  )
}


function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function viewLabel(view: Exclude<PortfolioView, 'overview'>, t: ReturnType<typeof useT>): string {
  if (view === 'positions') return t('portfolio.positions')
  if (view === 'orders') return t('portfolio.orders')
  if (view === 'settled') return 'Рассчитанные позиции'
  if (view === 'creator') return 'Доход автора'
  return t('portfolio.history')
}

function historyAction(item: HistoryFixture, t: ReturnType<typeof useT>): string {
  const key = item.actionKey ? 'tx.' + item.actionKey : ''
  if (key && isMessageKey(key)) return t(key)
  return item.action
}

function formatSigned(amount: number): string {
  const value = formatTonFull(Math.abs(amount))
  if (amount > 0) return '+' + value
  if (amount < 0) return '−' + value
  return value
}
