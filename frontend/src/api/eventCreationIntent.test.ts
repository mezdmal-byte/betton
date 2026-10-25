import { beforeEach, describe, expect, it, vi } from 'vitest'
import { eventIntentKey, pendingEventIntent, submitEventIntent } from './eventCreationIntent'
import { createEvent, type CreateEventBody } from './eventsV3'
vi.mock('./eventsV3', () => ({ createEvent: vi.fn() }))
const body = { event_type: 'private', question: 'Test event' } as CreateEventBody
const result = { id: 123 } as Awaited<ReturnType<typeof createEvent>>
const records = new Map<string,string>()
beforeEach(() => {
  records.clear(); vi.mocked(createEvent).mockReset()
  vi.stubGlobal('localStorage', {getItem: (k:string) => records.get(k) ?? null, setItem: (k:string,v:string) => records.set(k,v), removeItem:(k:string) => records.delete(k)})
})
describe('durable event creation intent', () => {
  it('persists before transport, reuses payload/key after lost response and clears only on success', async () => {
    vi.mocked(createEvent).mockImplementationOnce(async () => {
      expect(pendingEventIntent(7)?.body).toEqual(body)
      throw new Error('response lost')
    })
    await expect(submitEventIntent(7, body)).rejects.toThrow('response lost')
    const saved = pendingEventIntent(7)!
    vi.mocked(createEvent).mockResolvedValue(result)
    await expect(submitEventIntent(7)).resolves.toEqual(result)
    expect(createEvent).toHaveBeenLastCalledWith(body, saved.requestId)
    expect(pendingEventIntent(7)).toBeNull()
  })
  it('does not replace an unresolved request with changed parameters or another account', async () => {
    records.set(eventIntentKey(7), JSON.stringify({requestId:'saved',body}))
    await expect(submitEventIntent(7,{...body,question:'Changed'})).rejects.toThrow('предыдущего')
    expect(pendingEventIntent(8)).toBeNull()
    expect(createEvent).not.toHaveBeenCalled()
  })
  it('coalesces immediate double submission and fails closed on unavailable storage', async () => {
    vi.mocked(createEvent).mockResolvedValue(result)
    const a = submitEventIntent(7,body), b = submitEventIntent(7,body)
    expect(a).toBe(b); await a
    expect(createEvent).toHaveBeenCalledTimes(1)
    vi.stubGlobal('localStorage',{getItem:()=>null,setItem:()=>{throw new Error('storage unavailable')}})
    expect(() => submitEventIntent(7,body)).toThrow('storage unavailable')
    expect(createEvent).toHaveBeenCalledTimes(1)
  })
})
