import type { Meta, StoryObj } from '@storybook/react'
import { marketNoLiquidity, marketPartialLiquidity, marketYesNo } from '../../fixtures/markets'
import { QuickTradeSheet } from './QuickTradeSheet'

const meta = {
  title: 'Components/QuickTradeSheet',
  component: QuickTradeSheet,
  tags: ['autodocs'],
  args: {
    market: marketYesNo,
    selectedSide: 'a',
    amount: 100,
    state: 'normal',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 390 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof QuickTradeSheet>

export default meta
type Story = StoryObj<typeof meta>

export const Normal: Story = {}

export const Partial: Story = {
  args: { state: 'partial', market: marketPartialLiquidity, amount: 100 },
}

export const NoLiquidity: Story = {
  args: { state: 'no-liquidity', market: marketNoLiquidity },
}

export const Processing: Story = {
  args: { state: 'processing' },
}

export const StaleQuote: Story = {
  args: { state: 'stale-quote' },
}

export const InsufficientBalance: Story = {
  args: { state: 'insufficient-balance', amount: 500 },
}
