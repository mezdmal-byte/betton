import { useEffect } from 'react'
import { Button } from '../components/Button/Button'
import { syncTelegramBackButton } from '../telegram/webapp'
import s from './IntegrationUnavailableScreen.module.css'

const content = {
  guarantor: { frame: '463:683', title: 'Выплаты не подключены', context: 'вознаграждение', lead: 'Условия вознаграждения сохранены', caption: 'Платное событие пока нельзя открыть.', body: 'Резервирование и выплата гаранту ещё не подключены. Ничего не списано. Условия можно продолжить обсуждать в чате.', action: 'Вернуться в чат' },
  moderation: { frame: '463:702', title: 'Публикация недоступна', context: 'правки модератора', lead: 'Изменённая редакция сохранена', caption: 'Согласие создателя пока не определено.', body: 'Нужен отдельный порядок согласия автора. Можно сохранить правки, отклонить заявку или явно восстановить и опубликовать первоначальную редакцию.', action: 'Вернуться к заявке' },
}

export function IntegrationUnavailableScreen({ kind, onBack }: { kind: keyof typeof content; onBack: () => void }) {
  const c = content[kind]
  useEffect(() => syncTelegramBackButton(true, onBack), [onBack])
  return <section className={s.root} role="dialog" aria-modal="true" aria-labelledby="integration-limit-title" data-figma-frame={c.frame}>
    <header className={s.header}><div><button type="button" onClick={onBack} autoFocus>← Назад</button><strong>BetTON</strong></div><h1 id="integration-limit-title">{c.title}</h1><p>Тестовая версия · {c.context}</p></header>
    <main className={s.body}><section className={s.card}><strong>{c.lead}</strong><p>{c.caption}</p></section><p>{c.body}</p></main>
    <footer className={s.footer}><Button fullWidth onClick={onBack}>{c.action}</Button></footer>
  </section>
}
