import { Button } from '../components/Button/Button'
import styles from './SystemStateScreen.module.css'

export type SystemStateKind =
  | 'loading'
  | 'initial-loading'
  | 'offline'
  | 'retry'
  | 'auth'
  | 'auth-expired'
  | 'not-found'
  | 'market-not-found'
  | 'invalid-share'
  | 'unavailable-unlisted'
  | 'forbidden'
  | 'maintenance'
  | 'stale'
  | 'destructive'
  | 'bottom-sheet'
  | 'modal'
  | 'empty'
  | 'processing'
  | 'success'
  | 'toast-success'
  | 'network'
  | 'insufficient'
  | 'error'
  | 'toast-error'

export type SystemStateScreenProps = {
  kind: SystemStateKind
  onRetry?: () => void
  onCancel?: () => void
  title?: string
  body?: string
  actionLabel?: string
}

type StateContent = {
  title: string
  body: string
  action?: string
  metric?: string
  rows?: string[]
  tone?: 'default' | 'warning' | 'danger' | 'success'
  presentation?: 'standard' | 'skeleton' | 'toast' | 'sheet' | 'modal'
}

export function SystemStateScreen({
  kind,
  onRetry,
  onCancel,
  title,
  body,
  actionLabel,
}: SystemStateScreenProps) {
  const content = stateContent(kind)
  const tone = content.tone ?? 'default'
  const presentation = content.presentation ?? 'standard'

  if (presentation === 'toast') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <h1>BetTON</h1>
          <span>BETTON · SYSTEM</span>
        </header>
        <main className={styles.body}>
          <div className={styles.canvasPlaceholder} />
          <section className={styles.toast + ' ' + styles['tone_' + tone]}>
            <strong>{title ?? content.title}</strong>
            <p>{body ?? content.body}</p>
          </section>
        </main>
      </div>
    )
  }

  if (presentation === 'sheet' || presentation === 'modal') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <h1>BetTON</h1>
          <span>BETTON · SYSTEM</span>
        </header>
        <main className={styles.overlayCanvas}>
          <div className={styles.overlayBackdrop} />
          <section className={presentation === 'sheet' ? styles.sheet : styles.modal}>
            <strong>{title ?? content.title}</strong>
            <p>{body ?? content.body}</p>
            {content.rows?.length ? <Rows rows={content.rows} /> : null}
            {onRetry ? (
              <Button fullWidth onClick={onRetry}>{actionLabel ?? content.action ?? 'Продолжить'}</Button>
            ) : null}
            {onCancel ? <Button variant="secondary" fullWidth onClick={onCancel}>Отмена</Button> : null}
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1>{title ?? content.title}</h1>
        <span>BETTON · SYSTEM</span>
      </header>

      <main className={styles.body}>
        {presentation === 'skeleton' ? (
          <>
            <p className={styles.description}>{body ?? content.body}</p>
            <div className={styles.skeleton} aria-label="Загрузка">
              <i />
              <i />
              <i />
            </div>
          </>
        ) : content.metric ? (
          <section className={styles.metric + ' ' + styles['toneText_' + tone]}>
            <strong>{content.metric}</strong>
            <p>{body ?? content.body}</p>
          </section>
        ) : (
          <section className={styles.stateCard + ' ' + styles['tone_' + tone]}>
            <p>{body ?? content.body}</p>
          </section>
        )}

        {content.rows?.length ? <Rows rows={content.rows} /> : null}

        {onRetry ? (
          <Button
            fullWidth
            variant={tone === 'danger' && kind === 'destructive' ? 'secondary' : undefined}
            onClick={onRetry}
          >
            {actionLabel ?? content.action ?? 'Продолжить'}
          </Button>
        ) : null}

        {onCancel ? (
          <Button variant="secondary" fullWidth onClick={onCancel}>Отмена</Button>
        ) : null}
      </main>
    </div>
  )
}

function Rows({ rows }: { rows: string[] }) {
  return (
    <div className={styles.rows}>
      {rows.map((row, index) => (
        <div key={String(index) + row}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <p>{row}</p>
        </div>
      ))}
    </div>
  )
}

function stateContent(kind: SystemStateKind): StateContent {
  if (kind === 'loading') {
    return {
      title: 'Загрузка рынков',
      body: 'Структура готова, данные ещё загружаются.',
      presentation: 'skeleton',
    }
  }
  if (kind === 'initial-loading') {
    return {
      title: 'Запускаем BetTON',
      metric: '•••',
      body: 'Проверяем сессию и получаем актуальные данные.',
    }
  }
  if (kind === 'offline') {
    return {
      title: 'Нет подключения',
      body: 'Показываем последние сохранённые данные.',
      action: 'Проверить сеть',
      tone: 'warning',
    }
  }
  if (kind === 'retry') {
    return {
      title: 'Повторная попытка',
      metric: '02',
      body: 'Восстанавливаем безопасное соединение.',
      rows: ['Следующая попытка через 4 сек'],
      action: 'Повторить сейчас',
      tone: 'warning',
    }
  }
  if (kind === 'auth') {
    return {
      title: 'Нужен вход',
      body: 'Авторизуйтесь через Telegram, чтобы продолжить.',
      action: 'Войти через Telegram',
    }
  }
  if (kind === 'auth-expired') {
    return {
      title: 'Сессия истекла',
      body: 'Войдите снова. Черновики сохранены.',
      action: 'Войти снова',
      tone: 'warning',
    }
  }
  if (kind === 'not-found') {
    return {
      title: 'Страница не найдена',
      metric: '404',
      body: 'Ссылка неверна или страница была перемещена.',
      action: 'На главную',
    }
  }
  if (kind === 'market-not-found') {
    return {
      title: 'Рынок не найден',
      body: 'Он удалён, скрыт или ссылка устарела.',
      action: 'Смотреть рынки',
      tone: 'warning',
    }
  }
  if (kind === 'invalid-share') {
    return {
      title: 'Ссылка недействительна',
      body: 'Share token повреждён или уже отозван.',
      action: 'Открыть каталог',
      tone: 'danger',
    }
  }
  if (kind === 'unavailable-unlisted') {
    return {
      title: 'Рынок недоступен',
      body: 'Unlisted-ссылка больше не даёт доступ.',
      action: 'Вернуться',
      tone: 'warning',
    }
  }
  if (kind === 'forbidden') {
    return {
      title: 'Доступ запрещён',
      body: 'У вас нет прав для этого раздела.',
      action: 'На главную',
      tone: 'danger',
    }
  }
  if (kind === 'maintenance') {
    return {
      title: 'Технические работы',
      metric: '~15 мин',
      body: 'Обновляем BetTON. Средства и позиции в безопасности.',
      tone: 'warning',
    }
  }
  if (kind === 'stale') {
    return {
      title: 'Цена изменилась',
      body: 'Котировка обновилась. Проверьте новую цену перед подтверждением.',
      action: 'Принять новую цену',
      tone: 'warning',
    }
  }
  if (kind === 'destructive') {
    return {
      title: 'Удалить навсегда?',
      body: 'Действие нельзя отменить.',
      rows: ['Все связанные данные будут удалены'],
      action: 'Удалить навсегда',
      tone: 'danger',
      presentation: 'modal',
    }
  }
  if (kind === 'bottom-sheet') {
    return {
      title: 'Выберите действие',
      body: 'Доступные действия для рынка.',
      presentation: 'sheet',
    }
  }
  if (kind === 'modal') {
    return {
      title: 'Подтвердите действие',
      body: 'Проверьте данные перед продолжением.',
      presentation: 'modal',
    }
  }
  if (kind === 'empty') {
    return {
      title: 'Здесь пока пусто',
      body: 'Измените фильтры или вернитесь позже.',
      action: 'Смотреть рынки',
    }
  }
  if (kind === 'processing') {
    return {
      title: 'Операция обрабатывается',
      metric: '•••',
      body: 'Проверяем статус операции.',
      rows: ['Можно закрыть экран', 'Статус станет доступен после ответа backend'],
    }
  }
  if (kind === 'success') {
    return {
      title: 'Готово',
      metric: '✓',
      body: 'Операция успешно завершена.',
      action: 'Продолжить',
      tone: 'success',
    }
  }
  if (kind === 'toast-success') {
    return {
      title: 'Рынок сохранён',
      body: 'Изменения синхронизированы.',
      tone: 'success',
      presentation: 'toast',
    }
  }
  if (kind === 'network') {
    return {
      title: 'Ошибка сети',
      body: 'Не удалось получить ответ сервера.',
      action: 'Повторить',
      tone: 'danger',
    }
  }
  if (kind === 'insufficient') {
    return {
      title: 'Недостаточно TON',
      body: 'Для сделки недостаточно доступного баланса.',
      rows: ['Измените сумму или пополните баланс'],
      action: 'Изменить сумму',
      tone: 'warning',
    }
  }
  if (kind === 'toast-error') {
    return {
      title: 'Не удалось сохранить',
      body: 'Проверьте сеть и повторите.',
      tone: 'danger',
      presentation: 'toast',
    }
  }
  return {
    title: 'Что-то пошло не так',
    metric: '!',
    body: 'Данные не изменены. Попробуйте снова.',
    action: 'Повторить',
    tone: 'danger',
  }
}
