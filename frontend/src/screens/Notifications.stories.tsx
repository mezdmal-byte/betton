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

export const Unread: Story = {
  render: () => (
    <PhoneShell>
      <NotificationsScreen items={notificationPreviewItems} />
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
