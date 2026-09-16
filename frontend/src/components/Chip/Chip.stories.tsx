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
  args: { selected: true, children: 'Все' },
}

export const Compact: Story = {
  args: { compact: true, children: 'Политика' },
}

export const CategoryRow: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 4, width: 306 }}>
      <Chip compact selected>
        Все
      </Chip>
      <Chip compact>Спорт</Chip>
      <Chip compact>Политика</Chip>
      <Chip compact>Другое</Chip>
    </div>
  ),
}
