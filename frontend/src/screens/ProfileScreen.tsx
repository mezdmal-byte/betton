import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Avatar } from '../components/Avatar/Avatar'
import { Chip } from '../components/Chip/Chip'
import { IconButton } from '../components/IconButton/IconButton'
import { accountUser } from '../fixtures/account'
import { formatInteger, formatTon } from '../lib/format'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { useI18n } from '../i18n'
import type { Locale } from '../i18n'
import type { AccountFixture } from '../types/account'
import styles from './ProfileScreen.module.css'

const LANGS: Array<{ id: Locale; label: string }> = [
  { id: 'ru', label: 'RU' },
  { id: 'en', label: 'EN' },
  { id: 'zh', label: '中文' },
]

export type ProfileScreenProps = {
  account?: AccountFixture
  onBack?: () => void
  accountState?: 'ready' | 'unauthenticated'
  onMenu?: (id: string) => void
  locale?: Locale
  onLocaleChange?: (locale: Locale) => void
}

export function ProfileScreen({
  account = accountUser,
  onBack,
  accountState = 'ready',
  onMenu,
  locale,
  onLocaleChange,
}: ProfileScreenProps) {
  const i18n = useI18n()
  const t = i18n.t
  const activeLocale = locale ?? i18n.locale
  const menu = [
    ...(accountState === 'ready'
      ? [
          { id: 'public', label: t('profile.public') },
          { id: 'events', label: t('profile.events') },
          { id: 'wallet', label: t('profile.wallet') },
          { id: 'history', label: t('profile.history') },
          ...(account.isAdmin ? [{ id: 'moderation', label: t('profile.moderation') }] : []),
        ]
      : []),
    { id: 'help', label: t('profile.help') },
  ]

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <IconButton label={t('back')} size="md" onClick={onBack}>
          <ChevronLeft size={22} />
        </IconButton>
        <strong>{t('nav.profile')}</strong>
      </header>
      <div className={styles.body}>
        {accountState === 'unauthenticated' ? (
          <StatusMessage tone="warning" title={t('err.openInTg')}>
            {t('err.openInTgBody')}
          </StatusMessage>
        ) : (
          <>
            <section className={styles.identity}>
              <Avatar initials={account.initials} name={account.displayName} src={account.photoUrl} size="lg" />
              <div className={styles.identityText}>
                <strong>{account.displayName}</strong>
                <span>@{account.handle}</span>
              </div>
            </section>

            <dl className={styles.metrics}>
              <div>
                <dt>{t('account.statEvents')}</dt>
                <dd>{account.eventsCreated == null ? '—' : formatInteger(account.eventsCreated)}</dd>
              </div>
              <div>
                <dt>{t('account.statVolume')}</dt>
                <dd>{account.createdVolumeTon == null ? '—' : formatTon(account.createdVolumeTon)}</dd>
              </div>
              <div>
                <dt>{t('account.creatorIncome')}</dt>
                <dd>{formatTon(account.creatorIncomeTon)}</dd>
              </div>
            </dl>
          </>
        )}

        <nav className={styles.menu} aria-label={t('profile.menu')}>
          {menu.map((item) => (
            <button key={item.id} type="button" className={styles.menuItem} onClick={() => onMenu?.(item.id)}>
              <span>{item.label}</span>
              <ChevronRight size={18} strokeWidth={1.8} aria-hidden="true" />
            </button>
          ))}
        </nav>

        <section className={styles.lang}>
          <span className={styles.sectionLabel}>{t('account.lang')}</span>
          <div className={styles.pills} role="group" aria-label={t('account.lang')}>
            {LANGS.map((item) => (
              <Chip
                key={item.id}
                compact
                selected={item.id === activeLocale}
                onClick={() => (onLocaleChange ?? i18n.setLocale)(item.id)}
              >
                {item.label}
              </Chip>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
