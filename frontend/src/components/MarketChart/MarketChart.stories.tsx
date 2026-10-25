import type { Meta, StoryObj } from '@storybook/react'
import { chartSpartakA, chartSpartakB } from '../../fixtures/markets'
import { MarketChart } from './MarketChart'

const meta = {
  title: 'Components/MarketChart',
  component: MarketChart,
  tags: ['autodocs'],
  args: {
    series: chartSpartakA,
    currentOdds: 1.82,
    outcomeLabel: 'Да',
    volumeTon: 1800,
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

export const SideB: Story = {
  args: {
    series: chartSpartakB,
    currentOdds: 2.18,
    outcomeLabel: 'Нет',
    volumeTon: 1800,
  },
}
