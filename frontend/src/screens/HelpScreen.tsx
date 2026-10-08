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
      title: 'Заявки участников',
      blocks: [
        { title: 'Предложения участников', body: t('help.book') },
        { title: 'Своя цена', body: t('help.ownPrice') },
      ],
    },
    {
      id: 'trade',
      title: 'Поставить сейчас или подождать',
      notice: 'Проверяйте итоговую цену до подтверждения.',
      blocks: [
        { title: 'Поставить сейчас', body: 'Ставка принимается в пределах доступной встречной суммы. Неиспользованный остаток возвращается на баланс.' },
        { title: 'Своя цена', body: 'Заявка ждёт другого участника с подходящими условиями. Она может исполниться частично или не исполниться.' },
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
      id: 'partial-fills',
      title: 'Частичное исполнение',
      kicker: '40 / 100',
      notice: 'Исполнена только доступная часть объёма.',
      blocks: [
        { title: 'Поставить сейчас', body: 'Неиспользованный остаток сразу возвращается на баланс.' },
        { title: 'Своя цена', body: 'Остаток продолжает ждать встречную ставку. Его можно отменить.' },
        { body: 'Баланс обновляется после подтверждённого исполнения.' },
      ],
    },
    {
      id: 'resolution',
      title: 'Как определяется результат',
      blocks: [
        { body: 'Критерии и источник результата задаются до открытия рынка и не должны меняться после начала торговли.' },
        { body: 'Публичные пари рассчитывает администратор. В новых частных пари результат проверяет выбранный гарант. После его решения есть 24 часа на возражение до выплаты.' },
        { body: 'Возражение участника исполненной ставки останавливает выплату. Спор рассматривает администратор, не участвующий в этом пари. Если результат нельзя проверить, при отмене ставки возвращаются без чаевых.' },
      ],
    },
    {
      id: 'unlisted',
      title: 'Частные пари и гарант',
      blocks: [
        { body: 'Частное пари не видно в ленте и поиске. Пригласить участников можно по ссылке. При создании не нужно ставить деньги или задавать коэффициент — ставки размещаются отдельно.' },
        { body: 'Выберите доступного гаранта. У него минута на отклик и пять минут на обсуждение условий. Создатель и гарант могут вместе продлить обсуждение. Ставки откроются только после согласования одной версии условий.' },
        { body: 'Гарант не может быть создателем или делать ставки в этом пари. Его профиль и отзывы помогают вам выбрать человека, но не гарантируют честность. Перед ставкой прочитайте условия и подтвердите выбор гаранта.' },
        { body: 'После открытия ставок условия не меняются. В переписку можно добавлять доказательства. Если гарант не определит результат в срок, пари передаётся администратору.' },
      ],
    },
    {
      id: 'cancel',
      title: 'Отмена пари',
      blocks: [
        { body: t('help.cancel') },
      ],
    },
    {
      id: 'faq',
      title: 'Частые вопросы',
      blocks: [
        { title: 'Почему коэффициент изменился?', body: 'Изменились встречные заявки.' },
        { title: 'Почему заявка ждёт?', body: 'Пока нет другого участника с подходящими условиями.' },
        { title: 'Можно отменить свою заявку?', body: 'Да, но только ту часть, которая ещё не превратилась в ставку.' },
        { title: 'Где результат?', body: 'В карточке пари и истории ваших ставок.' },
      ],
    },
    {
      id: 'rules',
      title: 'Правила BetTON',
      notice: 'Манипуляции и обход ограничений запрещены.',
      blocks: [
        { body: 'Торгуйте только с понятным риском.' },
        { body: 'Коэффициент не гарантирует исход события.' },
        { body: 'Нельзя заключать сделки со своими же заявками.' },
        { body: 'Решение опирается на указанный источник.' },
      ],
    },
    {
      id: 'about',
      title: 'О BetTON',
      kicker: 'BetTON',
      blocks: [
        { body: t('help.lead') },
        { body: 'В BetTON участники заключают пари друг с другом. Сейчас используются игровые балансы с обозначением TON — это не реальные монеты и не кошелёк.' },
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
            <p className={styles.lead}>Как создать пари, сделать ставку и получить результат.</p>
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
