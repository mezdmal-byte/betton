import type { Meta, StoryObj } from '@storybook/react'
import { PhoneShell } from '../layouts/PhoneShell'
import { HelpScreen } from './HelpScreen'

const meta = { title: 'Screens/Help', component: HelpScreen, parameters: { layout: 'fullscreen', viewport: { defaultViewport: 'phone390' } } } satisfies Meta<typeof HelpScreen>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = { render: () => <PhoneShell><HelpScreen onBack={() => undefined} /></PhoneShell> }
