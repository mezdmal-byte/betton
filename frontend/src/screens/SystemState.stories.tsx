import type { Meta, StoryObj } from '@storybook/react'
import { PhoneShell } from '../layouts/PhoneShell'
import { SystemStateScreen } from './SystemStateScreen'

const meta = {
  title: 'Screens/SystemState',
  component: SystemStateScreen,
  parameters: { layout: 'fullscreen', viewport: { defaultViewport: 'phone390' } },
  args: { kind: 'loading' },
} satisfies Meta<typeof SystemStateScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  args: { kind: 'loading' },
  render: (args) => <PhoneShell><SystemStateScreen {...args} /></PhoneShell>,
}

export const NetworkError: Story = {
  args: { kind: 'network', onRetry: () => undefined },
  render: (args) => <PhoneShell><SystemStateScreen {...args} /></PhoneShell>,
}

export const Empty: Story = {
  args: { kind: 'empty' },
  render: (args) => <PhoneShell><SystemStateScreen {...args} /></PhoneShell>,
}
