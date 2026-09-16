import { cx } from '../../lib/cx'
import styles from './Avatar.module.css'

export type AvatarSize = 'sm' | 'md' | 'lg'

export type AvatarProps = {
  initials: string
  src?: string
  name?: string
  size?: AvatarSize
  className?: string
}

export function Avatar({ initials, src, name, size = 'md', className }: AvatarProps) {
  return (
    <span className={cx(styles.root, styles[size], className)} aria-hidden={!name} title={name}>
      {src ? <img src={src} alt="" className={styles.image} /> : <span>{initials}</span>}
    </span>
  )
}
