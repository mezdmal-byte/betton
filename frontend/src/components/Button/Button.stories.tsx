import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Поставить',
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Своя цена' },
}

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Отмена' },
}

export const Loading: Story = {
  args: { loading: true, children: 'Ставим…' },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const FullWidth: Story = {
  args: { fullWidth: true, children: 'Поставить 100 TON' },
  decorators: [
    (Story) => (
      <div style={{ width: 358 }}>
        <Story />
      </div>
    ),
  ],
}
