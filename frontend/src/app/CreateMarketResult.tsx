import { CircleHelp } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { copyShareLink, shareExternally } from '../api/share'
import type { MarketOut } from '../api/types'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { Button } from '../components/Button/Button'
import styles from './CreateMarketResult.module.css'

type ResultView = 'status' | 'share-token' | 'share-link' | 'share-success' | 'share-failed'

export function CreateMarketResult({
  market,
  shareLink,
  onOpen,
  onBack,
  onToFeed,
  onNavChange,
}: {
  market: MarketOut
  shareLink: string
  onOpen: () => void
  onBack: () => void
  onToFeed: () => void
  onNavChange?: (id: NavId) => void
}) {
  const [view, setView] = useState<ResultView>('status')
  const unlisted = market.visibility === 'unlisted'
  const source = useMemo(() => extractPrimarySource(market.description), [market.description])

  if (view === 'share-token') {
    const token = (market.share_token || '').trim()
    return (
      <ResultShell title="Share token" onBack={() => setView('status')} onNavChange={onNavChange}>
        <Rows
          rows={[
            token ? 'TOKEN · ' + token : 'Share token недоступен',
            'Точный регистр обязателен',
            'Токен открывает только рынок M-' + market.id,
            'Передавайте токен только тем, кому нужен доступ',
          ]}
        />
        <Button
          fullWidth
          disabled={!token}
          onClick={() => {
            void copyShareLink(token).then((ok) => setView(ok ? 'share-success' : 'share-failed'))
          }}
        >
          Копировать токен
        </Button>
      </ResultShell>
    )
  }

  if (view === 'share-link') {
    return (
      <ResultShell title="Ссылка на рынок" onBack={() => setView('status')} onNavChange={onNavChange}>
        <Rows
          rows={[
            shareLink || 'Ссылка недоступна',
            unlisted ? 'Unlisted · не индексируется' : 'Public · доступен из discovery',
            market.share_token ? 'Ссылка содержит точный share token' : 'Share token недоступен',
            'Доступна любому получателю точной ссылки',
          ]}
        />
        {shareLink ? (
          <input
            className={styles.shareInput}
            readOnly
            value={shareLink}
            onFocus={(event) => event.currentTarget.select()}
          />
        ) : null}
        <Button
          fullWidth
          disabled={!shareLink}
          onClick={() => {
            void copyShareLink(shareLink).then((ok) => setView(ok ? 'share-success' : 'share-failed'))
          }}
        >
          Копировать ссылку
        </Button>
        <Button
          variant="secondary"
          fullWidth
          disabled={!market.share_token}
          onClick={() => setView('share-token')}
        >
          Показать share token
        </Button>
        <Button
          variant="secondary"
          fullWidth
          disabled={!shareLink}
          onClick={() => {
            if (!shareExternally(shareLink)) setView('share-failed')
          }}
        >
          Отправить в Telegram
        </Button>
      </ResultShell>
    )
  }

  if (view === 'share-success') {
    return (
      <ResultShell title="Ссылка скопирована" onBack={() => setView('status')} onNavChange={onNavChange}>
        <Rows
          rows={[
            'Готово · данные в буфере обмена',
            unlisted ? 'Рынок остаётся скрытым из discovery' : 'Публичный рынок остаётся доступен в discovery',
            'Получатель откроет точный рынок M-' + market.id,
          ]}
        />
        <Button fullWidth onClick={() => setView('status')}>Готово</Button>
      </ResultShell>
    )
  }

  if (view === 'share-failed') {
    return (
      <ResultShell title="Не удалось поделиться" onBack={() => setView('status')} onNavChange={onNavChange}>
        <Rows
          rows={[
            'Системное меню или буфер обмена недоступны',
            market.share_token ? 'Share token не изменился' : 'Share token недоступен',
            'Можно повторить или скопировать ссылку вручную',
          ]}
          dangerLast
        />
        {shareLink ? (
          <input
            className={styles.shareInput}
            readOnly
            value={shareLink}
            onFocus={(event) => event.currentTarget.select()}
          />
        ) : null}
        <Button fullWidth onClick={() => setView('share-link')}>Повторить</Button>
      </ResultShell>
    )
  }

  const status = buildStatusView(market, source)

  return (
    <ResultShell title={status.title} onBack={onBack} onNavChange={onNavChange}>
      {status.metric ? (
        <section className={styles.metric}>
          <strong className={styles['tone_' + status.tone]}>{status.metric}</strong>
          <span>{status.metricCaption}</span>
        </section>
      ) : null}

      <Rows rows={status.rows} tone={status.tone} />

      {status.notice ? (
        <section className={styles.notice}>
          <CircleHelp size={16} strokeWidth={1.7} aria-hidden="true" />
          <p>{status.notice}</p>
        </section>
      ) : null}

      {market.status === 'open' && unlisted ? (
        <>
          <Button fullWidth disabled={!shareLink} onClick={() => setView('share-link')}>
            Поделиться
          </Button>
          <Button
            variant="secondary"
            fullWidth
            disabled={!market.share_token}
            onClick={() => setView('share-token')}
          >
            Share token
          </Button>
          <Button variant="secondary" fullWidth onClick={onOpen}>
            Открыть рынок
          </Button>
        </>
      ) : market.status === 'rejected' && market.rejection_reason ? (
        <>
          <Button fullWidth onClick={onBack}>Редактировать</Button>
          <Button variant="secondary" fullWidth onClick={onOpen}>К моим рынкам</Button>
        </>
      ) : (
        <Button fullWidth onClick={onOpen}>
          {status.primaryLabel}
        </Button>
      )}

      <Button variant="secondary" fullWidth onClick={onToFeed}>
        К ленте рынков
      </Button>
    </ResultShell>
  )
}

function ResultShell({
  title,
  onBack,
  onNavChange,
  children,
}: {
  title: string
  onBack: () => void
  onNavChange?: (id: NavId) => void
  children: ReactNode
}) {
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.contextRow}>
          <button type="button" onClick={onBack}>← Назад</button>
          <span className={styles.brand}><b>Bet</b><b>TON</b></span>
        </div>
        <h1>{title}</h1>
      </header>
      <main className={styles.body}>{children}</main>
      <BottomNavigation active="create" onChange={onNavChange} />
    </div>
  )
}

function Rows({
  rows,
  tone = 'default',
  dangerLast = false,
}: {
  rows: string[]
  tone?: 'success' | 'warning' | 'danger' | 'default'
  dangerLast?: boolean
}) {
  return (
    <section className={styles.rows}>
      {rows.filter(Boolean).map((row, index) => (
        <div key={String(index) + row}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <p
            className={
              index === 0 && tone !== 'default'
                ? styles['tone_' + tone]
                : dangerLast && index === rows.length - 1
                  ? styles.tone_danger
                  : undefined
            }
          >
            {row}
          </p>
        </div>
      ))}
    </section>
  )
}

function buildStatusView(
  market: MarketOut,
  source: string,
): {
  title: string
  rows: string[]
  notice?: string
  primaryLabel: string
  tone: 'success' | 'warning' | 'danger' | 'default'
  metric?: string
  metricCaption?: string
} {
  const id = 'M-' + market.id
  const visibility = market.visibility === 'unlisted' ? 'Unlisted' : 'Public'

  if (market.status === 'pending') {
    return {
      title: 'На модерации',
      tone: 'warning',
      rows: [
        'Рынок #' + id + ' принят',
        'Статус · Pending moderation',
        'Не виден в публичной ленте',
        'Статус можно отслеживать в «Мои рынки»',
      ],
      notice: 'До решения модерации рынок не участвует в публичном discovery.',
      primaryLabel: 'Мои рынки',
    }
  }

  if (market.status === 'rejected') {
    if (market.rejection_reason) {
      return {
        title: 'Нужно уточнение',
        tone: 'danger',
        rows: [
          'Причина · ' + market.rejection_reason,
          'Статус · Rejected',
          'Видимость · ' + visibility,
          'Исправьте отмеченные поля и отправьте повторно',
        ],
        notice: 'Причина отклонения пришла из модерации.',
        primaryLabel: 'К моим рынкам',
      }
    }
    return {
      title: 'Рынок отклонён',
      tone: 'danger',
      rows: [
        'Market ID · ' + id,
        'Статус · Rejected',
        'Не опубликован',
        'Причина отклонения не указана',
      ],
      primaryLabel: 'К моим рынкам',
    }
  }

  if (market.status === 'closed') {
    return {
      title: 'Торги закрыты',
      tone: 'warning',
      rows: [
        'Статус · Closed',
        'Новые ордера не принимаются',
        'Ожидаем результат рынка',
        'Позиции ждут расчёта',
      ],
      primaryLabel: 'Смотреть рынок',
    }
  }

  if (market.status === 'resolved') {
    return {
      title: 'Рынок рассчитан',
      tone: 'success',
      metric: market.winning_outcome || 'Результат',
      metricCaption: 'победивший исход',
      rows: [
        market.winning_outcome ? 'Результат · ' + market.winning_outcome : 'Результат зафиксирован',
        source ? 'Источник · ' + source : '',
        'Статус · Resolved',
        'P2P расчёт завершён',
      ],
      primaryLabel: 'Посмотреть расчёт',
    }
  }

  if (market.status === 'cancelled') {
    return {
      title: 'Рынок аннулирован',
      tone: 'danger',
      rows: [
        'Статус · Voided / Cancelled',
        market.cancellation_reason ? 'Причина · ' + market.cancellation_reason : 'Причина не указана',
        'Неисполненные обязательства закрыты',
        'Рынок больше не принимает ордера',
      ],
      primaryLabel: 'Посмотреть рынок',
    }
  }

  if (market.visibility === 'unlisted') {
    return {
      title: 'Unlisted рынок создан',
      tone: 'success',
      rows: [
        'Market ID · ' + id,
        'Discovery · скрыт',
        'Поиск · скрыт',
        market.share_token ? 'Доступ · точный share token / link' : 'Share token недоступен',
      ],
      notice: 'Это не allowlist. Любой с точной ссылкой сможет открыть рынок.',
      primaryLabel: 'Поделиться',
    }
  }

  return {
    title: 'Публичный рынок создан',
    tone: 'success',
    rows: [
      'Market ID · ' + id,
      'Видимость · Public',
      'Discovery · включён',
      market.accepting_bets === false ? 'Торги сейчас не принимаются' : 'Торги P2P открыты',
    ],
    notice: 'Рынок доступен в поиске, категории и публичной ленте.',
    primaryLabel: 'Открыть рынок',
  }
}

function extractPrimarySource(description: string): string {
  const parts = (description || '').split(/\n{2,}/).map((part) => part.trim())
  const source = parts.find((part) => part.startsWith('Основной источник:'))
  return source ? source.slice('Основной источник:'.length).trim() : ''
}
