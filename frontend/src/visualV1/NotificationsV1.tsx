import { useEffect, useState } from 'react'
import type { NotificationItem, NotificationsScreenProps } from '../screens/NotificationsScreen'
import { Button } from '../components/Button/Button'
import { syncTelegramBackButton } from '../telegram/webapp'
import { AccountAsset, AccountHeaderV1, AccountStateV1, AccountTitleV1 } from './AccountV1Shared'
import s from './AccountV1.module.css'

function notificationIcon(item: NotificationItem) {
  if (item.kind === 'market-resolved' || item.kind === 'payout') return 'f1ff2'
  if (item.kind === 'order-cancelled' || item.kind === 'created-market-rejected') return '11dc5'
  if (item.kind === 'market-closed' || item.kind === 'market-closing') return '97e70'
  return '4b750'
}

export function NotificationsV1({ items = [], initialSelectedId, onBack, onOpen, onAction, onRead, listState = 'ready', onRetry, errorMessage }: NotificationsScreenProps) {
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null)
  const selected = items.find(item => item.id === selectedId)
  const unread = items.filter(item => item.unread).length
  const visible = filter === 'unread' ? items.filter(item => item.unread) : items
  useEffect(() => selectedId == null ? undefined : syncTelegramBackButton(true, () => setSelectedId(null)), [selectedId])
  if (selected) return <div className={s.screen} data-figma-frame="821:7746"><AccountHeaderV1 onBack={() => setSelectedId(null)}/><main className={s.body}>
    <AccountTitleV1 title={selected.detailTitle ?? 'Уведомление'} subtitle={selected.context ?? selected.metadata}/>
    {errorMessage ? <p className={s.error} role="alert">{errorMessage}</p> : null}
    <section className={s.panel}><AccountAsset name={notificationIcon(selected)} size={24}/><h2>{selected.headline ?? selected.title}</h2><p className={s.muted}>{selected.headlineMeta ?? selected.metadata}</p>
      {selected.relatedTitle ? <div className={s.detailRows}><strong>{selected.relatedTitle}</strong>{selected.relatedMeta ? <p className={s.muted}>{selected.relatedMeta}</p> : null}</div> : null}
      {selected.eventText ? <p>{selected.eventText}</p> : null}{selected.eventMeta ? <p className={s.muted}>{selected.eventMeta}</p> : null}
    </section>
  </main>{selected.actionLabel ? <footer className={s.footer}><Button className={s.button} fullWidth disabled={!onAction && !onOpen} onClick={() => (onAction ?? onOpen)?.(selected)}>{selected.actionLabel}</Button></footer> : null}</div>
  return <div className={s.screen} data-figma-frame="819:60648"><AccountHeaderV1 onBack={onBack}/><main className={s.body}>
    <AccountTitleV1 title="Уведомления" subtitle={unread ? `${unread} непрочитанных` : items.length ? 'Все прочитаны' : 'События, предложения и результаты'}/>
    <div className={s.tabs} role="tablist" aria-label="Уведомления">{[['all', 'Все'], ['unread', 'Непрочитанные']].map(([id, label]) => <button type="button" role="tab" aria-selected={filter === id} key={id} onClick={() => setFilter(id)}>{label}</button>)}</div>
    {errorMessage ? <p className={s.error} role="alert">{errorMessage}</p> : null}
    {listState === 'loading' ? <AccountStateV1 title="Загружаем уведомления…"/> : listState === 'error' ? <><AccountStateV1 title="Не удалось загрузить уведомления">Проверьте соединение и повторите попытку.</AccountStateV1><Button variant="secondary" onClick={onRetry}>Повторить</Button></> : listState === 'unauthenticated' ? <AccountStateV1 title="Откройте BetTON через Telegram">Для ваших уведомлений требуется вход.</AccountStateV1> : visible.length ? <>
      <p className={s.groupLabel}>Последние уведомления</p><div className={s.list}>{visible.map(item => <button type="button" className={s.row} key={item.id} onClick={() => { setSelectedId(item.id); if (item.unread) onRead?.(item) }}>
        {item.unread ? <span className={s.dot} aria-label="Непрочитано"/> : null}<span className={s.rowIcon}><AccountAsset name={notificationIcon(item)} size={22}/></span><span className={s.rowCopy}><strong>{item.title}</strong><small>{item.metadata}</small></span><AccountAsset name="0de93" size={16}/>
      </button>)}</div></> : <AccountStateV1 title={filter === 'unread' ? 'Всё прочитано' : 'Уведомлений пока нет'}>Здесь появятся изменения ваших событий, предложений и ставок.</AccountStateV1>}
  </main></div>
}
