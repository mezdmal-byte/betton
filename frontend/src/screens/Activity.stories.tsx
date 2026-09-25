import type { Meta, StoryObj } from '@storybook/react'
import { PhoneShell } from '../layouts/PhoneShell'
import { portfolioHistory } from '../fixtures/account'
import { ActivityScreen } from './ActivityScreen'

const meta = {
  title: 'Screens/Activity',
  component: ActivityScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'phone390' },
  },
} satisfies Meta<typeof ActivityScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <PhoneShell>
      <ActivityScreen history={portfolioHistory} />
    </PhoneShell>
  ),
}

export const Empty: Story = {
  render: () => (
    <PhoneShell>
      <ActivityScreen history={[]} />
    </PhoneShell>
  ),
}
