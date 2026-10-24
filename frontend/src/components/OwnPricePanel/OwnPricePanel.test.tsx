import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { OwnPricePanel } from './OwnPricePanel'

const base = {
  question: 'Какой исход наступит?',
  outcomeALabel: 'Первый',
  outcomeBLabel: 'Второй',
  selectedSide: 'a' as const,
  odds: 1.5,
  amount: 100,
  book: [],
  trades: [],
  matchedTon: 85,
  restTon: 15,
  previewMode: 'backend' as const,
  stage: 'preview' as const,
}

describe('own-coefficient financial preview', () => {
  it('uses actual server execution economics instead of multiplying the requested stake by its limit', () => {
    const html = renderToStaticMarkup(<OwnPricePanel {...base} previewAverageOdds={2.25} previewPayoutTon={191.25} />)
    expect(html).toContain('Средний коэффициент исполнения')
    expect(html).toContain('2.25×')
    expect(html).toContain('191.25 TON')
    expect(html).not.toContain('150.00 TON')
    expect(html).toContain('Исполнится сейчас')
  })

  it('does not invent a payout or execution coefficient when the server did not return one', () => {
    const html = renderToStaticMarkup(<OwnPricePanel {...base} />)
    expect(html).not.toContain('150.00 TON')
    expect(html).toContain('Выплата исполняемой части до сбора · —')
    expect(html).toContain('Средний коэффициент исполнения · —')
  })
})
