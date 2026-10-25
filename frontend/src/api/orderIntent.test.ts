import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './client'
import { orderByRequest, placeOrder } from './orders'
import { checkOrderIntent, completeOrderIntent, ORDER_INTENT_TTL, orderIntentKey, readOrderIntent, retryOrderIntent, submitOrderIntent } from './orderIntent'
import type { OrderOut } from './types'
vi.mock('./orders', () => ({ orderByRequest:vi.fn(), placeOrder:vi.fn() }))
vi.mock('./share', () => ({shareTokenFor:()=>null}))
const records = new Map<string,string>()
const body = {outcome:0,money:'100',odds:2,kind:'limit' as const}
const result = (id:string,market=5) => ({id:1,request_id:id,market_id:market,filled:40,remaining:60,refunded:0,status:'open',kind:'limit'} as OrderOut)
beforeEach(() => {
  records.clear(); vi.mocked(placeOrder).mockReset(); vi.mocked(orderByRequest).mockReset()
  vi.stubGlobal('localStorage',{getItem:(k:string)=>records.get(k)??null,setItem:(k:string,v:string)=>records.set(k,v),removeItem:(k:string)=>records.delete(k)})
  vi.mocked(placeOrder).mockImplementation(async (market,payload) => result(payload.request_id,Number(market)))
})
describe('durable monetary intent', () => {
  it('persists before POST, coalesces double click, clears only after confirmation', async () => {
    vi.mocked(placeOrder).mockImplementationOnce(async (_,payload) => {
      expect(readOrderIntent(7)?.requestId).toBe(payload.request_id)
      expect(payload.expected_user_id).toBe(7)
      expect(JSON.stringify(readOrderIntent(7))).not.toMatch(/initData|Authorization|BOT_TOKEN/)
      return result(payload.request_id)
    })
    const a=submitOrderIntent(7,5,body), b=submitOrderIntent(7,5,body)
    expect(a).toBe(b); const order=await a
    expect(placeOrder).toHaveBeenCalledTimes(1)
    await expect(submitOrderIntent(7,5,{...body,money:'200'})).rejects.toThrow('предыдущей')
    completeOrderIntent(7,order); expect(readOrderIntent(7)).toBeNull()
  })
  it('recovers lost response in a fresh module without another POST', async () => {
    vi.mocked(placeOrder).mockRejectedValueOnce(new Error('response lost'))
    await expect(submitOrderIntent(7,5,body)).rejects.toThrow('response lost')
    const id=readOrderIntent(7)!.requestId
    vi.resetModules(); const fresh=await import('./orderIntent')
    vi.mocked(orderByRequest).mockResolvedValueOnce(result(id))
    const order=await fresh.checkOrderIntent(7)
    expect(order?.request_id).toBe(id); expect(placeOrder).toHaveBeenCalledTimes(1)
    fresh.completeOrderIntent(7,order!); expect(fresh.readOrderIntent(7)).toBeNull()
  })
  it('checks a 404 without sending; explicit retry preserves original key and payload', async () => {
    vi.mocked(placeOrder).mockRejectedValueOnce(new Error('offline'))
    await expect(submitOrderIntent(7,5,body)).rejects.toThrow()
    const id=readOrderIntent(7)!.requestId
    vi.mocked(orderByRequest).mockResolvedValue(null)
    expect(await checkOrderIntent(7)).toBeNull(); expect(placeOrder).toHaveBeenCalledTimes(1)
    const order=await retryOrderIntent(7)
    expect(placeOrder).toHaveBeenLastCalledWith(5,{...body,request_id:id,expected_user_id:7},null)
    completeOrderIntent(7,order)
  })
  it('does not send if status check fails and isolates account storage', async () => {
    records.set(orderIntentKey(7),JSON.stringify({userId:7,requestId:'old-key-123',marketId:5,createdAt:Date.now(),body}))
    vi.mocked(orderByRequest).mockRejectedValue(new Error('offline'))
    await expect(retryOrderIntent(7)).rejects.toThrow('offline')
    expect(placeOrder).not.toHaveBeenCalled(); expect(readOrderIntent(8)).toBeNull()
    records.set(orderIntentKey(8),records.get(orderIntentKey(7))!)
    expect(()=>readOrderIntent(8)).toThrow()
  })
  it('expires payload, retaining a blocking key until server status confirms completion', async () => {
    records.set(orderIntentKey(7),JSON.stringify({userId:7,requestId:'expired-key',marketId:5,createdAt:Date.now()-ORDER_INTENT_TTL-1,body}))
    expect(readOrderIntent(7)?.body).toBeUndefined()
    vi.mocked(orderByRequest).mockResolvedValue(null)
    await expect(retryOrderIntent(7)).rejects.toThrow('Не удалось определить')
    await expect(submitOrderIntent(7,5,body)).rejects.toThrow('предыдущей'); expect(placeOrder).not.toHaveBeenCalled()
    vi.mocked(orderByRequest).mockResolvedValue(result('expired-key'))
    completeOrderIntent(7,(await checkOrderIntent(7))!); expect(readOrderIntent(7)).toBeNull()
  })
  it('fails closed when storage is unavailable', async () => {
    vi.stubGlobal('localStorage',{getItem:()=>null,setItem:()=>{throw new Error('quota')}})
    await expect(submitOrderIntent(7,5,body)).rejects.toThrow('quota'); expect(placeOrder).not.toHaveBeenCalled()
  })
  it.each([401,403,409,500])('retains unknown result on HTTP %i', async status => {
    vi.mocked(placeOrder).mockRejectedValueOnce(new ApiError('unknown',{status,code:'http'}))
    await expect(submitOrderIntent(7,5,body)).rejects.toThrow('unknown'); expect(readOrderIntent(7)).not.toBeNull()
  })
  it.each([400,422])('clears definitive pre-commit rejection HTTP %i', async status => {
    vi.mocked(placeOrder).mockRejectedValueOnce(new ApiError('rejected',{status,code:'http'}))
    await expect(submitOrderIntent(7,5,body)).rejects.toThrow('rejected'); expect(readOrderIntent(7)).toBeNull()
  })
})
