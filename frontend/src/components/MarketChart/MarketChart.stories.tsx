import type { Meta, StoryObj } from '@storybook/react'
import { chartSpartak } from '../../fixtures/markets'
import { MarketChart } from './MarketChart'

const meta = {
  title: 'Components/MarketChart',
  component: MarketChart,
  tags: ['autodocs'],
  args: {
    series: chartSpartak,
    currentOdds: 1.82,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 358 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MarketChart>

export default meta
type Story = StoryObj<typeof meta>

export const Placeholder: Story = {}
