import type { Meta, StoryObj } from '@storybook/react'
import { PhoneShell } from '../layouts/PhoneShell'
import { OnboardingScreen } from './OnboardingScreen'

const meta = {
  title: 'Screens/Onboarding',
  component: OnboardingScreen,
  parameters: { layout: 'fullscreen', viewport: { defaultViewport: 'phone390' } },
} satisfies Meta<typeof OnboardingScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <PhoneShell><OnboardingScreen onContinue={() => undefined} /></PhoneShell>,
}
