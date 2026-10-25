import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import styles from './Chip.module.css'

export type ChipTone = 'teal' | 'plum'
export type ChipSurface = 'muted' | 'raised'

export type ChipProps = {
  selected?: boolean
  compact?: boolean
  tone?: ChipTone
  surface?: ChipSurface
  children: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>

export function Chip({
  selected = false,
  compact = false,
  tone = 'teal',
  surface = 'muted',
  className,
  children,
  type = 'button',
  ...rest
}: ChipProps) {
  return (
    <button
      type={type}
      className={cx(
        styles.root,
        styles[surface],
        styles[tone],
        selected && styles.selected,
        compact && styles.compact,
        className,
      )}
      aria-pressed={selected}
      {...rest}
    >
      {children}
    </button>
  )
}
