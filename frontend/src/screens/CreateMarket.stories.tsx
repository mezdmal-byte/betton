import type { Meta, StoryObj } from '@storybook/react'
import { PhoneShell } from '../layouts/PhoneShell'
import { longCreateDraft, privateCreateDraft, teamCreateDraft } from '../fixtures/account'
import { CreateMarketScreen } from './CreateMarketScreen'

const meta = {
  title: 'Screens/CreateMarket',
  component: CreateMarketScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'phone390' },
  },
} satisfies Meta<typeof CreateMarketScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <PhoneShell>
      <CreateMarketScreen />
    </PhoneShell>
  ),
}

export const TeamOutcomes: Story = {
  render: () => (
    <PhoneShell>
      <CreateMarketScreen draft={teamCreateDraft} />
    </PhoneShell>
  ),
}

export const Private: Story = {
  render: () => (
    <PhoneShell>
      <CreateMarketScreen draft={privateCreateDraft} />
    </PhoneShell>
  ),
}

export const FeeOpen: Story = {
  render: () => (
    <PhoneShell>
      <CreateMarketScreen feeOpen />
    </PhoneShell>
  ),
}

export const LongContent: Story = {
  render: () => (
    <PhoneShell>
      <CreateMarketScreen draft={longCreateDraft} />
    </PhoneShell>
  ),
}

export const Keyboard: Story = {
  render: () => (
    <PhoneShell height={508}>
      <CreateMarketScreen />
    </PhoneShell>
  ),
}

export const Wide430: Story = {
  parameters: { viewport: { defaultViewport: 'phone430' } },
  render: () => (
    <PhoneShell width={430} height={932}>
      <CreateMarketScreen />
    </PhoneShell>
  ),
}
