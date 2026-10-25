import { afterEach, expect, it, vi } from 'vitest'
import { EMPTY_EVENT_DRAFT } from '../api/eventsV3'
import { clearCreationDraft, creationDraftKey, readCreationDraft, saveCreationDraft } from './creationDrafts'

afterEach(() => vi.unstubAllGlobals())
function storage() {
  const values = new Map<string, string>()
  vi.stubGlobal('sessionStorage', { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) })
  return values
}
it('keeps public, private and guarantor drafts separate across reloads and identities', () => {
  storage()
  saveCreationDraft(12, { ...EMPTY_EVENT_DRAFT, eventType: 'private', question: 'Личное пари' }, 'conditions')
  expect(readCreationDraft(12, 'public').draft.question).toBe('')
  saveCreationDraft(12, { ...EMPTY_EVENT_DRAFT, eventType: 'public', question: 'Публичное событие' }, 'review')
  expect(readCreationDraft(12).step).toBe('review')
  expect(readCreationDraft(12, 'private').draft.question).toBe('Личное пари')
  expect(readCreationDraft(13, 'public').draft.question).toBe('')
  expect(readCreationDraft(12, 'guarantor').draft.question).toBe('')
  clearCreationDraft(12, 'public')
  expect(readCreationDraft(12, 'public').draft.question).toBe('')
  expect(readCreationDraft(12, 'private').draft.question).toBe('Личное пари')
})
it('imports a legacy draft only into its original event type and survives corrupt storage', () => {
  const values = storage()
  values.set(creationDraftKey(12), JSON.stringify({ draft: { ...EMPTY_EVENT_DRAFT, eventType: 'private', question: 'Старый черновик' }, step: 'question' }))
  expect(readCreationDraft(12).draft.question).toBe('Старый черновик')
  expect(readCreationDraft(12, 'public').draft.question).toBe('')
  values.set(creationDraftKey(12), '{broken')
  expect(readCreationDraft(12).step).toBe('type')
})
