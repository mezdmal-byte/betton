import type { Meta, StoryObj } from '@storybook/react'
import { BottomNavigation } from './BottomNavigation'

const meta = {
  title: 'Components/BottomNavigation',
  component: BottomNavigation,
  tags: ['autodocs'],
  args: { active: 'markets' },
  decorators: [
    (Story) => (
      <div style={{ width: 390 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BottomNavigation>

export default meta
type Story = StoryObj<typeof meta>

export const Markets: Story = {}

export const Create: Story = {
  args: { active: 'create' },
}

export const Portfolio: Story = {
  args: { active: 'portfolio' },
}
