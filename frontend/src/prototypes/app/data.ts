import { CATEGORIES, FEED_MARKETS, formatTon, liquidityLine, type FeedMarket } from '../feed/fixture'

export type Notice = {
  id: string
  title: string
  body: string
  time: string
  unread: boolean
  target: 'detail' | 'portfolio' | 'mine' | 'moderation' | 'history'
}

export const NOTICES: Notice[] = [
  { id: 'n1', title: 'Частичное исполнение', body: 'IOC по «Ключевая ставка»: исполнилось 32 TON. Остаток 18 TON в книгу не встал.', time: '14:02', unread: true, target: 'portfolio' },
  { id: 'n2', title: 'Заявка исполнена', body: 'Own Price 0.62 по TON/$8 исполнена полностью.', time: '13:11', unread: true, target: 'portfolio' },
  { id: 'n3', title: 'Остаток отменён', body: 'Неисполненные 15 TON возвращены в резерв. Это не вывод в блокчейн.', time: 'вчера', unread: false, target: 'portfolio' },
  { id: 'n4', title: 'Рынок скоро закроется', body: '«Команда Y» закроется 20 окт, 20:00.', time: 'вчера', unread: false, target: 'detail' },
  { id: 'n5', title: 'Рынок рассчитан', body: 'Демо-рынок «Ставка ЦБ» закрыт. Выплата по победившей стороне, сбор 1% с чистой прибыли.', time: 'пн', unread: false, target: 'history' },
  { id: 'n6', title: 'Рынок одобрен', body: '«Сбор Дюна 3» опубликован в ленте.', time: 'пн', unread: false, target: 'mine' },
  { id: 'n7', title: 'Рынок отклонён', body: 'Причина: критерии не проверяются по публичному источнику.', time: 'вс', unread: false, target: 'mine' },
  { id: 'n8', title: 'Модерация', body: 'Новый рынок ждёт решения. Только для админа.', time: '12:40', unread: true, target: 'moderation' },
]

export const BOOK_YES = [
  ['0.66', '12 TON'],
  ['0.65', '28 TON'],
  ['0.64', '40 TON'],
  ['0.63', '18 TON'],
]
export const BOOK_NO = [
  ['0.38', '15 TON'],
  ['0.37', '22 TON'],
  ['0.36', '30 TON'],
  ['0.35', '10 TON'],
]

export { CATEGORIES, FEED_MARKETS, formatTon, liquidityLine }
export type { FeedMarket }

export const PRIMARY = FEED_MARKETS[0]
