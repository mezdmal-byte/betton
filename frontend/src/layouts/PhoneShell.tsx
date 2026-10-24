import type { CSSProperties, ReactNode } from 'react'
import styles from './PhoneShell.module.css'

export type PhoneShellProps = {
  children: ReactNode
  width?: number
  height?: number
}

export function PhoneShell({ children, width = 390, height = 844 }: PhoneShellProps) {
  return (
    <div
      className={styles.shell}
      data-testid="phone-shell"
      style={{ '--shell-width': `${width}px`, '--shell-height': `${height}px` } as CSSProperties}
    >
      {children}
    </div>
  )
}
