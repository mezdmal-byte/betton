import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { marketYesNo, orderBookA, recentTrades } from '../../fixtures/markets'
import { OwnPricePanel } from './OwnPricePanel'

const meta = {
  title: 'Components/OwnPricePanel',
  component: OwnPricePanel,
  tags: ['autodocs'],
  args: {
    question: marketYesNo.question,
    outcomeALabel: marketYesNo.outcomeA.label,
    outcomeBLabel: marketYesNo.outcomeB.label,
    selectedSide: 'a',
    odds: 1.82,
    amount: 100,
    book: orderBookA,
    trades: recentTrades,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 358 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OwnPricePanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const RestingRemainder: Story = {
  args: { amount: 400 },
}

export const Interactive: Story = {
  render: function Render() {
    const [amount, setAmount] = useState(100)
    const [odds, setOdds] = useState(1.82)
    return (
      <OwnPricePanel
        question={marketYesNo.question}
        outcomeALabel={marketYesNo.outcomeA.label}
        outcomeBLabel={marketYesNo.outcomeB.label}
        selectedSide="a"
        odds={odds}
        amount={amount}
        book={orderBookA}
        trades={recentTrades}
        onAmountChange={setAmount}
        onOddsChange={setOdds}
      />
    )
  },
}
