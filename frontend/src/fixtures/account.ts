import type {
  AccountFixture,
  CreateMarketDraft,
  HistoryFixture,
  OrderFixture,
  PositionFixture,
} from '../types/account'
import { currentUser, marketLongQuestion } from './markets'

export const accountUser: AccountFixture = {
  displayName: currentUser.displayName,
  handle: currentUser.handle,
  initials: currentUser.initials,
  availableTon: currentUser.availableTon,
  inPositionsTon: 150,
  inOrdersTon: 80,
  creatorIncomeTon: 36,
  eventsCreated: 4,
  createdVolumeTon: 2310,
  isAdmin: false,
}

export const adminUser: AccountFixture = {
  ...accountUser,
  isAdmin: true,
}

export const defaultCreateDraft: CreateMarketDraft = {
  question: '',
  category: 'sport',
  outcomeA: 'Да',
  outcomeB: 'Нет',
  closeAt: '20 сен 2026 · 20:00',
  visibility: 'public',
  description: '',
}

export const teamCreateDraft: CreateMarketDraft = {
  question: 'Кто выиграет матч?',
  category: 'sport',
  outcomeA: 'Спартак',
  outcomeB: 'ЦСКА',
  closeAt: '21 сен 2026 · 18:00',
  visibility: 'public',
  description: 'Победитель матча в основное время. Овертайм не учитывается.',
}

export const privateCreateDraft: CreateMarketDraft = {
  question: 'Спартак обыграет Зенит?',
  category: 'sport',
  outcomeA: 'Да',
  outcomeB: 'Нет',
  closeAt: '20 сен 2026 · 20:00',
  visibility: 'unlisted',
  description: 'Победит команда, забившая больше голов в основное время. Ничья считается исходом «Нет».',
}

export const portfolioPositions: PositionFixture[] = [
  {
    id: 'pos-spartak',
    marketId: 1,
    question: 'Спартак обыграет Зенит?',
    outcomeLabel: 'Да',
    amountTon: 100,
    avgOdds: 1.78,
    potentialPayoutTon: 178,
  },
  {
    id: 'pos-cska',
    marketId: 2,
    question: 'Кто выиграет матч?',
    outcomeLabel: 'ЦСКА',
    amountTon: 50,
    avgOdds: 2.2,
    potentialPayoutTon: 110,
  },
]

export const portfolioOrders: OrderFixture[] = [
  {
    id: 'ord-active',
    marketId: 1,
    question: 'Спартак обыграет Зенит?',
    outcomeLabel: 'Да',
    odds: 1.9,
    remainingTon: 40,
    amountTon: 40,
    filledTon: 0,
    status: 'Активна',
    canCancel: true,
  },
  {
    id: 'ord-partial',
    marketId: 3,
    question: 'BTC будет выше $100k?',
    outcomeLabel: 'Выше',
    odds: 1.62,
    remainingTon: 20,
    amountTon: 80,
    filledTon: 60,
    status: 'Частично исполнена',
    canCancel: true,
  },
]

export const portfolioHistory: HistoryFixture[] = [
  {
    id: 'tx-bet',
    question: 'Спартак обыграет Зенит?',
    action: 'Ставка · Да',
    amountTon: -100,
    time: '2 ч назад',
  },
  {
    id: 'tx-win',
    question: 'Рублёв возьмёт сет у топ-10 соперника?',
    action: 'Выигрыш · Да',
    amountTon: 178,
    time: 'вчера',
  },
  {
    id: 'tx-cancel',
    question: 'ЦСКА забьёт первой в домашнем матче?',
    action: 'Отмена заявки',
    amountTon: 40,
    time: '3 дн. назад',
  },
]

export const longCreateDraft: CreateMarketDraft = {
  question: marketLongQuestion.question,
  category: 'sport',
  outcomeA: marketLongQuestion.outcomeA.label,
  outcomeB: marketLongQuestion.outcomeB.label,
  closeAt: '20 сен 2026 · 20:00',
  visibility: 'public',
  description: `${marketLongQuestion.description} ${marketLongQuestion.resolution} Ничья в основное время относится к исходу «Нет».`,
}

export const longHandleUser: AccountFixture = {
  ...accountUser,
  displayName: 'Александр Александрович',
  handle: 'aleksandr.aleksandrovich',
  initials: 'АА',
}

