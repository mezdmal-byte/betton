import { ChevronRight } from 'lucide-react'
import { Avatar } from '../components/Avatar/Avatar'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { Chip } from '../components/Chip/Chip'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
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
  view?: ProfileView
}

export function ProfileScreen({
  account = accountUser,
  accountState = 'ready',
  onMenu,
  onNavChange,
  locale,
  onLocaleChange,
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
            <h1>Настройки</h1>
          </div>
          <p>Аккаунт и приложение</p>
        </header>

        <main className={styles.body}>
          <section className={styles.themeSetting}>
            <strong>Тема</strong>
            <div className={styles.themeOptions} role="radiogroup" aria-label="Тема">
              {(['system', 'dark', 'light'] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  className={theme.preference === id ? styles.themeSelected : undefined}
                  aria-pressed={theme.preference === id}
                  onClick={() => theme.setPreference(id)}
                >
                  {id === 'system' ? 'System' : id === 'dark' ? 'Dark' : 'Light'}
                </button>
              ))}
            </div>
            <small>Dark A · Light C — Porcelain &amp; Cobalt</small>
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
              <strong>Уведомления</strong>
              <small>События внутри приложения</small>
            </span>
            <ChevronRight size={18} strokeWidth={1.7} aria-hidden="true" />
          </button>
          <div className={styles.destinationStatic}>
            <span>
              <strong>Безопасность</strong>
              <small>Сессии Telegram</small>
            </span>
            <ChevronRight size={18} strokeWidth={1.7} aria-hidden="true" />
          </div>
          <div className={styles.destinationStatic}>
            <span>
              <strong>О приложении</strong>
              <small>Версия 1.0 staging</small>
            </span>
            <ChevronRight size={18} strokeWidth={1.7} aria-hidden="true" />
          </div>
        </main>

        <BottomNavigation active="profile" onChange={onNavChange} />
      </div>
    )
  }

  const eventsMeta =
    account.eventsCreated == null ? '—' : formatInteger(account.eventsCreated) + ' рынков'

  const menu = [
    ...(accountState === 'ready'
      ? [
          { id: 'events', label: t('profile.events'), meta: eventsMeta },
          { id: 'wallet', label: t('profile.wallet'), meta: 'Скоро · FUTURE', disabled: true },
          { id: 'history', label: t('profile.history'), meta: 'Сделки и расчёты' },
        ]
      : []),
    { id: 'help', label: t('profile.help'), meta: 'Механика, комиссия, правила' },
    { id: 'settings', label: 'Настройки', meta: 'Параметры профиля' },
    ...(account.isAdmin
      ? [{ id: 'moderation', label: t('profile.moderation'), meta: 'Доступ администратора' }]
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
          <StatusMessage tone="warning" title={t('err.openInTg')}>
            {t('err.openInTgBody')}
          </StatusMessage>
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
                <span>{account.isAdmin ? 'Создатель · модератор' : 'Создатель'}</span>
              </div>
            </section>

            <dl className={styles.metrics}>
              <div>
                <dd>{account.eventsCreated == null ? '—' : formatInteger(account.eventsCreated)}</dd>
                <dt>Рынков создано</dt>
              </div>
              <div>
                <dd>{account.activeMarkets == null ? '—' : formatInteger(account.activeMarkets)}</dd>
                <dt>Активных</dt>
              </div>
              <div>
                <dd>
                  {account.createdVolumeTon == null
                    ? '—'
                    : formatTonFull(account.createdVolumeTon).replace(' TON', '')}
                </dd>
                <dt>Объём сделок · TON</dt>
              </div>
            </dl>
          </>
        )}

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
      </main>

      <BottomNavigation active="profile" onChange={onNavChange} />
    </div>
  )
}
