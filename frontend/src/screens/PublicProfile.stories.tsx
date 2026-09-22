import type { Meta, StoryObj } from '@storybook/react'
import { marketYesNo } from '../fixtures/markets'
import { PhoneShell } from '../layouts/PhoneShell'
import { PublicProfileScreen } from './PublicProfileScreen'

const profile = { displayName: 'Василий', handle: 'vasya', initials: 'ВА', marketsCreated: 18, volumeTon: 18200, fills: 146, participants: 620, activeMarkets: 5, completedMarkets: 13 }
const meta = { title: 'Screens/PublicProfile', component: PublicProfileScreen, parameters: { layout: 'fullscreen', viewport: { defaultViewport: 'phone390' } } } satisfies Meta<typeof PublicProfileScreen>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = { render: () => <PhoneShell><PublicProfileScreen profile={profile} markets={[marketYesNo, { ...marketYesNo, id: '2', question: 'TON преодолеет отметку до пятницы?' }]} /></PhoneShell> }
export const Empty: Story = { render: () => <PhoneShell><PublicProfileScreen profile={profile} markets={[]} /></PhoneShell> }
