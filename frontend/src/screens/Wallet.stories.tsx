import type { Meta, StoryObj } from '@storybook/react'
import { PhoneShell } from '../layouts/PhoneShell'
import { WalletScreen } from './WalletScreen'

const meta = {
  title: 'Screens/Wallet',
  component: WalletScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'phone390' },
  },
} satisfies Meta<typeof WalletScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <PhoneShell>
      <WalletScreen tab="deposit" />
    </PhoneShell>
  ),
}

export const Withdraw: Story = {
  render: () => (
    <PhoneShell>
      <WalletScreen tab="withdraw" />
    </PhoneShell>
  ),
}
