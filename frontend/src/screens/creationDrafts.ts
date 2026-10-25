import { EMPTY_EVENT_DRAFT, type CreationStep, type EventDraft, type EventType } from '../api/eventsV3'

const types: EventType[] = ['public', 'private', 'guarantor']
const steps: CreationStep[] = ['type', 'question', 'conditions', 'review', 'guarantor']
export const creationDraftKey = (userId?: number, type?: EventType) =>
  `betton.create.ux-v3.${userId ?? 'guest'}${type ? `.${type}` : ''}`

export function readCreationDraft(userId?: number, type?: EventType): { draft: EventDraft; step: CreationStep } {
  const empty = { draft: { ...EMPTY_EVENT_DRAFT, eventType: type ?? null }, step: 'type' as CreationStep }
  try {
    const pointer = JSON.parse(sessionStorage.getItem(creationDraftKey(userId)) || 'null')
    const selected = type ?? pointer?.eventType ?? pointer?.draft?.eventType
    if (!types.includes(selected)) return empty
    // Import the old single draft only into its own creation branch.
    const saved = JSON.parse(sessionStorage.getItem(creationDraftKey(userId, selected)) || 'null')
      ?? (pointer?.draft?.eventType === selected ? pointer : null)
    if (!saved || saved.draft?.eventType !== selected) return { ...empty, draft: { ...empty.draft, eventType: selected } }
    const draft = { ...EMPTY_EVENT_DRAFT, eventType: selected } as EventDraft
    for (const key of Object.keys(EMPTY_EVENT_DRAFT) as (keyof EventDraft)[]) {
      if (key !== 'eventType' && key !== 'guarantorId' && key !== 'category' && typeof saved.draft[key] === 'string') {
        draft[key] = saved.draft[key]
      }
    }
    if (['sport', 'esports', 'politics', 'crypto', 'unique'].includes(saved.draft.category)) draft.category = saved.draft.category
    if (Number.isSafeInteger(saved.draft.guarantorId) && saved.draft.guarantorId > 0) draft.guarantorId = saved.draft.guarantorId
    return { draft, step: steps.includes(saved.step) ? saved.step : 'type' }
  } catch { return empty }
}

export function saveCreationDraft(userId: number | undefined, draft: EventDraft, step: CreationStep) {
  try {
    if (draft.eventType) sessionStorage.setItem(creationDraftKey(userId, draft.eventType), JSON.stringify({ draft, step }))
    sessionStorage.setItem(creationDraftKey(userId), JSON.stringify({ eventType: draft.eventType }))
  } catch { /* Storage may be disabled by the host. */ }
}

export function clearCreationDraft(userId: number | undefined, type?: EventType | null) {
  try {
    if (type) sessionStorage.removeItem(creationDraftKey(userId, type))
    const saved = JSON.parse(sessionStorage.getItem(creationDraftKey(userId)) || 'null')
    if (!type || (saved?.eventType ?? saved?.draft?.eventType) === type) sessionStorage.removeItem(creationDraftKey(userId))
  } catch { /* Optional browser storage. */ }
}
