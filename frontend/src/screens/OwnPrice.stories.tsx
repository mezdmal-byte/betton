import type { Meta, StoryObj } from '@storybook/react'
import { PhoneShell } from '../layouts/PhoneShell'
import { OwnPriceScreen } from './OwnPriceScreen'

const meta = {
  title: 'Screens/OwnPrice',
  component: OwnPriceScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'phone390' },
  },
} satisfies Meta<typeof OwnPriceScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <PhoneShell>
      <OwnPriceScreen />
    </PhoneShell>
  ),
}

export const Wide430: Story = {
  parameters: { viewport: { defaultViewport: 'phone430' } },
  render: () => (
    <PhoneShell width={430} height={932}>
      <OwnPriceScreen />
    </PhoneShell>
  ),
}

export const Compact380: Story = {
  parameters: { viewport: { defaultViewport: 'phone380' } },
  render: () => (
    <PhoneShell width={380} height={720}>
      <OwnPriceScreen />
    </PhoneShell>
  ),
}
