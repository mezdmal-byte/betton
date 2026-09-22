import { Search } from 'lucide-react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import styles from './SearchField.module.css'

export type SearchFieldProps = {
  value: string
  onChange?: (value: string) => void
  trailing?: ReactNode
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>

export function SearchField({
  value,
  onChange,
  trailing,
  className,
  placeholder = 'Поиск рынков, тем или авторов',
  ...rest
}: SearchFieldProps) {
  return (
    <div className={cx(styles.root, trailing ? styles.withTrailing : undefined, className)}>
      <Search className={styles.icon} size={18} strokeWidth={2} aria-hidden="true" />
      <input
        type="search"
        className={styles.input}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        enterKeyHint="search"
        autoComplete="off"
        {...rest}
      />
      {trailing ? <span className={styles.trailing}>{trailing}</span> : null}
    </div>
  )
}
