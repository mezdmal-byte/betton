import type { Meta, StoryObj } from '@storybook/react'
import { marketYesNo } from '../fixtures/markets'
import { PhoneShell } from '../layouts/PhoneShell'
import { ModerationScreen } from './ModerationScreen'

const pending = [
  { ...marketYesNo, id: '101', status: 'pending' as const, question: 'Спартак обыграет Зенит в ответном матче?' },
  { ...marketYesNo, id: '102', status: 'pending' as const, question: 'TON превысит заданную отметку до пятницы?' },
]
const meta = { title: 'Screens/Moderation', component: ModerationScreen, parameters: { layout: 'fullscreen', viewport: { defaultViewport: 'phone390' } } } satisfies Meta<typeof ModerationScreen>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = { render: () => <PhoneShell><ModerationScreen markets={pending} reasonById={{ 101: '' }} /></PhoneShell> }
export const Empty: Story = { render: () => <PhoneShell><ModerationScreen markets={[]} /></PhoneShell> }
export const NoAccess: Story = { render: () => <PhoneShell><ModerationScreen viewState="no-access" /></PhoneShell> }
