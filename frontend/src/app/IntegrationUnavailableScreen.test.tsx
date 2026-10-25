import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { IntegrationUnavailableScreen } from './IntegrationUnavailableScreen'

describe('explicit integration limits', () => {
  it('never presents a negotiated reward as a completed payment', () => {
    const html = renderToStaticMarkup(<IntegrationUnavailableScreen kind="guarantor" onBack={() => undefined} />)
    expect(html).toContain('463:683')
    expect(html).toContain('Ничего не списано')
    expect(html).toContain('пока нельзя открыть')
  })
  it('requires product policy before publishing moderator edits', () => {
    const html = renderToStaticMarkup(<IntegrationUnavailableScreen kind="moderation" onBack={() => undefined} />)
    expect(html).toContain('463:702')
    expect(html).toContain('Согласие создателя пока не определено')
    expect(html).not.toContain('успешно опубликовано')
  })
})
