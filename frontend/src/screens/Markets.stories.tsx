import type { Meta, StoryObj } from '@storybook/react'
import { PhoneShell } from '../layouts/PhoneShell'
import { marketLongLabels, marketLongQuestion } from '../fixtures/markets'
import { MarketsScreen } from './MarketsScreen'

const meta = {
  title: 'Screens/Markets',
  component: MarketsScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'phone390' },
  },
} satisfies Meta<typeof MarketsScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <PhoneShell>
      <MarketsScreen />
    </PhoneShell>
  ),
}

export const LongContent: Story = {
  render: () => (
    <PhoneShell>
      <MarketsScreen markets={[marketLongQuestion, marketLongLabels]} />
    </PhoneShell>
  ),
}

export const Wide430: Story = {
  parameters: { viewport: { defaultViewport: 'phone430' } },
  render: () => (
    <PhoneShell width={430} height={932}>
      <MarketsScreen />
    </PhoneShell>
  ),
}
