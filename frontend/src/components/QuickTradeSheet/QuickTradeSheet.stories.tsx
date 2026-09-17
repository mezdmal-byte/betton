import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
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

export const EmptyAmount: Story = {
  args: { amount: 0 },
}

export const MaxPreset: Story = {
  args: {
    amount: 0,
    market: { ...marketYesNo, outcomeA: { ...marketYesNo.outcomeA, odds: 2, liquidityTon: 66 } },
    availableTon: 1000,
  },
}

export const Partial: Story = {
  args: { state: 'partial', market: marketPartialLiquidity, amount: 100 },
}

export const PartialInteractive: Story = {
  render: function Render() {
    const [amount, setAmount] = useState(100)
    return (
      <QuickTradeSheet
        market={marketPartialLiquidity}
        selectedSide="a"
        amount={amount}
        state="partial"
        onAmountChange={setAmount}
      />
    )
  },
}

export const NoLiquidity: Story = {
  args: { state: 'no-liquidity', market: marketNoLiquidity },
}

export const SelectedEmptyQuote: Story = {
  args: { market: marketPartialLiquidity, selectedSide: 'b', amount: 100 },
}

export const Processing: Story = {
  args: { state: 'processing' },
}

export const StaleQuote: Story = {
  args: { state: 'stale-quote' },
}

export const InsufficientBalance: Story = {
  args: { state: 'insufficient-balance', amount: 500, availableTon: 1240 },
}

export const SuccessFull: Story = {
  args: {
    state: 'success',
    placeResult: { kind: 'full', filledTon: 100, refundedTon: 0 },
  },
}

export const SuccessPartial: Story = {
  args: {
    state: 'success',
    placeResult: { kind: 'partial', filledTon: 40, refundedTon: 60 },
  },
}
