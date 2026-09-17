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
      <MarketsScreen
        topCreators={[
          { id: 1, displayName: 'Вася', handle: 'vasya', initials: 'ВА', volumeTon: 18200 },
          { id: 2, displayName: 'Ира', handle: 'eaaasy', initials: 'ИР', volumeTon: 14500 },
          { id: 3, displayName: 'TON Boss', handle: 'ton_boss', initials: 'TB', volumeTon: 12000 },
        ]}
      />
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
