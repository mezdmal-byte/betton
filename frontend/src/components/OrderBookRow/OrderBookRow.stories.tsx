import type { Meta, StoryObj } from '@storybook/react'
import { orderBookA } from '../../fixtures/markets'
import { OrderBookRow } from './OrderBookRow'

const meta = {
  title: 'Components/OrderBookRow',
  component: OrderBookRow,
  tags: ['autodocs'],
  args: {
    level: orderBookA[0],
    maxAvailable: 320,
    active: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 358 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OrderBookRow>

export default meta
type Story = StoryObj<typeof meta>

export const Active: Story = {}

export const Book: Story = {
  render: () => {
    const max = Math.max(...orderBookA.map((level) => level.availableTon))
    return (
      <div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            padding: '0 12px 8px',
            color: '#667085',
            fontSize: 12,
          }}
        >
          <span>Коэффициент</span>
          <span style={{ textAlign: 'right' }}>Доступно</span>
        </div>
        {orderBookA.map((level, index) => (
          <OrderBookRow key={level.odds} level={level} maxAvailable={max} active={index === 0} />
        ))}
      </div>
    )
  },
}
