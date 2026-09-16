import type { Meta, StoryObj } from '@storybook/react'
import { AmountInput } from './AmountInput'

const meta = {
  title: 'Components/AmountInput',
  component: AmountInput,
  tags: ['autodocs'],
  args: { value: '100' },
  decorators: [
    (Story) => (
      <div style={{ width: 358 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AmountInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Empty: Story = {
  args: { value: '', placeholder: '0' },
}

export const Error: Story = {
  args: {
    value: '500',
    error: 'Недостаточно средств · доступно 1 240 TON',
  },
}
