import type { Meta, StoryObj } from '@storybook/react'
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
    fillNowTon: 40,
    restTon: 60,
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
