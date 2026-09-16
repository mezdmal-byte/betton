import { SlidersHorizontal } from 'lucide-react'
import { useT } from '../../i18n'
import { Chip } from '../Chip/Chip'
import { IconButton } from '../IconButton/IconButton'
import { Tabs } from '../Tabs/Tabs'
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
  filtersOpen = false,
  filtersActive = false,
  onSortChange,
  onCategoryChange,
  onFiltersClick,
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
    { id: 'other', label: t('cat.other') },
  ]

  return (
    <div className={styles.root}>
      <Tabs items={sortTabs} value={sort} onChange={onSortChange} ariaLabel={t('feed.sort')} />
      <div className={styles.row}>
        <div className={styles.pills} role="group" aria-label={t('feed.cats')}>
          {categories.map((item) => (
            <Chip
              key={item.id}
              compact
              selected={item.id === category}
              onClick={() => onCategoryChange?.(item.id)}
            >
              {item.label}
            </Chip>
          ))}
        </div>
        <IconButton
          label={t('feed.filters')}
          variant="bordered"
          size="md"
          aria-pressed={filtersOpen || filtersActive}
          onClick={onFiltersClick}
        >
          <SlidersHorizontal size={18} strokeWidth={2} />
        </IconButton>
      </div>
    </div>
  )
}
