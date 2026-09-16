import type { Meta, StoryObj } from '@storybook/react'
import { PhoneShell } from '../layouts/PhoneShell'
import { PortfolioScreen } from './PortfolioScreen'

const meta = {
  title: 'Screens/Portfolio',
  component: PortfolioScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'phone390' },
  },
} satisfies Meta<typeof PortfolioScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <PhoneShell>
      <PortfolioScreen />
    </PhoneShell>
  ),
}

export const Positions: Story = {
  render: () => (
    <PhoneShell>
      <PortfolioScreen tab="positions" />
    </PhoneShell>
  ),
}

export const Orders: Story = {
  render: () => (
    <PhoneShell>
      <PortfolioScreen tab="orders" />
    </PhoneShell>
  ),
}

export const History: Story = {
  render: () => (
    <PhoneShell>
      <PortfolioScreen tab="history" />
    </PhoneShell>
  ),
}

export const Empty: Story = {
  render: () => (
    <PhoneShell>
      <PortfolioScreen positions={[]} orders={[]} history={[]} />
    </PhoneShell>
  ),
}

export const HistoryFromProfile: Story = {
  render: () => (
    <PhoneShell>
      <PortfolioScreen variant="history" tab="history" onBack={() => undefined} />
    </PhoneShell>
  ),
}

export const Wide430: Story = {
  parameters: { viewport: { defaultViewport: 'phone430' } },
  render: () => (
    <PhoneShell width={430} height={932}>
      <PortfolioScreen />
    </PhoneShell>
  ),
}
