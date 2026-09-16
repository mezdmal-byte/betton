import type { Meta, StoryObj } from '@storybook/react'
import { PhoneShell } from '../layouts/PhoneShell'
import { MarketDetailScreen } from './MarketDetailScreen'

const meta = {
  title: 'Screens/MarketDetail',
  component: MarketDetailScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'phone390' },
  },
} satisfies Meta<typeof MarketDetailScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <PhoneShell>
      <MarketDetailScreen />
    </PhoneShell>
  ),
}

export const SideB: Story = {
  render: () => (
    <PhoneShell>
      <MarketDetailScreen selectedSide="b" />
    </PhoneShell>
  ),
}

export const Wide430: Story = {
  parameters: { viewport: { defaultViewport: 'phone430' } },
  render: () => (
    <PhoneShell width={430} height={932}>
      <MarketDetailScreen />
    </PhoneShell>
  ),
}
