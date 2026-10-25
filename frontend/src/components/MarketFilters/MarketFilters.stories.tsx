import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { MarketFilters } from './MarketFilters'

const meta = {
  title: 'Components/MarketFilters',
  component: MarketFilters,
  tags: ['autodocs'],
  args: {
    sort: 'new',
    category: 'all',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 358 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MarketFilters>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Sport: Story = {
  args: { sort: 'new', category: 'sport' },
}

export const Interactive: Story = {
  render: function Render() {
    const [sort, setSort] = useState('new')
    const [category, setCategory] = useState('all')
    const [open, setOpen] = useState(false)
    return (
      <MarketFilters
        sort={sort}
        category={category}
        filtersOpen={open}
        onSortChange={setSort}
        onCategoryChange={setCategory}
        onFiltersClick={() => setOpen((value) => !value)}
      />
    )
  },
}
