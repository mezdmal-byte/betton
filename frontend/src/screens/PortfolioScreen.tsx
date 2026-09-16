import { useState } from 'react'
import { Avatar } from '../components/Avatar/Avatar'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { Button } from '../components/Button/Button'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { Tabs } from '../components/Tabs/Tabs'
import {
  accountUser,
  portfolioHistory,
  portfolioOrders,
  portfolioPositions,
} from '../fixtures/account'
import { formatOdds, formatTon, formatTonFull } from '../lib/format'
import type {
  AccountFixture,
  HistoryFixture,
  OrderFixture,
  PortfolioTab,
  PositionFixture,
} from '../types/account'
import styles from './PortfolioScreen.module.css'

const TABS = [
  { id: 'positions', label: 'Позиции' },
  { id: 'orders', label: 'Заявки' },
  { id: 'history', label: 'История' },
] as const

const EMPTY: Record<PortfolioTab, { title: string; body: string }> = {
  positions: {
    title: 'Нет позиций',
    body: 'Исполненные ставки появятся здесь.',
  },
  orders: {
    title: 'Нет активных заявок',
    body: 'Когда вы разместите свою цену, заявка появится здесь.',
  },
  history: {
    title: 'История пуста',
    body: 'Операции по ставкам и выплатам появятся здесь.',
  },
}

export type PortfolioScreenProps = {
  account?: AccountFixture
  tab?: PortfolioTab
  positions?: PositionFixture[]
  orders?: OrderFixture[]
  history?: HistoryFixture[]
}

export function PortfolioScreen({
  account = accountUser,
  tab = 'positions',
  positions = portfolioPositions,
  orders = portfolioOrders,
  history = portfolioHistory,
}: PortfolioScreenProps) {
  const [currentTab, setCurrentTab] = useState<PortfolioTab>(tab)
  const items =
    currentTab === 'positions' ? positions : currentTab === 'orders' ? orders : history

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.brand}>
          Bet<span>TON</span>
        </h1>
        <Avatar initials={account.initials} name={account.displayName} size="md" />
      </header>
      <div className={styles.body}>
        <section className={styles.hero}>
          <span>Доступно</span>
          <strong>{formatTonFull(account.availableTon)}</strong>
        </section>
        <dl className={styles.metrics}>
          <div>
            <dt>В позициях</dt>
            <dd>{formatTon(account.inPositionsTon)}</dd>
          </div>
          <div>
            <dt>В заявках</dt>
            <dd>{formatTon(account.inOrdersTon)}</dd>
          </div>
          <div>
            <dt>Доход автора</dt>
            <dd>{formatTon(account.creatorIncomeTon)}</dd>
          </div>
        </dl>
        <div className={styles.actions}>
          <Button>Пополнить</Button>
          <Button variant="secondary">Вывести</Button>
        </div>
        <Tabs
          items={[...TABS]}
          value={currentTab}
          onChange={(id) => setCurrentTab(id as PortfolioTab)}
          ariaLabel="Портфель"
        />
        {items.length === 0 ? (
          <StatusMessage title={EMPTY[currentTab].title}>{EMPTY[currentTab].body}</StatusMessage>
        ) : currentTab === 'positions' ? (
          <ul className={styles.list}>
            {positions.map((item) => (
              <li key={item.id} className={styles.row}>
                <p className={styles.question}>{item.question}</p>
                <p className={styles.meta}>
                  {item.outcomeLabel}
                  <span>{formatTonFull(item.amountTon)}</span>
                </p>
                <p className={styles.detail}>
                  Средний коэффициент {formatOdds(item.avgOdds)}
                </p>
                <p className={styles.detail}>
                  Потенциальная выплата {formatTonFull(item.potentialPayoutTon)}
                </p>
              </li>
            ))}
          </ul>
        ) : currentTab === 'orders' ? (
          <ul className={styles.list}>
            {orders.map((item) => (
              <li key={item.id} className={styles.row}>
                <p className={styles.question}>{item.question}</p>
                <p className={styles.meta}>
                  {item.outcomeLabel} · {formatOdds(item.odds)}
                  <span>{formatTonFull(item.remainingTon)}</span>
                </p>
                <div className={styles.orderFoot}>
                  <span className={styles.status}>{item.status}</span>
                  <Button variant="ghost" size="md">
                    Отменить
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className={styles.list}>
            {history.map((item) => (
              <li key={item.id} className={styles.row}>
                <p className={styles.question}>{item.question}</p>
                <p className={styles.meta}>
                  {item.action}
                  <span className={styles.amount}>{formatSigned(item.amountTon)}</span>
                </p>
                <p className={styles.time}>{item.time}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <BottomNavigation active="portfolio" />
    </div>
  )
}

function formatSigned(amount: number): string {
  const value = formatTonFull(Math.abs(amount))
  if (amount > 0) return `+${value}`
  if (amount < 0) return `−${value}`
  return value
}
