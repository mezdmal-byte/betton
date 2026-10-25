import type { Meta, StoryObj } from '@storybook/react'
import { SlidersHorizontal } from 'lucide-react'
import { IconButton } from './IconButton'

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  args: {
    label: 'Фильтры',
    children: <SlidersHorizontal size={20} strokeWidth={2} />,
  },
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

export const Plain: Story = {}

export const Bordered: Story = {
  args: { variant: 'bordered' },
}

export const Compact: Story = {
  args: { size: 'md', variant: 'bordered' },
}
