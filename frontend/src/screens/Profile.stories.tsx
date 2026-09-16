import type { Meta, StoryObj } from '@storybook/react'
import { PhoneShell } from '../layouts/PhoneShell'
import { adminUser, longHandleUser } from '../fixtures/account'
import { ProfileScreen } from './ProfileScreen'

const meta = {
  title: 'Screens/Profile',
  component: ProfileScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'phone390' },
  },
} satisfies Meta<typeof ProfileScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <PhoneShell>
      <ProfileScreen />
    </PhoneShell>
  ),
}

export const Admin: Story = {
  render: () => (
    <PhoneShell>
      <ProfileScreen account={adminUser} />
    </PhoneShell>
  ),
}

export const LongHandle: Story = {
  render: () => (
    <PhoneShell>
      <ProfileScreen account={longHandleUser} />
    </PhoneShell>
  ),
}

export const Wide430: Story = {
  parameters: { viewport: { defaultViewport: 'phone430' } },
  render: () => (
    <PhoneShell width={430} height={932}>
      <ProfileScreen />
    </PhoneShell>
  ),
}
