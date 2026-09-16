import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import styles from './Chip.module.css'

export type ChipProps = {
  selected?: boolean
  children: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>

export function Chip({ selected = false, className, children, type = 'button', ...rest }: ChipProps) {
  return (
    <button
      type={type}
      className={cx(styles.root, selected && styles.selected, className)}
      aria-pressed={selected}
      {...rest}
    >
      {children}
    </button>
  )
}
