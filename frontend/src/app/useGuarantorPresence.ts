import { useEffect } from 'react'
import { apiRequest } from '../api/client'

/** Keep the existing guarantor heartbeat without an automatic notice overlay.
 * Unread notices remain visible in the navigation badge and notification list.
 */
export function useGuarantorPresence(userId?: number) {
  useEffect(() => {
    if (!userId) return
    const beat = () => {
      if (document.visibilityState === 'visible') {
        void apiRequest('/guarantors/me/heartbeat', { method: 'POST' }).catch(() => undefined)
      }
    }
    beat()
    const timer = window.setInterval(beat, 30_000)
    document.addEventListener('visibilitychange', beat)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', beat)
    }
  }, [userId])
}
