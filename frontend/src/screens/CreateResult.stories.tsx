import type { Meta, StoryObj } from '@storybook/react'
import { PhoneShell } from '../layouts/PhoneShell'
import { CreateMarketResult } from '../app/CreateMarketResult'
import type { MarketOut } from '../api/types'

const unlisted: MarketOut = {
  id: 11,
  question: 'Спартак обыграет Зенит?',
  description: '',
  creator_id: 1,
  category: 'unique',
  outcomes: ['Да', 'Нет'],
  status: 'open',
  visibility: 'unlisted',
  share_token: 'sharetok',
}

const pending: MarketOut = {
  ...unlisted,
  id: 12,
  status: 'pending',
  visibility: 'public',
  share_token: null,
}

const meta = {
  title: 'Screens/CreateResult',
  component: CreateMarketResult,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'phone390' },
  },
} satisfies Meta<typeof CreateMarketResult>

export default meta
type Story = StoryObj<typeof meta>

export const ByLink: Story = {
  args: {
    market: unlisted,
    shareLink: 'https://t.me/examplebot?start=market_sharetok',
    onOpen: () => undefined,
    onBack: () => undefined,
    onToFeed: () => undefined,
  },
  render: (args) => (
    <PhoneShell>
      <CreateMarketResult {...args} />
    </PhoneShell>
  ),
}

export const Pending: Story = {
  args: {
    market: pending,
    shareLink: '',
    onOpen: () => undefined,
    onBack: () => undefined,
    onToFeed: () => undefined,
  },
  render: (args) => (
    <PhoneShell>
      <CreateMarketResult {...args} />
    </PhoneShell>
  ),
}
