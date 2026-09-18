import { useT } from '../../i18n'
import { cx } from '../../lib/cx'
import { Chip } from '../Chip/Chip'
import styles from './MarketFilters.module.css'

export type MarketFiltersProps = {
  sort: string
  category: string
  filtersOpen?: boolean
  filtersActive?: boolean
  onSortChange?: (id: string) => void
  onCategoryChange?: (id: string) => void
  onFiltersClick?: () => void
}

export function MarketFilters({
  sort,
  category,
  onSortChange,
  onCategoryChange,
}: MarketFiltersProps) {
  const t = useT()
  const sortTabs = [
    { id: 'new', label: t('feed.new') },
    { id: 'popular', label: t('feed.popular') },
    { id: 'closing', label: t('feed.closing') },
  ]
  const categories = [
    { id: 'all', label: t('cat.all') },
    { id: 'sport', label: t('cat.sport') },
    { id: 'politics', label: t('cat.politics') },
    { id: 'crypto', label: t('cat.crypto') },
    { id: 'other', label: t('cat.other') },
  ]

  return (
    <div className={styles.root}>
      <div className={styles.sortRow} role="tablist" aria-label={t('feed.sort')}>
        {sortTabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === sort}
            className={cx(styles.sortTab, item.id === sort && styles.sortTabActive)}
            onClick={() => onSortChange?.(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className={styles.row} role="group" aria-label={t('feed.cats')}>
        {categories.map((item) => (
          <Chip
            key={item.id}
            compact
            surface="raised"
            tone="plum"
            selected={item.id === category}
            onClick={() => onCategoryChange?.(item.id)}
          >
            {item.label}
          </Chip>
        ))}
      </div>
    </div>
  )
}
