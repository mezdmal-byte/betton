import { cx } from '../../lib/cx'
import styles from './Avatar.module.css'

export type AvatarSize = 'sm' | 'md' | 'lg'

export type AvatarProps = {
  initials: string
  src?: string
  name?: string
  size?: AvatarSize
  className?: string
  onClick?: () => void
}

export function Avatar({ initials, src, name, size = 'md', className, onClick }: AvatarProps) {
  return (
    <span
      className={cx(styles.root, styles[size], className)}
      aria-hidden={!name}
      title={name}
      onClick={onClick}
    >
      {src ? <img src={src} alt="" className={styles.image} /> : <span>{initials}</span>}
    </span>
  )
}
