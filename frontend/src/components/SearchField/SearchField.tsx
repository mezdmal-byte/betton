import { Search } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'
import styles from './SearchField.module.css'

export type SearchFieldProps = {
  value: string
  onChange?: (value: string) => void
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>

export function SearchField({
  value,
  onChange,
  className,
  placeholder = 'Поиск рынков, тем или авторов',
  ...rest
}: SearchFieldProps) {
  return (
    <label className={cx(styles.root, className)}>
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
    </label>
  )
}
