import { Calendar } from 'lucide-react'
import { useState } from 'react'
import { cx } from '../../lib/cx'
import styles from './DateTimeField.module.css'

export type DateTimeFieldProps = {
  label: string
  value: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  id?: string
}

function splitValue(value: string): { date: string; time: string } {
  const [date, time] = value.split(' · ')
  return { date: date ?? value, time: time ?? '' }
}

export function DateTimeField({
  label,
  value,
  open,
  onOpenChange,
  id = 'datetime',
}: DateTimeFieldProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const expanded = open ?? internalOpen
  const { date, time } = splitValue(value)
  const panelId = `${id}-panel`

  function toggle() {
    const next = !expanded
    setInternalOpen(next)
    onOpenChange?.(next)
  }

  return (
    <div className={styles.root}>
      <span className={styles.label} id={`${id}-label`}>
        {label}
      </span>
      <button
        type="button"
        className={cx(styles.button, expanded && styles.open)}
        aria-labelledby={`${id}-label`}
        aria-haspopup="dialog"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={toggle}
      >
        <Calendar size={18} strokeWidth={1.8} aria-hidden="true" />
        <span className={styles.value}>{value}</span>
      </button>
      {expanded ? (
        <div className={styles.panel} id={panelId} role="dialog" aria-label={label}>
          <div className={styles.row}>
            <span>Дата</span>
            <b>{date}</b>
          </div>
          {time ? (
            <div className={styles.row}>
              <span>Время</span>
              <b>{time}</b>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
