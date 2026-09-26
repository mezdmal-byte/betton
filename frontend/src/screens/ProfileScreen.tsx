import { ChevronRight, UserRound } from 'lucide-react'
import { Avatar } from '../components/Avatar/Avatar'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { Chip } from '../components/Chip/Chip'
import { Button } from '../components/Button/Button'
import { ThemeToggle } from '../components/ThemeToggle/ThemeToggle'
import { accountUser } from '../fixtures/account'
import { useI18n, type Locale } from '../i18n'
import { formatInteger, formatTonFull } from '../lib/format'
import { useTheme } from '../theme/ThemeProvider'
import type { AccountFixture } from '../types/account'
import styles from './ProfileScreen.module.css'

const LANGS: Array<{ id: Locale; label: string }> = [
  { id: 'ru', label: 'RU' },
  { id: 'en', label: 'EN' },
  { id: 'zh', label: '中文' },
]

export type ProfileView = 'main' | 'settings'

export type ProfileScreenProps = {
  account?: AccountFixture
  onBack?: () => void
  accountState?: 'ready' | 'unauthenticated'
  onMenu?: (id: string) => void
  onNavChange?: (id: NavId) => void
  locale?: Locale
  onLocaleChange?: (locale: Locale) => void
  onLogin?: () => void
  view?: ProfileView
}

export function ProfileScreen({
  account = accountUser,
  accountState = 'ready',
  onMenu,
  onNavChange,
  locale,
  onLocaleChange,
  onLogin,
  view = 'main',
}: ProfileScreenProps) {
  const i18n = useI18n()
  const t = i18n.t
  const activeLocale = locale ?? i18n.locale
  const theme = useTheme()

  if (view === 'settings') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <h1>{t('settings.title')}</h1>
          </div>
          <p>{t('settings.subtitle')}</p>
        </header>

        <main className={styles.body}>
          <section className={styles.themeSetting}>
            <strong>{t('theme.label')}</strong>
            <div className={styles.themeOptions} role="radiogroup" aria-label={t('theme.label')}>
              {(['system', 'dark', 'light'] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  className={theme.preference === id ? styles.themeSelected : undefined}
                  aria-pressed={theme.preference === id}
                  onClick={() => theme.setPreference(id)}
                >
                  {id === 'system' ? t('theme.system') : id === 'dark' ? t('theme.dark') : t('theme.light')}
                </button>
              ))}
            </div>
            <small>{t('theme.hint')}</small>
          </section>

          <section className={styles.settingBlock}>
            <div className={styles.settingTitleRow}>
              <span>{t('account.lang')}</span>
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
            </div>
          </section>

          <button type="button" className={styles.destination} onClick={() => onNavChange?.('notifications')}>
            <span>
              <strong>{t('settings.notifications')}</strong>
              <small>{t('settings.notificationsMeta')}</small>
            </span>
            <ChevronRight size={18} strokeWidth={1.7} aria-hidden="true" />
          </button>
          <div className={styles.destinationStatic}>
            <span>
              <strong>{t('settings.security')}</strong>
              <small>{t('settings.securityMeta')}</small>
            </span>
            <ChevronRight size={18} strokeWidth={1.7} aria-hidden="true" />
          </div>
          <div className={styles.destinationStatic}>
            <span>
              <strong>{t('settings.about')}</strong>
              <small>{t('settings.aboutMeta')}</small>
            </span>
            <ChevronRight size={18} strokeWidth={1.7} aria-hidden="true" />
          </div>
        </main>

        <BottomNavigation active="profile" onChange={onNavChange} />
      </div>
    )
  }

  const eventsMeta =
    account.eventsCreated == null
      ? '—'
      : t('profile.eventsMeta', { n: formatInteger(account.eventsCreated) })

  const menu = [
    ...(accountState === 'ready'
      ? [
          { id: 'events', label: t('profile.events'), meta: eventsMeta },
          { id: 'wallet', label: t('profile.wallet'), meta: t('profile.walletMeta'), disabled: true },
          { id: 'history', label: t('profile.history'), meta: t('profile.historyMeta') },
        ]
      : []),
    { id: 'help', label: t('profile.help'), meta: t('profile.helpMeta') },
    { id: 'settings', label: t('profile.settings'), meta: t('profile.settingsMeta') },
    ...(account.isAdmin
      ? [{ id: 'moderation', label: t('profile.moderation'), meta: t('profile.moderationMeta') }]
      : []),
  ]

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1>{t('nav.profile')}</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className={styles.body}>
        {accountState === 'unauthenticated' ? (
          <section className={styles.guest}>
            <UserRound size={52} strokeWidth={1.5} aria-hidden="true" />
            <h2>{t('profile.loginTitle')}</h2>
            <p>{t('profile.loginBody')}</p>
            <Button fullWidth onClick={onLogin} disabled={!onLogin}>
              {t('profile.loginAction')}
            </Button>
          </section>
        ) : (
          <>
            <section className={styles.identity}>
              <Avatar
                initials={account.initials}
                name={account.displayName}
                src={account.photoUrl}
                size="lg"
              />
              <div className={styles.identityText}>
                <strong>@{account.handle}</strong>
                <span>{account.isAdmin ? t('profile.creatorModerator') : t('profile.creator')}</span>
              </div>
            </section>

            <dl className={styles.metrics}>
              <div>
                <dd>{account.eventsCreated == null ? '—' : formatInteger(account.eventsCreated)}</dd>
                <dt>{t('profile.createdMarkets')}</dt>
              </div>
              <div>
                <dd>{account.activeMarkets == null ? '—' : formatInteger(account.activeMarkets)}</dd>
                <dt>{t('profile.activeMarkets')}</dt>
              </div>
              <div>
                <dd>
                  {account.createdVolumeTon == null
                    ? '—'
                    : formatTonFull(account.createdVolumeTon).replace(' TON', '')}
                </dd>
                <dt>{t('profile.tradingVolumeTon')}</dt>
              </div>
            </dl>

            <nav className={styles.menu} aria-label={t('profile.menu')}>
              {menu.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.destination}
                  disabled={'disabled' in item && Boolean(item.disabled)}
                  onClick={() => onMenu?.(item.id)}
                >
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.meta}</small>
                  </span>
                  <ChevronRight size={18} strokeWidth={1.7} aria-hidden="true" />
                </button>
              ))}
            </nav>
          </>
        )}
      </main>

      <BottomNavigation active="profile" onChange={onNavChange} />
    </div>
  )
}
