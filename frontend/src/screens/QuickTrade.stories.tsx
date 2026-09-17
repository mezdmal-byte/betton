import type { Meta, StoryObj } from '@storybook/react'
import { PhoneShell } from '../layouts/PhoneShell'
import { marketNoLiquidity, marketPartialLiquidity } from '../fixtures/markets'
import { QuickTradeScreen } from './QuickTradeScreen'

const meta = {
  title: 'Screens/QuickTrade', component: QuickTradeScreen,
  parameters: { layout: 'fullscreen', viewport: { defaultViewport: 'phone390' } },
} satisfies Meta<typeof QuickTradeScreen>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { render: () => <PhoneShell><QuickTradeScreen amount={0} /></PhoneShell> }
export const FilledPreview: Story = { render: () => <PhoneShell><QuickTradeScreen amount={100} previewMatchedTon={100} previewRestTon={0} previewPayoutTon={182} previewAverageOdds={1.82} previewWorstOdds={1.82} /></PhoneShell> }
export const NoLiquidity: Story = { render: () => <PhoneShell><QuickTradeScreen market={marketNoLiquidity} state="no-liquidity" amount={100} /></PhoneShell> }
export const Partial: Story = { render: () => <PhoneShell><QuickTradeScreen market={marketPartialLiquidity} state="partial" amount={100} previewMatchedTon={40} previewRestTon={60} previewPayoutTon={64} previewAverageOdds={1.6} previewWorstOdds={1.6} /></PhoneShell> }
export const Processing: Story = { render: () => <PhoneShell><QuickTradeScreen state="processing" amount={100} /></PhoneShell> }
export const StaleQuote: Story = { render: () => <PhoneShell><QuickTradeScreen state="stale-quote" amount={100} /></PhoneShell> }
export const Wide430: Story = { parameters: { viewport: { defaultViewport: 'phone430' } }, render: () => <PhoneShell width={430} height={932}><QuickTradeScreen /></PhoneShell> }
export const Compact380: Story = { parameters: { viewport: { defaultViewport: 'phone380' } }, render: () => <PhoneShell width={380} height={720}><QuickTradeScreen amount={0} /></PhoneShell> }
