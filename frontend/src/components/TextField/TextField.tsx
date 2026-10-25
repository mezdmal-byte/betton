import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'
import styles from './TextField.module.css'

type Shared = {
  label?: string
  hint?: string
  value: string
  onChange?: (value: string) => void
  multiline?: boolean
}

export type TextFieldProps = Shared &
  Omit<InputHTMLAttributes<HTMLInputElement> & TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'>

export function TextField({
  label,
  hint,
  value,
  onChange,
  multiline = false,
  className,
  id,
  ...rest
}: TextFieldProps) {
  const fieldId = id ?? label
  const control = multiline ? (
    <textarea
      id={fieldId}
      className={cx(styles.control, styles.area)}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      {...rest}
    />
  ) : (
    <input
      id={fieldId}
      className={styles.control}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      {...rest}
    />
  )

  return (
    <div className={cx(styles.root, className)}>
      {label ? (
        <label className={styles.label} htmlFor={fieldId}>
          {label}
        </label>
      ) : null}
      {control}
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  )
}
