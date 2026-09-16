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

export const Row: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Chip selected>Все</Chip>
      <Chip>Спорт</Chip>
      <Chip>Политика</Chip>
      <Chip>Другое</Chip>
    </div>
  ),
}
