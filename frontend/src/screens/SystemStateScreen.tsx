import { Button } from '../components/Button/Button'
import { useT } from '../i18n'
import styles from './SystemStateScreen.module.css'

export type SystemStateKind =
  | 'loading'
  | 'network'
  | 'offline'
  | 'retry'
  | 'empty'
  | 'auth'
  | 'auth-expired'
  | 'not-found'
  | 'forbidden'
  | 'maintenance'
  | 'stale'
  | 'processing'
  | 'success'
  | 'insufficient'
  | 'error'

export type SystemStateScreenProps = {
  kind: SystemStateKind
  onRetry?: () => void
  onCancel?: () => void
  title?: string
  body?: string
  actionLabel?: string
}

export function SystemStateScreen({
  kind,
  onRetry,
  onCancel,
  title,
  body,
  actionLabel,
}: SystemStateScreenProps) {
  const t = useT()
  const content = stateContent(kind, t)
  const tone = stateTone(kind)

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1>{title ?? content.title}</h1>
        <span>BETTON · SYSTEM</span>
      </header>

      <main className={styles.body}>
        {kind === 'loading' ? (
          <div className={styles.skeleton} aria-label={t('loading')}>
            <i />
            <i />
            <i />
          </div>
        ) : kind === 'processing' ? (
          <section className={styles.metric}>
            <strong>Обрабатываем</strong>
            <p>{body ?? content.body}</p>
          </section>
        ) : kind === 'success' ? (
          <section className={styles.metric}>
            <strong className={styles.successMetric}>Готово</strong>
            <p>{body ?? content.body}</p>
          </section>
        ) : (
          <section className={styles.stateCard + ' ' + styles['tone_' + tone]}>
            <p>{body ?? content.body}</p>
          </section>
        )}

        {onRetry ? (
          <Button
            fullWidth
            variant={tone === 'danger' ? 'secondary' : undefined}
            onClick={onRetry}
          >
            {actionLabel ?? content.action}
          </Button>
        ) : null}

        {onCancel ? (
          <Button variant="secondary" fullWidth onClick={onCancel}>Отмена</Button>
        ) : null}
      </main>
    </div>
  )
}

function stateContent(kind: SystemStateKind, t: ReturnType<typeof useT>) {
  if (kind === 'loading') return { title: 'Загрузка', body: t('loading.body'), action: t('retry') }
  if (kind === 'offline') return { title: 'Нет подключения', body: 'Показываем последние сохранённые данные.', action: 'Проверить сеть' }
  if (kind === 'network' || kind === 'retry') return { title: 'Ошибка сети', body: t('err.requestBody'), action: t('retry') }
  if (kind === 'auth') return { title: 'Нужен вход', body: 'Авторизуйтесь через Telegram, чтобы продолжить.', action: 'Войти через Telegram' }
  if (kind === 'auth-expired') return { title: 'Сессия истекла', body: t('auth.expiredBody'), action: 'Открыть заново' }
  if (kind === 'not-found') return { title: 'Не найдено', body: t('err.missingBody'), action: 'Назад' }
  if (kind === 'forbidden') return { title: 'Нет доступа', body: t('err.forbiddenBody'), action: 'Назад' }
  if (kind === 'maintenance') return { title: 'Технические работы', body: 'BetTON временно недоступен. Попробуйте позже.', action: t('retry') }
  if (kind === 'stale') return { title: 'Цена изменилась', body: 'Котировка обновилась. Проверьте новую цену перед подтверждением.', action: 'Принять новую цену' }
  if (kind === 'processing') return { title: 'Обработка', body: 'Операция отправлена. Не закрывайте Mini App.', action: t('retry') }
  if (kind === 'success') return { title: 'Готово', body: 'Операция выполнена.', action: 'Продолжить' }
  if (kind === 'insufficient') return { title: 'Недостаточно средств', body: 'Доступного TON недостаточно для этой операции.', action: 'Изменить сумму' }
  if (kind === 'error') return { title: 'Ошибка', body: t('err.requestBody'), action: t('retry') }
  return { title: 'Пусто', body: t('feed.emptyBody'), action: 'Продолжить' }
}

function stateTone(kind: SystemStateKind): 'default' | 'warning' | 'danger' | 'success' {
  if (kind === 'stale' || kind === 'offline' || kind === 'insufficient') return 'warning'
  if (kind === 'error' || kind === 'network' || kind === 'retry' || kind === 'forbidden') return 'danger'
  if (kind === 'success') return 'success'
  return 'default'
}
