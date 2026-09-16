import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Avatar } from '../components/Avatar/Avatar'
import { Chip } from '../components/Chip/Chip'
import { IconButton } from '../components/IconButton/IconButton'
import { accountUser } from '../fixtures/account'
import { CREATOR_SHARE_COMPACT } from '../lib/constants'
import { formatInteger, formatTon } from '../lib/format'
import type { AccountFixture } from '../types/account'
import styles from './ProfileScreen.module.css'

const LANGS = [
  { id: 'ru', label: 'RU' },
  { id: 'en', label: 'EN' },
  { id: 'zh', label: '中文' },
] as const

export type ProfileScreenProps = {
  account?: AccountFixture
}

export function ProfileScreen({ account = accountUser }: ProfileScreenProps) {
  const menu = [
    { id: 'public', label: 'Публичный профиль' },
    { id: 'events', label: 'Мои события' },
    { id: 'wallet', label: 'Кошелёк' },
    ...(account.isAdmin ? [{ id: 'moderation', label: 'Модерация' }] : []),
    { id: 'help', label: 'Помощь' },
  ]

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <IconButton label="Назад" size="md">
          <ChevronLeft size={22} />
        </IconButton>
        <strong>Профиль</strong>
      </header>
      <div className={styles.body}>
        <section className={styles.identity}>
          <Avatar initials={account.initials} name={account.displayName} size="lg" />
          <div className={styles.identityText}>
            <strong>{account.displayName}</strong>
            <span>@{account.handle}</span>
          </div>
        </section>

        <dl className={styles.metrics}>
          <div>
            <dt>События</dt>
            <dd>{formatInteger(account.eventsCreated)}</dd>
          </div>
          <div>
            <dt>Оборот</dt>
            <dd>{formatTon(account.createdVolumeTon)}</dd>
          </div>
          <div>
            <dt>Доход автора</dt>
            <dd>{formatTon(account.creatorIncomeTon)}</dd>
          </div>
        </dl>
        <p className={styles.fee}>{CREATOR_SHARE_COMPACT}</p>

        <nav className={styles.menu} aria-label="Профиль">
          {menu
            .filter((item) => item.id !== 'help')
            .map((item) => (
              <button key={item.id} type="button" className={styles.menuItem}>
                <span>{item.label}</span>
                <ChevronRight size={18} strokeWidth={1.8} aria-hidden="true" />
              </button>
            ))}
        </nav>

        <section className={styles.lang}>
          <span className={styles.sectionLabel}>Язык</span>
          <div className={styles.pills} role="group" aria-label="Язык">
            {LANGS.map((item) => (
              <Chip key={item.id} compact selected={item.id === 'ru'}>
                {item.label}
              </Chip>
            ))}
          </div>
        </section>

        <nav className={styles.menu} aria-label="Справка">
          <button type="button" className={styles.menuItem}>
            <span>Помощь</span>
            <ChevronRight size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </nav>
      </div>
    </div>
  )
}
