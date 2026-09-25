import { useState } from 'react'
import { useT } from '../i18n'
import styles from './HelpScreen.module.css'

type HelpTopic = {
  id: string
  title: string
  kicker?: string
  notice?: string
  blocks: Array<{ title?: string; body: string }>
}

export type HelpScreenProps = { onBack?: () => void }

export function HelpScreen({ onBack }: HelpScreenProps) {
  const t = useT()
  const [topicId, setTopicId] = useState<string | null>(null)

  const topics: HelpTopic[] = [
    {
      id: 'p2p',
      title: 'Как работает P2P',
      blocks: [
        { body: t('help.p2p') },
        { body: 'Цена появляется из встречных заявок участников. Платформа не рисует вероятность сама.' },
      ],
    },
    {
      id: 'book',
      title: 'Книга заявок и типы ордеров',
      blocks: [
        { title: 'ORDER BOOK', body: t('help.book') },
        { title: 'LIMIT', body: t('help.ownPrice') },
      ],
    },
    {
      id: 'trade',
      title: 'Quick Trade или своя цена',
      notice: 'Проверяйте итоговую цену до подтверждения.',
      blocks: [
        { title: 'QUICK TRADE · IOC', body: 'Исполняется сразу по доступным ценам. Неисполненный остаток автоматически отменяется.' },
        { title: 'СВОЯ ЦЕНА · LIMIT', body: 'Ждёт встречную заявку по вашей цене. Может исполниться частично или не исполниться.' },
      ],
    },
    {
      id: 'fees',
      title: 'Комиссия и расчёт результата',
      blocks: [
        { body: t('help.fee') },
        { body: t('help.creatorShare') },
      ],
    },
    {
      id: 'resolution',
      title: 'Как определяется результат',
      blocks: [
        { body: 'Критерии и источник результата задаются до открытия рынка и не должны меняться после начала торговли.' },
      ],
    },
    {
      id: 'unlisted',
      title: 'Unlisted рынки',
      blocks: [
        { body: 'Unlisted рынок не показывается в публичном discovery и доступен участникам по точной ссылке.' },
      ],
    },
    {
      id: 'cancel',
      title: 'Отмена или void',
      blocks: [
        { body: t('help.cancel') },
      ],
    },
    {
      id: 'about',
      title: 'Правила, FAQ и о BetTON',
      kicker: 'BetTON',
      blocks: [
        { body: t('help.lead') },
        { body: 'BetTON — P2P prediction market на TON. Торговые условия задают участники рынка.' },
      ],
    },
  ]

  const topic = topics.find((item) => item.id === topicId) ?? null

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          {topic ? (
            <button type="button" className={styles.back} onClick={() => setTopicId(null)}>←</button>
          ) : (
            <button type="button" className={styles.backText} onClick={onBack}>← Назад</button>
          )}
          <h1>{topic?.title ?? 'Помощь'}</h1>
        </div>
      </header>

      <main className={styles.body}>
        {topic ? (
          <>
            {topic.notice ? (
              <section className={styles.notice}>
                <strong>!</strong>
                <p>{topic.notice}</p>
              </section>
            ) : null}
            {topic.kicker ? <strong className={styles.kicker}>{topic.kicker}</strong> : null}
            {topic.blocks.map((block, index) => (
              <section key={block.title ?? String(index)} className={styles.card}>
                {block.title ? <strong>{block.title}</strong> : null}
                <p>{block.body}</p>
              </section>
            ))}
          </>
        ) : (
          <>
            <p className={styles.lead}>Короткие ответы о P2P-торговле, ордерах, комиссиях и resolution.</p>
            <nav className={styles.topicList} aria-label="Разделы помощи">
              {topics.map((item) => (
                <button key={item.id} type="button" onClick={() => setTopicId(item.id)}>
                  <span>{item.title}</span>
                  <span aria-hidden="true">›</span>
                </button>
              ))}
            </nav>
          </>
        )}
      </main>
    </div>
  )
}
