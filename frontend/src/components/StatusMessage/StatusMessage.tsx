import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import styles from './StatusMessage.module.css'

export type StatusTone = 'empty' | 'error' | 'loading' | 'warning'

export type StatusMessageProps = {
  tone?: StatusTone
  title: string
  children?: ReactNode
}

export function StatusMessage({ tone = 'empty', title, children }: StatusMessageProps) {
  return (
    <div
      className={cx(styles.root, styles[tone])}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-busy={tone === 'loading' || undefined}
      aria-live={tone === 'loading' ? 'polite' : undefined}
    >
      <strong>{title}</strong>
      {children ? <p>{children}</p> : null}
    </div>
  )
}
