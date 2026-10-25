import { MessageCircle, Paperclip, Reply, Send, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChatMessageOut } from '../api/types'
import styles from './ChatScreen.module.css'

export type ChatAttachableMarket = { id: number; question: string }

export type ChatScreenProps = {
  title: string
  subtitle?: string
  messages: ChatMessageOut[]
  currentUserId?: number
  isAdmin?: boolean
  loading?: boolean
  error?: boolean
  sending?: boolean
  lobby?: boolean
  hasMore?: boolean
  attachableMarkets?: ChatAttachableMarket[]
  showInternalBack?: boolean
  onBack?: () => void
  onLoadOlder?: () => void
  onRetry?: () => void
  onSend: (input: { text: string; replyToId?: number; attachedMarketId?: number }) => void
  onDelete: (messageId: number) => void
  onOpenMarket?: (marketId: number) => void
}

export function ChatScreen({
  title,
  subtitle,
  messages,
  currentUserId,
  isAdmin = false,
  loading = false,
  error = false,
  sending = false,
  lobby = false,
  hasMore = false,
  attachableMarkets = [],
  showInternalBack = true,
  onBack,
  onLoadOlder,
  onRetry,
  onSend,
  onDelete,
  onOpenMarket,
}: ChatScreenProps) {
  const [draft, setDraft] = useState('')
  const [replyToId, setReplyToId] = useState<number | undefined>()
  const [attachOpen, setAttachOpen] = useState(false)
  const [attachedMarketId, setAttachedMarketId] = useState<number | undefined>()
  const messagesRef = useRef<HTMLElement | null>(null)
  const initializedScrollRef = useRef(false)
  const nearBottomRef = useRef(true)
  const lastMessageId = messages[messages.length - 1]?.id ?? 0

  useEffect(() => {
    const element = messagesRef.current
    if (!element) return
    if (!initializedScrollRef.current) {
      element.scrollTop = element.scrollHeight
      initializedScrollRef.current = true
      nearBottomRef.current = true
      return
    }
    if (nearBottomRef.current) {
      element.scrollTop = element.scrollHeight
    }
  }, [lastMessageId])

  const replyTo = useMemo(
    () => messages.find((message) => message.id === replyToId),
    [messages, replyToId],
  )
  const attachedMarket = attachableMarkets.find((market) => market.id === attachedMarketId)

  const submit = () => {
    const text = draft.trim()
    if (!text || sending) return
    onSend({ text, replyToId, attachedMarketId })
    setDraft('')
    setReplyToId(undefined)
    setAttachedMarketId(undefined)
    setAttachOpen(false)
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        {showInternalBack ? <button type="button" className={styles.back} onClick={onBack}>‹</button> : null}
        <div>
          <strong>{title}</strong>
          {subtitle ? <span>{subtitle}</span> : null}
        </div>
      </header>

      <main
        ref={messagesRef}
        className={styles.messages}
        onScroll={(event) => {
          const element = event.currentTarget
          nearBottomRef.current =
            element.scrollHeight - element.scrollTop - element.clientHeight < 90
        }}
      >
        {lobby ? <p className={styles.limitNote}>Показываем последние 100 сообщений.</p> : null}
        {!lobby && hasMore ? (
          <button type="button" className={styles.loadOlder} onClick={onLoadOlder}>
            Показать более ранние сообщения
          </button>
        ) : null}
        {loading && messages.length === 0 ? <div className={styles.state}>Загружаем сообщения…</div> : null}
        {error && messages.length === 0 ? (
          <button type="button" className={styles.stateButton} onClick={onRetry}>Не удалось загрузить. Повторить</button>
        ) : null}
        {!loading && !error && messages.length === 0 ? (
          <div className={styles.empty}>
            <MessageCircle size={24} />
            <strong>Пока тихо</strong>
            <span>Начните обсуждение первым.</span>
          </div>
        ) : null}

        {messages.map((message) => {
          const own = message.author.id === currentUserId
          const canDelete = !message.deleted && (own || isAdmin)
          return (
            <article key={message.id} className={own ? styles.messageOwn : styles.message}>
              <div className={styles.messageMeta}>
                <strong>{message.author.display_name}</strong>
                {message.author.is_admin ? <small>admin</small> : null}
                <time>{formatMessageTime(message.created_at)}</time>
              </div>

              {message.reply_to ? (
                <div className={styles.replyPreview}>
                  <strong>{message.reply_to.author_name}</strong>
                  <span>{message.reply_to.text}</span>
                </div>
              ) : null}

              <p className={message.deleted ? styles.deleted : undefined}>{message.text}</p>

              {message.attached_market ? (
                <button
                  type="button"
                  className={styles.marketCard}
                  onClick={() => onOpenMarket?.(message.attached_market!.id)}
                >
                  <small>ПРИКРЕПЛЁННОЕ СОБЫТИЕ</small>
                  <strong>{message.attached_market.question}</strong>
                  <span>Открыть рынок ›</span>
                </button>
              ) : null}

              {!message.deleted ? (
                <div className={styles.messageActions}>
                  <button type="button" onClick={() => setReplyToId(message.id)}>
                    <Reply size={13} /> Ответить
                  </button>
                  {canDelete ? (
                    <button type="button" onClick={() => onDelete(message.id)}>
                      <Trash2 size={13} /> Удалить
                    </button>
                  ) : null}
                </div>
              ) : null}
            </article>
          )
        })}
      </main>

      <footer className={styles.composer}>
        {replyTo ? (
          <div className={styles.composeChip}>
            <span><b>Ответ:</b> {replyTo.author.display_name} · {replyTo.text}</span>
            <button type="button" onClick={() => setReplyToId(undefined)}><X size={14} /></button>
          </div>
        ) : null}
        {attachedMarket ? (
          <div className={styles.composeChip}>
            <span><b>Событие:</b> {attachedMarket.question}</span>
            <button type="button" onClick={() => setAttachedMarketId(undefined)}><X size={14} /></button>
          </div>
        ) : null}
        {lobby && attachOpen ? (
          <div className={styles.attachPicker}>
            <strong>Прикрепить событие</strong>
            {attachableMarkets.map((market) => (
              <button
                type="button"
                key={market.id}
                onClick={() => {
                  setAttachedMarketId(market.id)
                  setAttachOpen(false)
                }}
              >
                {market.question}
              </button>
            ))}
          </div>
        ) : null}
        <div className={styles.composeRow}>
          {lobby ? (
            <button
              type="button"
              className={styles.iconAction}
              aria-label="Прикрепить событие"
              onClick={() => setAttachOpen((open) => !open)}
            >
              <Paperclip size={18} />
            </button>
          ) : null}
          <textarea
            rows={1}
            maxLength={1000}
            value={draft}
            placeholder="Сообщение…"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                submit()
              }
            }}
          />
          <button
            type="button"
            className={styles.send}
            aria-label="Отправить"
            disabled={!draft.trim() || sending}
            onClick={submit}
          >
            <Send size={17} />
          </button>
        </div>
      </footer>
    </div>
  )
}

function formatMessageTime(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const sameDay = now.toDateString() === date.toDateString()
  return new Intl.DateTimeFormat('ru-RU', sameDay
    ? { hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
  ).format(date)
}
