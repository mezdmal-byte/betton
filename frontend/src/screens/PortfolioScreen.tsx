import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '../components/Avatar/Avatar'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { Button } from '../components/Button/Button'
import { IconButton } from '../components/IconButton/IconButton'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { Tabs } from '../components/Tabs/Tabs'
import {
  accountUser,
  portfolioHistory,
  portfolioOrders,
  portfolioPositions,
} from '../fixtures/account'
import { formatOdds, formatTon, formatTonFull } from '../lib/format'
import { formatHistoryTime } from '../lib/time'
import { isMessageKey, useI18n, useT } from '../i18n'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import type {
  AccountFixture,
  HistoryFixture,
  OrderFixture,
  PortfolioTab,
  PositionFixture,
} from '../types/account'
import styles from './PortfolioScreen.module.css'

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
}

export function PortfolioScreen({
  account = accountUser,
  tab = 'positions',
  positions = portfolioPositions,
  orders = portfolioOrders,
  history = portfolioHistory,
  onNavChange,
  onProfileClick,
  onCancelOrder,
  onSelectMarket,
  onDeposit,
  onWithdraw,
  onBack,
  variant = 'tab',
  accountState = 'ready',
  listState = 'ready',
  onRetry,
  cancellingOrderId = null,
}: PortfolioScreenProps) {
  const t = useT()
  const { locale } = useI18n()
  const [currentTab, setCurrentTab] = useState<PortfolioTab>(variant === 'history' ? 'history' : tab)
  const hideNav = variant === 'history'
  const items = currentTab === 'positions' ? positions : currentTab === 'orders' ? orders : history
  const emptyCopy = {
    positions: { title: t('empty.positionsTitle'), body: t('empty.positionsBody') },
    orders: { title: t('empty.ordersTitle'), body: t('empty.ordersBody') },
    history: { title: t('empty.historyTitle'), body: t('empty.historyBody') },
  }

  return (
    <div className={styles.screen}>
      <header className={hideNav ? `${styles.header} ${styles.headerSecondary}` : styles.header}>
        {hideNav ? (
          <IconButton label={t('back')} size="md" onClick={onBack}>
            <ChevronLeft size={22} />
          </IconButton>
        ) : (
          <strong>{t('portfolio.title')}</strong>
        )}
        {hideNav ? (
          <strong>{t('profile.history')}</strong>
        ) : (
          <Avatar
            initials={account.initials}
            name={account.displayName}
            src={account.photoUrl}
            size="md"
            onClick={onProfileClick}
          />
        )}
      </header>

      <div className={styles.body}>
        <section className={styles.hero}>
          <span>{t('account.available')}</span>
          <strong>
            {accountState === 'unauthenticated' || accountState === 'loading'
              ? '—'
              : formatTonFull(account.availableTon)}
          </strong>
          <p className={styles.balanceMeta}>
            {t('account.inPositions')}: {accountState === 'ready' ? formatTon(account.inPositionsTon) : '—'}
            <span>·</span>
            {t('account.reserved')}: {accountState === 'ready' ? formatTon(account.inOrdersTon) : '—'}
          </p>
          <div className={styles.actions}>
            <Button onClick={onDeposit}>{t('account.deposit')}</Button>
            <Button variant="secondary" onClick={onWithdraw}>
              {t('account.withdraw')}
            </Button>
          </div>
        </section>

        <Tabs
          items={[
            { id: 'positions', label: t('portfolio.positions') },
            { id: 'orders', label: t('portfolio.orders') },
            { id: 'history', label: t('portfolio.history') },
          ]}
          value={currentTab}
          onChange={(id) => setCurrentTab(id as PortfolioTab)}
          ariaLabel={t('portfolio.title')}
        />

        {currentTab === 'history' && accountState === 'ready' && account.creatorIncomeTon > 0 ? (
          <section className={styles.creatorIncome}>
            <span>{t('account.creatorIncome')}</span>
            <strong>+{formatTonFull(account.creatorIncomeTon)}</strong>
          </section>
        ) : null}

        {listState === 'loading' ? (
          <StatusMessage tone="loading" title={t('loading')}>
            {t('loading.body')}
          </StatusMessage>
        ) : listState === 'error' ? (
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
        ) : items.length === 0 ? (
          <StatusMessage title={emptyCopy[currentTab].title}>{emptyCopy[currentTab].body}</StatusMessage>
        ) : currentTab === 'positions' ? (
          <ul className={styles.list}>
            {positions.map((item) => (
              <li key={item.id} className={styles.row}>
                <button type="button" className={styles.rowButton} onClick={() => onSelectMarket?.(item.marketId)}>
                  <p className={styles.question}>{item.question}</p>
                  <p className={styles.meta}>
                    <span className={styles.side}>{item.outcomeLabel}</span>
                    <strong>{formatTonFull(item.amountTon)}</strong>
                  </p>
                  <p className={styles.detail}>
                    {t('pos.avgOdds')} {formatOdds(item.avgOdds)} · {t('pos.payout')} {formatTonFull(item.potentialPayoutTon)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        ) : currentTab === 'orders' ? (
          <ul className={styles.list}>
            {orders.map((item) => (
              <li key={item.id} className={styles.row}>
                <p className={styles.question}>{item.question}</p>
                <p className={styles.meta}>
                  <span>{item.outcomeLabel} · {formatOdds(item.odds)}</span>
                  <strong>{formatTonFull(item.remainingTon)}</strong>
                </p>
                <div className={styles.orderFoot}>
                  <span className={styles.status}>
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
                  <strong className={styles.amount}>{formatSigned(item.amountTon)}</strong>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      {hideNav ? null : <BottomNavigation active="portfolio" onChange={onNavChange} />}
    </div>
  )
}

function historyAction(item: HistoryFixture, t: ReturnType<typeof useT>): string {
  const key = item.actionKey ? `tx.${item.actionKey}` : ''
  if (key && isMessageKey(key)) return t(key)
  return item.action
}

function formatSigned(amount: number): string {
  const value = formatTonFull(Math.abs(amount))
  if (amount > 0) return `+${value}`
  if (amount < 0) return `−${value}`
  return value
}
