import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { checkOrderIntent, completeOrderIntent, INTENT_EVENT, orderIntentKey, readOrderIntent, retryOrderIntent, UNKNOWN_RESULT } from '../api/orderIntent'
import { formatTonFull } from '../lib/format'
import type { OrderOut } from '../api/types'
import { Button } from '../components/Button/Button'
import styles from './OrderIntentRecovery.module.css'

export function useHasOrderIntent(userId?: number): boolean {
  const snapshot = () => {
    if (!userId) return ''
    try { return localStorage.getItem(orderIntentKey(userId)) ?? '' } catch { return 'storage-unavailable' }
  }
  const raw = useSyncExternalStore(callback => {
    window.addEventListener(INTENT_EVENT, callback); window.addEventListener('storage', callback)
    return () => { window.removeEventListener(INTENT_EVENT, callback); window.removeEventListener('storage', callback) }
  }, snapshot, () => '')
  return !!raw
}

export function OrderIntentRecovery({userId, busy, onResolved}: {userId:number; busy:boolean; onResolved:(order:OrderOut)=>void}) {
  const [checking, setChecking] = useState(false)
  const [known, setKnown] = useState<OrderOut | null>(null)
  const [message, setMessage] = useState('Проверяем результат операции…')
  const [canRetry, setCanRetry] = useState(false)
  const resolved = useRef(onResolved); resolved.current = onResolved
  const alive = useRef(true)
  const accept = (order:OrderOut) => { setKnown(order) }
  const acceptRef = useRef(accept); acceptRef.current = accept
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  useEffect(() => {
    if (busy) return
    let active = true
    const check = async () => {
      if (document.visibilityState === 'hidden') return
      setChecking(true); setMessage('Проверяем результат операции…')
      try {
        const intent = readOrderIntent(userId)
        const result = await checkOrderIntent(userId)
        if (!active) return
        if (result) acceptRef.current(result)
        else { setMessage(UNKNOWN_RESULT); setCanRetry(!!intent?.body) }
      } catch { if (active) { setMessage(UNKNOWN_RESULT); setCanRetry(false) } }
      finally { if (active) setChecking(false) }
    }
    void check()
    window.addEventListener('focus', check); document.addEventListener('visibilitychange', check)
    return () => { active = false; window.removeEventListener('focus', check); document.removeEventListener('visibilitychange', check) }
  }, [userId,busy])
  const retry = async () => {
    setChecking(true); setMessage('Проверяем результат операции…')
    try {
      const order = canRetry ? await retryOrderIntent(userId) : await checkOrderIntent(userId)
      if (alive.current) {
        if (order) acceptRef.current(order)
        else { setMessage(UNKNOWN_RESULT); setCanRetry(!!readOrderIntent(userId)?.body) }
      }
    } catch { if (alive.current) setMessage(UNKNOWN_RESULT) }
    finally { if (alive.current) setChecking(false) }
  }
  return <section className={styles.screen} role="status" aria-live="polite"><div className={styles.panel}>
    {known ? <>
    <p>Результат операции подтверждён</p>
    <p>Событие #{known.market_id}{known.kind === 'legacy_buy' ? ' · ставка выполнена' : ' · коэффициент ' + known.odds}</p>
    <p>Исполнено: {formatTonFull(known.filled)} · осталось в предложении: {formatTonFull(known.remaining)} · возвращено: {formatTonFull(known.refunded)}</p>
    <Button fullWidth onClick={() => { resolved.current(known); completeOrderIntent(userId,known) }}>Продолжить</Button>
  </> : <>
    <p>{busy ? 'Отправляем предложение…' : message}</p>
    {!busy ? <Button fullWidth disabled={checking} onClick={() => { void retry() }}>{canRetry ? 'Повторить прежнее предложение' : 'Проверить результат'}</Button> : null}
  </>}
  </div></section>
}
