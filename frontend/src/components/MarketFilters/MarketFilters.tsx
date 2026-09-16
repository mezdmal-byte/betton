import { SlidersHorizontal } from 'lucide-react'
import { Chip } from '../Chip/Chip'
import { IconButton } from '../IconButton/IconButton'
import { Tabs } from '../Tabs/Tabs'
import styles from './MarketFilters.module.css'

export const SORT_TABS = [
  { id: 'new', label: 'Новые' },
  { id: 'popular', label: 'Популярные' },
  { id: 'closing', label: 'Скоро' },
] as const

export const CATEGORY_PILLS = [
  { id: 'all', label: 'Все' },
  { id: 'sport', label: 'Спорт' },
  { id: 'politics', label: 'Политика' },
  { id: 'other', label: 'Другое' },
] as const

export type MarketFiltersProps = {
  sort: string
  category: string
  filtersOpen?: boolean
  onSortChange?: (id: string) => void
  onCategoryChange?: (id: string) => void
  onFiltersClick?: () => void
}

export function MarketFilters({
  sort,
  category,
  filtersOpen = false,
  onSortChange,
  onCategoryChange,
  onFiltersClick,
}: MarketFiltersProps) {
  return (
    <div className={styles.root}>
      <Tabs items={[...SORT_TABS]} value={sort} onChange={onSortChange} ariaLabel="Лента" />
      <div className={styles.row}>
        <div className={styles.pills} role="group" aria-label="Категории">
          {CATEGORY_PILLS.map((item) => (
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
          label="Фильтры"
          variant="bordered"
          size="md"
          aria-pressed={filtersOpen}
          onClick={onFiltersClick}
        >
          <SlidersHorizontal size={18} strokeWidth={2} />
        </IconButton>
      </div>
    </div>
  )
}
