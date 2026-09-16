import type { Meta, StoryObj } from '@storybook/react'
import { RangeSelector } from './RangeSelector'

const meta = {
  title: 'Components/RangeSelector',
  component: RangeSelector,
  tags: ['autodocs'],
  args: { value: '1d' },
} satisfies Meta<typeof RangeSelector>

export default meta
type Story = StoryObj<typeof meta>

export const Day: Story = {}

export const All: Story = {
  args: { value: 'all' },
}
