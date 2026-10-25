import type { Meta, StoryObj } from '@storybook/react'
import { marketYesNo } from '../fixtures/markets'
import { PhoneShell } from '../layouts/PhoneShell'
import { MyEventsScreen } from './MyEventsScreen'

const markets = [
  { ...marketYesNo, id: '11', status: 'open' as const },
  { ...marketYesNo, id: '12', question: 'Закроется ли событие до пятницы?', status: 'pending' as const, closeLabel: 'На модерации' },
  { ...marketYesNo, id: '13', question: 'Приватный рынок по ссылке', visibility: 'unlisted', status: 'open' as const },
]
const meta = { title: 'Screens/MyEvents', component: MyEventsScreen, parameters: { layout: 'fullscreen', viewport: { defaultViewport: 'phone390' } } } satisfies Meta<typeof MyEventsScreen>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = { render: () => <PhoneShell><MyEventsScreen markets={markets} /></PhoneShell> }
export const Empty: Story = { render: () => <PhoneShell><MyEventsScreen markets={[]} /></PhoneShell> }
export const Loading: Story = { render: () => <PhoneShell><MyEventsScreen viewState="loading" /></PhoneShell> }
