import type { Meta, StoryObj } from '@storybook/react'
import {
  marketAboveBelow,
  marketCancelled,
  marketClosing,
  marketLongQuestion,
  marketNoLiquidity,
  marketResolved,
  marketTeams,
  marketYesNo,
} from '../../fixtures/markets'
import { MarketCard } from './MarketCard'

const meta = {
  title: 'Components/MarketCard',
  component: MarketCard,
  tags: ['autodocs'],
  args: { market: marketYesNo },
  decorators: [
    (Story) => (
      <div style={{ width: 358 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MarketCard>

export default meta
type Story = StoryObj<typeof meta>

export const Normal: Story = {}

export const Teams: Story = {
  args: { market: marketTeams },
}

export const AboveBelow: Story = {
  args: { market: marketAboveBelow },
}

export const NoLiquidity: Story = {
  args: { market: marketNoLiquidity },
}

export const Closing: Story = {
  args: { market: marketClosing },
}

export const Resolved: Story = {
  args: { market: marketResolved },
}

export const Cancelled: Story = {
  args: { market: marketCancelled },
}

export const LongQuestion: Story = {
  args: { market: marketLongQuestion },
}
