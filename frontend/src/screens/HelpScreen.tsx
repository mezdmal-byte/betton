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

export type HelpScreenProps = { onBack?: () => void; onReplayOnboarding?: () => void }

export function HelpScreen({ onBack, onReplayOnboarding }: HelpScreenProps) {
  const t = useT()
  const [topicId, setTopicId] = useState<string | null>(null)

  const topics: HelpTopic[] = [
    {
      id: 'p2p',
      title: 'Как работает P2P',
      blocks: [
        { body: t('help.p2p') },
        { body: 'Коэффициенты появляются из встречных предложений участников. Платформа не рисует вероятность сама.' },
      ],
    },
    {
      id: 'book',
      title: 'Предложения участников',
      blocks: [
        { title: 'Предложения участников', body: t('help.book') },
        { title: 'Свой коэффициент', body: t('help.ownPrice') },
      ],
    },
    {
      id: 'trade',
      title: 'Поставить сейчас или подождать',
      notice: 'Проверяйте средний коэффициент до подтверждения.',
      blocks: [
        { title: 'Поставить сейчас', body: 'Ставка принимается в пределах доступной встречной суммы. Неиспользованный остаток возвращается на баланс.' },
        { title: 'Свой коэффициент', body: 'Заявка ждёт другого участника с подходящими условиями. Она может исполниться частично или не исполниться.' },
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
        { title: 'Свой коэффициент', body: 'Остаток продолжает ждать встречную ставку. Его можно отменить.' },
        { body: 'Баланс обновляется после подтверждённого исполнения.' },
      ],
    },
    {
      id: 'resolution',
      title: 'Как определяется результат',
      blocks: [
        { body: 'После начала приёма ставок изменить условия события нельзя.' },
        { body: 'Публичное событие проходит модерацию. Результат подтверждается по утверждённым правилам и источникам. В частном событии без гаранта результат определяет создатель.' },
        { body: 'В частном событии с гарантом решение принимает выбранный гарант в течение 24 часов после окончания события. Его своевременное решение окончательно. Если решения нет в срок, событие отменяется с возвратом ставок.' },
        { body: 'Ранее созданные события могут работать по прежним правилам. Актуальный порядок указан в условиях конкретного события.' },
      ],
    },
    {
      id: 'unlisted',
      title: 'Частные события и гарант',
      blocks: [
        { body: 'Частное пари не видно в ленте и поиске. Пригласить участников можно по ссылке. При создании не нужно ставить деньги или задавать коэффициент — ставки размещаются отдельно.' },
        { body: 'Выберите доступного гаранта. У него минута на отклик и пять минут на обсуждение условий. Создатель и гарант могут вместе продлить обсуждение. Ставки откроются только после согласования одной версии условий.' },
        { body: 'Гарант не может быть создателем или делать ставки в этом пари. Его профиль и отзывы помогают вам выбрать человека, но не гарантируют честность. Перед ставкой прочитайте условия и подтвердите выбор гаранта.' },
        { body: 'В переписку можно добавлять доказательства. Срок решения — 24 часа после окончания события, а не после окончания приёма ставок. При отсутствии решения в срок событие отменяется с возвратом ставок.' },
      ],
    },
    {
      id: 'cancel',
      title: 'Отмена события',
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
        { title: 'Где результат?', body: 'В карточке события и истории ваших ставок.' },
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
            <p className={styles.lead}>Как создать событие, сделать ставку и получить результат.</p>
            <nav className={styles.topicList} aria-label="Разделы помощи">
              {onReplayOnboarding ? <button type="button" onClick={onReplayOnboarding}><span>Знакомство с BetTON</span><span aria-hidden="true">›</span></button> : null}
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
