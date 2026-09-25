import type { Meta, StoryObj } from '@storybook/react'
import { PhoneShell } from '../layouts/PhoneShell'
import { NotificationsScreen, notificationPreviewItems } from './NotificationsScreen'

const meta = {
  title: 'Screens/Notifications',
  component: NotificationsScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'phone390' },
  },
} satisfies Meta<typeof NotificationsScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <PhoneShell>
      <NotificationsScreen items={notificationPreviewItems.slice(0, 2)} />
    </PhoneShell>
  ),
}

export const Read: Story = {
  render: () => (
    <PhoneShell>
      <NotificationsScreen
        items={notificationPreviewItems
          .filter((item) => ['market-resolved', 'order-cancelled'].includes(item.id))
          .map((item) => ({ ...item, unread: false }))}
      />
    </PhoneShell>
  ),
}

export const Empty: Story = {
  render: () => (
    <PhoneShell>
      <NotificationsScreen items={[]} />
    </PhoneShell>
  ),
}

export const PartialFill: Story = detailStory('partial-fill')
export const FullFill: Story = detailStory('full-fill')
export const OrderCancelled: Story = detailStory('order-cancelled')
export const Refund: Story = detailStory('refund')
export const MarketClosingSoon: Story = detailStory('market-closing')
export const MarketClosed: Story = detailStory('awaiting-resolution')
export const MarketResolved: Story = detailStory('market-resolved')
export const Payout: Story = detailStory('payout')
export const CreatedMarketApproved: Story = detailStory('created-approved')
export const CreatedMarketRejected: Story = detailStory('created-rejected')
export const AdminModeration: Story = detailStory('admin-moderation')

function detailStory(id: string): Story {
  return {
    render: () => (
      <PhoneShell>
        <NotificationsScreen items={notificationPreviewItems} initialSelectedId={id} />
      </PhoneShell>
    ),
  }
}
