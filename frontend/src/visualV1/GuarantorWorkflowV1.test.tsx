import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { GuarantorCase } from '../api/guarantors'
import { I18nProvider } from '../i18n'
import { GuarantorWorkflowV1 } from './GuarantorWorkflowV1'

const clock = Date.parse('2026-11-02T10:00:00Z')
const event: GuarantorCase = {
  market_id: 1, question: 'Тестовое событие', state: 'review', revision: 1,
  creator_id: 1, guarantor_id: 2, guarantor_name: 'Тестовый гарант', creator_confirmed: 1,
  criteria: 'Проверка по протоколу', source: 'Протокол', description: '', outcomes: ['А', 'Б'],
  close_at: '2026-11-02T11:00:00Z', ends_at: '2026-11-02T12:00:00Z',
  result_due_at: '2026-11-03T12:00:00Z', deadline: '2026-11-02T10:05:00Z',
  extension_by: null, proposed_outcome: null, decision_reason: null, consent: false,
  participant: false, messages: [],
}
function markup(userId: number, state = 'review', time = clock, view: 'negotiation' | 'decline' = 'negotiation') {
  return renderToStaticMarkup(<I18nProvider><GuarantorWorkflowV1 event={{ ...event, state }}
    userId={userId} clock={time} initialOpen initialView={view}
    onAction={async () => undefined} onUpdate={async () => undefined} /></I18nProvider>)
}
function buttonLabels(html: string) {
  return Array.from(html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g), match => match[1].replace(/<[^>]*>/g, ''))
}
describe('declining an ongoing agreement', () => {
  it('exposes the existing decline confirmation from the guarantor negotiation screen', () => {
    expect(buttonLabels(markup(2))).toContain('Отказаться')
    expect(buttonLabels(markup(1))).not.toContain('Отказаться')
    expect(buttonLabels(markup(3))).not.toContain('Отказаться')
  })
  it('does not offer the action after review expiry or final acceptance', () => {
    expect(buttonLabels(markup(2, 'review', Date.parse(event.deadline!)))).not.toContain('Отказаться')
    expect(buttonLabels(markup(2, 'collecting'))).not.toContain('Отказаться')
  })
  it('renders the existing explicit decline confirmation', () => {
    const html = markup(2, 'review', clock, 'decline')
    expect(html).toContain('Отказаться от приглашения?')
    expect(buttonLabels(html)).toContain('Отказаться от приглашения')
  })
})
