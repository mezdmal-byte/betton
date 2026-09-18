import { CheckCircle2, Clock3, ShieldAlert, XCircle } from 'lucide-react'
import { useT } from '../../i18n'
import type { MarketFixture } from '../../types/market'
import styles from './MarketStatusPanel.module.css'

export type MarketStatusPanelProps = {
  market: MarketFixture
}

export function MarketStatusPanel({ market }: MarketStatusPanelProps) {
  const t = useT()
  if (market.status === 'open' || market.status === 'closing') return null

  const winner = market.resolvedSide === 'a' ? market.outcomeA : market.resolvedSide === 'b' ? market.outcomeB : null
  const config =
    market.status === 'resolved'
      ? {
          tone: 'success',
          icon: <CheckCircle2 size={20} aria-hidden="true" />,
          title: t('status.resolvedOne'),
          body: winner ? `${t('market.badgeResult')}: ${winner.label}` : '',
        }
      : market.status === 'cancelled'
        ? {
            tone: 'danger',
            icon: <XCircle size={20} aria-hidden="true" />,
            title: t('status.cancelledOne'),
            body: t('help.cancel'),
          }
        : market.status === 'pending'
          ? {
              tone: 'pending',
              icon: <Clock3 size={20} aria-hidden="true" />,
              title: t('status.pending'),
              body: t('create.resultPendingBody'),
            }
          : market.status === 'rejected'
            ? {
                tone: 'danger',
                icon: <ShieldAlert size={20} aria-hidden="true" />,
                title: t('status.rejected'),
                body: market.rejectionReason ?? '',
              }
            : {
                tone: 'neutral',
                icon: <Clock3 size={20} aria-hidden="true" />,
                title: t('status.closedOne'),
                body: '',
              }

  return (
    <section className={`${styles.panel} ${styles[config.tone]}`} aria-live="polite">
      <span className={styles.icon}>{config.icon}</span>
      <div className={styles.copy}>
        <strong>{config.title}</strong>
        {config.body ? <p>{config.body}</p> : null}
      </div>
    </section>
  )
}
