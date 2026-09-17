import type { Meta, StoryObj } from '@storybook/react'
import { PhoneShell } from '../layouts/PhoneShell'
import { SystemStateScreen } from './SystemStateScreen'

const meta = {
  title: 'Screens/SystemState',
  component: SystemStateScreen,
  parameters: { layout: 'fullscreen', viewport: { defaultViewport: 'phone390' } },
} satisfies Meta<typeof SystemStateScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = { render: () => <PhoneShell><SystemStateScreen kind="loading" /></PhoneShell> }
export const NetworkError: Story = { render: () => <PhoneShell><SystemStateScreen kind="network" onRetry={() => undefined} /></PhoneShell> }
export const Empty: Story = { render: () => <PhoneShell><SystemStateScreen kind="empty" /></PhoneShell> }
