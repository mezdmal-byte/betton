import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import styles from './IconButton.module.css'

export type IconButtonProps = {
  label: string
  variant?: 'plain' | 'bordered'
  size?: 'md' | 'lg'
  children: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'>

export function IconButton({
  label,
  variant = 'plain',
  size = 'lg',
  className,
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cx(styles.root, styles[variant], styles[size], className)}
      {...rest}
    >
      {children}
    </button>
  )
}
