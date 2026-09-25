import { useT } from '../../i18n'
import { cx } from '../../lib/cx'
import styles from './MarketFilters.module.css'

export type MarketFiltersProps = {
  sort: string
  category?: string
  filtersOpen?: boolean
  filtersActive?: boolean
  onSortChange?: (id: string) => void
  onCategoryChange?: (id: string) => void
  onFiltersClick?: () => void
}

export function MarketFilters({
  sort,
  onSortChange,
}: MarketFiltersProps) {
  const t = useT()
  const sortTabs = [
    { id: 'new', label: t('cat.all') },
    { id: 'popular', label: t('feed.popular') },
    { id: 'closing', label: t('status.closing') },
  ]

  return (
    <div className={styles.root} role="tablist" aria-label={t('feed.sort')}>
      {sortTabs.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={item.id === sort}
          className={cx(styles.tab, item.id === sort && styles.active)}
          onClick={() => onSortChange?.(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
