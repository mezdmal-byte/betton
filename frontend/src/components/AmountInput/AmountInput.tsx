import type { InputHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'
import styles from './AmountInput.module.css'

export type AmountInputProps = {
  value: string
  onChange?: (value: string) => void
  suffix?: string
  label?: string
  error?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>

export function AmountInput({
  value,
  onChange,
  suffix = 'TON',
  label = 'Сумма',
  error,
  className,
  id = 'amount',
  ...rest
}: AmountInputProps) {
  return (
    <div className={cx(styles.root, className)}>
      {label ? (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      ) : null}
      <div className={cx(styles.field, error && styles.invalid)}>
        <input
          id={id}
          className={styles.input}
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          {...rest}
        />
        <span className={styles.suffix}>{suffix}</span>
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  )
}
