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
} from '../types/account'
import styles from './PortfolioScreen.module.css'

type PortfolioView = 'overview' | PortfolioTab

export type PortfolioScreenProps = {
  account?: AccountFixture
  tab?: PortfolioTab
  positions?: PositionFixture[]
  orders?: OrderFixture[]
  history?: HistoryFixture[]
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
              <span>ОБЗОР</span>
              <h1>{view === 'overview' ? 'Портфель' : viewLabel(view, t)}</h1>
            </div>
            {view === 'overview' ? <ThemeToggle /> : null}
          </>
        )}
      </header>

      <main className={styles.body}>
        {accountState === 'unauthenticated' ? (
          <StatusMessage tone="warning" title={t('err.openInTg')}>
            {t('err.openInTgBody')}
          </StatusMessage>
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
                  onClick={() => onSelectMarket?.(positions[0]!.marketId)}
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
                <button type="button" className={styles.previewRow} onClick={() => setView('orders')}>
                  <strong>{orders[0].outcomeLabel} · {orders[0].question}</strong>
                  <span>
                    {formatOdds(orders[0].odds)}× · исполнено {formatTonFull(orders[0].filledTon)} · остаток {formatTonFull(orders[0].remainingTon)}
                  </span>
                </button>
              ) : (
                <p className={styles.emptyLine}>{t('empty.ordersTitle')}</p>
              )}
            </section>
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
                      <button type="button" className={styles.rowButton} onClick={() => onSelectMarket?.(item.marketId)}>
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
                      <p className={styles.question}>{item.question}</p>
                      <p className={styles.meta}>
                        <span>{item.outcomeLabel} · {formatOdds(item.odds)}×</span>
                        <strong>{formatTonFull(item.remainingTon)}</strong>
                      </p>
                      <div className={styles.orderFoot}>
                        <span className={styles.detail}>
                          {item.filledTon > 0 && item.remainingTon > 0 ? t('order.partial') : t('order.wait')}
                        </span>
                        {item.canCancel ? (
                          <Button
                            variant="ghost"
                            size="md"
                            disabled={cancellingOrderId === item.id}
                            onClick={() => onCancelOrder?.(item)}
                          >
                            {cancellingOrderId === item.id ? t('order.cancelling') : t('order.cancel')}
                          </Button>
                        ) : null}
                      </div>
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
          </>
        )}
      </main>

      {hideNav ? null : <BottomNavigation active="portfolio" onChange={onNavChange} />}
    </div>
  )
}

function viewLabel(view: Exclude<PortfolioView, 'overview'>, t: ReturnType<typeof useT>): string {
  if (view === 'positions') return t('portfolio.positions')
  if (view === 'orders') return t('portfolio.orders')
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
