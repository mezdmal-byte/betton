import type { Meta, StoryObj } from '@storybook/react'
import { PhoneShell } from '../layouts/PhoneShell'
import { AuthExpiredScreen } from './AuthExpiredScreen'

const meta = {
  title: 'Screens/AuthExpired',
  component: AuthExpiredScreen,
  parameters: { layout: 'fullscreen', viewport: { defaultViewport: 'phone390' } },
} satisfies Meta<typeof AuthExpiredScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <PhoneShell><AuthExpiredScreen onClose={() => undefined} /></PhoneShell>,
}
