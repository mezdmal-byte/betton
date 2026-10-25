import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { normalizeGuarantorCase, type Guarantor, type GuarantorCase, type GuarantorReward } from '../api/guarantors'
import { GuarantorV3Panel } from './GuarantorV3Panel'
import { GuarantorCancellationForm } from './GuarantorCancellationForm'
import { GuarantorDetails } from './GuarantorReputation'
import { GuarantorFundingDetails, GuarantorRewardDetails, GuarantorRewardModeField, formatServerNanoTon, rewardTariffText } from './GuarantorRewardDetails'

const reward: GuarantorReward = { mode:'percent_minimum', fixed_ton:'20', percent:'3', accepted_by:[1,2], proposed_by:1 }
const event: GuarantorCase = {
  market_id:1, question:'Какой исход наступит?', protocol_version:3,
  creator_id:1, guarantor_id:2, guarantor_name:'Тестовый гарант', state:'review',
  revision:1, creator_confirmed:1, criteria:'Условия события', source:'Итоговый протокол', description:'',
  outcomes:['Первый исход','Второй исход'], close_at:'2099-01-01T12:00:00Z', ends_at:'2099-01-01T13:00:00Z',
  result_due_at:'2099-01-02T13:00:00Z', deadline:null, extension_by:null,
  proposed_outcome:null, decision_reason:null, consent:false, participant:false,
  messages:[], reward, reward_payments_supported:false,
}
const panel = (changes: Partial<GuarantorCase> = {}) => renderToStaticMarkup(
  <QueryClientProvider client={new QueryClient()}><GuarantorV3Panel event={{...event,...changes}} userId={2}/></QueryClientProvider>,
)

describe('guarantor reward presentation', () => {
  it('shows actual missed decisions and does not invent zero when the API omits them', () => {
    const profile: Guarantor = {user_id:2,name:'Гарант',bio:'',topics:'',status:'approved',available:true,available_until:null,completed:1,disputes:0,is_moderator:false,high_reputation:false,rating:null,review_count:0,rating_distribution:{},reviews:[]}
    const absent = renderToStaticMarkup(<GuarantorDetails guarantor={profile} onBack={()=>undefined}/>)
    expect(absent).toContain('<strong>—</strong><span>Пропущено решений</span>')
    const actual = renderToStaticMarkup(<GuarantorDetails guarantor={{...profile,missed_deadlines:3}} onBack={()=>undefined}/>)
    expect(actual).toContain('<strong>3</strong><span>Пропущено решений</span>')
  })

  it('requires a cancellation reason and a separate confirmation before refunding', () => {
    const props = {reason:'',confirming:false,pending:false,available:true,onReasonChange:()=>undefined,onReview:()=>undefined,onConfirm:()=>undefined,onEdit:()=>undefined}
    const initial = renderToStaticMarkup(<GuarantorCancellationForm {...props}/>)
    expect(initial).toContain('Почему результат нельзя определить')
    expect(initial).toMatch(/<button[^>]*disabled=""[^>]*><span[^>]*>Проверить отмену/)
    expect(initial).not.toContain('Подтвердите отмену события')
    const confirm = renderToStaticMarkup(<GuarantorCancellationForm {...props} confirming reason="Основной источник не опубликовал результат"/>)
    expect(confirm).toContain('Подтвердите отмену события')
    expect(confirm).toContain('Основание: Основной источник не опубликовал результат')
    expect(confirm).toContain('Отменить событие и вернуть ставки')
    expect(confirm).toContain('Вознаграждение гаранту и сервисный сбор при отмене не начисляются')
    expect(confirm).not.toContain('<textarea')
  })

  it('visibly blocks cancellation outside the server decision window', () => {
    const html = renderToStaticMarkup(<GuarantorCancellationForm reason="Результат недоступен" confirming pending={false} available={false} onReasonChange={()=>undefined} onReview={()=>undefined} onConfirm={()=>undefined} onEdit={()=>undefined}/>)
    expect(html).toContain('только в течение 24 часов после окончания события')
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*><span[^>]*>Отменить событие и вернуть ставки/)
  })

  it('offers all four distinct tariffs and explains maximum rather than adding minimum', () => {
    const html = renderToStaticMarkup(<GuarantorRewardModeField mode="percent_minimum" onChange={()=>undefined}/>)
    expect(html.match(/<option/g)).toHaveLength(4)
    expect(html).toContain('Процент + фиксированная сумма')
    expect(html).toContain('Процент, но не меньше минимума')
    expect(html).toContain('Большее из двух значений')
    expect(html).toContain('Минимум не прибавляется')
  })

  it('uses each agreed formula in the tariff text without computing a payout', () => {
    expect(rewardTariffText({...reward,mode:'fixed'})).toBe('20 TON за событие')
    expect(rewardTariffText({...reward,mode:'percent'})).toBe('3% от прибыли победителей')
    expect(rewardTariffText({...reward,mode:'combined'})).toBe('3% от прибыли победителей + 20 TON')
    expect(rewardTariffText(reward)).toBe('3% от прибыли победителей, но минимум 20 TON')
  })

  it('identifies who pays without promising a free-balance debit', () => {
    const html = renderToStaticMarkup(<GuarantorRewardDetails reward={reward}/>)
    expect(html).toContain('Вознаграждение гаранта удерживается только из прибыли победителей. При проигрыше или отмене дополнительная плата не взимается.')
    expect(html).not.toContain('20 TON +')
  })

  it('does not claim unpaid capability is ready and unblocks only from the server flag', () => {
    expect(panel()).toContain('расчёт и выплата вознаграждения гаранту не подключены')
    const supported = panel({reward_payments_supported:true})
    expect(supported).not.toContain('вознаграждения гаранту не подключены')
    expect(supported).toContain('Подтвердить и начать сбор ставок')
  })

  it('normalizes the real legacy empty object to an unnegotiated tariff', () => {
    const normalized = normalizeGuarantorCase({...event,reward:{} as GuarantorReward})
    expect(normalized?.reward).toBeNull()
    expect(panel({reward:normalized?.reward})).toContain('Тариф пока не согласован')
  })

  it('shows collecting without invented financial amounts when the API has not supplied funding', () => {
    const html = renderToStaticMarkup(<GuarantorFundingDetails collecting outcomes={event.outcomes}/>)
    expect(html).toContain('Ожидаем достаточного объёма заключённых ставок')
    expect(html).toContain('Сервер ещё не предоставил расчёт обеспечения')
    expect(html).not.toContain('TON')
  })

  it('renders exact server aggregates and both outcome statuses as preliminary, not guaranteed payout', () => {
    const html = renderToStaticMarkup(<GuarantorFundingDetails collecting outcomes={event.outcomes} funding={{
      secured:false, minimum_keep_bps:2000, preliminary:true,
      outcomes:[
        {outcome:0,secured:true,profit_nano:'200000000000',reward_nano:'20000000000',service_fee_nano:'2000000000'},
        {outcome:1,secured:false,profit_nano:'10000000000',reward_nano:'20000000000',service_fee_nano:'100000000',reason:'Недостаточно прибыли'},
      ],
    }}/>)
    expect(html).toContain('Первый исход · обеспечено')
    expect(html).toContain('Второй исход · недостаточно')
    expect(html).toContain('200 TON')
    expect(html).toContain('20%')
    expect(html).toContain('Предварительная оценка')
    expect(html).toContain('не гарантированная выплата')
  })

  it('formats nanoTON strings without loss of integer precision', () => {
    expect(formatServerNanoTon('1')).toBe('0,000000001 TON')
    expect(formatServerNanoTon('900719925474099312345')).toBe('900 719 925 474,099312345 TON')
    expect(formatServerNanoTon('not a number')).toBe('—')
    expect(formatServerNanoTon(null)).toBe('—')
  })

  it('does not invent zero values for insufficient server funding', () => {
    const html = renderToStaticMarkup(<GuarantorFundingDetails collecting outcomes={event.outcomes} funding={{
      secured:false,minimum_keep_bps:2000,preliminary:true,
      outcomes:[{outcome:0,secured:false,profit_nano:null,reward_nano:null,service_fee_nano:null,viewer_net_profit_nano:null,reason:'Недостаточно исполненных ставок'}],
    }}/>)
    expect(html).toContain('Недостаточно исполненных ставок')
    expect(html).toContain('—')
    expect(html).not.toContain('0 TON')
  })

  it('shows final server figures as final and does not keep a cancelled event collecting', () => {
    const final = renderToStaticMarkup(<GuarantorFundingDetails collecting={false} state="settled" outcomes={event.outcomes} funding={{
      secured:true,minimum_keep_bps:2000,preliminary:false,
      outcomes:[{outcome:0,secured:true,profit_nano:'100000000000',reward_nano:'3000000000',service_fee_nano:'1000000000',viewer_net_profit_nano:'96000000000'}],
    }}/>)
    expect(final).toContain('Итоговые суммы')
    expect(final).toContain('96 TON')
    expect(final).not.toContain('Предварительная оценка')
    expect(final).not.toContain('при обоих исходах')
    expect(final).toContain('расчёт по победившему исходу')
    const cancelled = renderToStaticMarkup(<GuarantorFundingDetails collecting={false} state="cancelled" outcomes={event.outcomes}/>)
    expect(cancelled).toContain('Вознаграждение гаранту не начисляется')
    expect(cancelled).not.toContain('Ожидаем')
  })
})
