import type { Meta, StoryObj } from '@storybook/react'
import { Avatar } from './Avatar'

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: {
    initials: 'ВА',
    name: 'Вася',
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Medium: Story = {}

export const Small: Story = {
  args: { size: 'sm' },
}

export const Large: Story = {
  args: { size: 'lg' },
}

export const LongInitials: Story = {
  args: { initials: 'АА', name: 'Александр Александрович' },
}
