import type { Meta, StoryObj } from '@storybook/react'
import { Chip } from './Chip'

const meta = {
  title: 'Components/Chip',
  component: Chip,
  tags: ['autodocs'],
  args: { children: 'Спорт' },
} satisfies Meta<typeof Chip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Selected: Story = {
  args: { selected: true, children: 'Новые' },
}

export const SelectedPlum: Story = {
  args: { selected: true, tone: 'plum', surface: 'raised', children: 'Все' },
}

export const Compact: Story = {
  args: { compact: true, children: 'Политика' },
}

export const CategoryRow: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, width: 358 }}>
      <Chip compact surface="raised" tone="plum" selected>
        Все
      </Chip>
      <Chip compact surface="raised" tone="plum">
        Спорт
      </Chip>
      <Chip compact surface="raised" tone="plum">
        Политика
      </Chip>
      <Chip compact surface="raised" tone="plum">
        Другое
      </Chip>
    </div>
  ),
}
