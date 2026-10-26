import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { GuarantorTradeCosts as Costs } from '../../api/types'
import { marketYesNo } from '../../fixtures/markets'
import { OwnPricePanel } from '../OwnPricePanel/OwnPricePanel'
import { QuickTradeSheet } from '../QuickTradeSheet/QuickTradeSheet'
import { formatNanoTon, GuarantorTradeCosts } from './GuarantorTradeCosts'

const costs: Costs = {
  preliminary: true, scope: 'event_positions', matched_nano: '2000000000',
  gross_new_payout_nano: '4000000001', event_payout_after_fees_nano: '7800000001',
  service_fee_nano: '40000000', guarantor_reward_nano: '160000000',
  secured_for_both_outcomes: true, reason: null,
}

describe('server guarantor trade costs', () => {
  it('formats exact integer nanoTON including amounts beyond JS number precision', () => {
    expect(formatNanoTon('9007199254740993001')).toBe('9007199254.740993001 TON')
    expect(formatNanoTon('0000000001')).toBe('0.000000001 TON')
    expect(formatNanoTon('0')).toBe('0 TON')
    expect(formatNanoTon(null)).toBe('—')
    expect(formatNanoTon('not-money')).toBe('—')
  })

  it('separates gross new bet from event-wide net and explains scope and provisional status', () => {
    const html = renderToStaticMarkup(<GuarantorTradeCosts costs={costs} />)
    expect(html).toContain('Выплата по новой ставке до сборов')
    expect(html).toContain('4.000000001 TON')
    expect(html).toContain('Ваша общая выплата по событию после сборов')
    expect(html).toContain('7.800000001 TON')
    expect(html).toContain('0.04 TON')
    expect(html).toContain('0.16 TON')
    expect(html).toContain('предварительно')
    expect(html).toContain('Учитываются уже заключённые ставки')
    expect(html).toContain('Неисполненный остаток не включён')
    expect(html).toContain('только из прибыли победителей')
  })

  it('does not invent net or fees when funding is insufficient', () => {
    const html = renderToStaticMarkup(<GuarantorTradeCosts costs={{...costs,
      event_payout_after_fees_nano: null, service_fee_nano: null, guarantor_reward_nano: null,
      secured_for_both_outcomes: false, reason: 'Недостаточно фонда',
    }} />)
    expect(html).not.toContain('7.800000001 TON')
    expect(html).toContain('Недостаточно фонда')
    expect(html.match(/<dd>—<\/dd>/g)).toHaveLength(3)
    expect(html).not.toContain('Размещение недоступно')
  })

  it('blocks own-price confirmation only for explicit server prohibition, not collecting', () => {
    const base = {question:'Вопрос',outcomeALabel:'Первый',outcomeBLabel:'Второй',selectedSide:'a' as const,
      odds:2,amount:2,book:[],trades:[],matchedTon:2,restTon:0,previewMode:'backend' as const,
      stage:'confirm' as const,onSubmit:()=>{}}
    const collecting = renderToStaticMarkup(<OwnPricePanel {...base} guarantorCosts={{...costs,secured_for_both_outcomes:false}} />)
    expect(collecting).not.toContain('disabled=""')
    const blocked = renderToStaticMarkup(<OwnPricePanel {...base} guarantorCosts={{...costs,can_place:false}} />)
    expect(blocked).toContain('disabled=""')
    expect(blocked).not.toContain('Выплата исполняемой части до сбора')
  })

  it('shows server costs before partial quick-trade confirmation and blocks prohibited placement', () => {
    const html = renderToStaticMarkup(<QuickTradeSheet market={marketYesNo} selectedSide="a" amount={3}
      state="partial" previewMatchedTon={2} previewRestTon={1} onPlace={()=>{}}
      guarantorCosts={{...costs,can_place:false}} />)
    expect(html).toContain('Ваша общая выплата по событию после сборов')
    // Pocket has one explicit review before submission, including partial quotes.
    // A server prohibition prevents even advancing to that review.
    expect(html).toContain('Проверить ставку')
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*><span[^>]*>Проверить ставку/)
  })
})
