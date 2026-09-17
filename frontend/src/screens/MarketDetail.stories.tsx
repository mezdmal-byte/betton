import type { Meta, StoryObj } from '@storybook/react'
import { PhoneShell } from '../layouts/PhoneShell'
import { chartSpartakA, chartSpartakB, marketLongQuestion, marketYesNo, orderBookA, orderBookB } from '../fixtures/markets'
import { MarketDetailScreen } from './MarketDetailScreen'

const emptyDescription = { ...marketYesNo, description: '', resolution: '' }
const closedMarket = { ...marketYesNo, status: 'closed' as const, acceptingBets: false, closeLabel: 'Приём завершён' }
const resolvedMarket = { ...marketYesNo, status: 'resolved' as const, acceptingBets: false, resolvedSide: 'a' as const, closeLabel: 'Завершено' }
const cancelledMarket = { ...marketYesNo, status: 'cancelled' as const, acceptingBets: false, closeLabel: 'Отменено' }

const meta = {
  title: 'Screens/MarketDetail', component: MarketDetailScreen,
  parameters: { layout: 'fullscreen', viewport: { defaultViewport: 'phone390' } },
} satisfies Meta<typeof MarketDetailScreen>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { render: () => <PhoneShell><MarketDetailScreen showMarketDataSwitch tradeHistoryState="ready" chartSeriesA={chartSpartakA} chartSeriesB={chartSpartakB} orderbookA={orderBookA} orderbookB={orderBookB} orderbookState="ready" pane="chart" /></PhoneShell> }
export const EmptyChart: Story = { render: () => <PhoneShell><MarketDetailScreen showMarketDataSwitch tradeHistoryState="empty" chartSeriesA={[]} chartSeriesB={[]} orderbookA={orderBookA} orderbookB={orderBookB} orderbookState="ready" pane="chart" /></PhoneShell> }
export const OrderBook: Story = { render: () => <PhoneShell><MarketDetailScreen showMarketDataSwitch tradeHistoryState="ready" orderbookA={orderBookA} orderbookB={orderBookB} orderbookState="ready" pane="book" /></PhoneShell> }
export const EmptyOrderBook: Story = { render: () => <PhoneShell><MarketDetailScreen showMarketDataSwitch tradeHistoryState="ready" orderbookA={[]} orderbookB={[]} orderbookState="ready" pane="book" /></PhoneShell> }
export const OrderBookLoading: Story = { render: () => <PhoneShell><MarketDetailScreen showMarketDataSwitch tradeHistoryState="ready" orderbookA={[]} orderbookB={[]} orderbookState="loading" pane="book" /></PhoneShell> }
export const OrderBookError: Story = { render: () => <PhoneShell><MarketDetailScreen showMarketDataSwitch tradeHistoryState="ready" orderbookA={[]} orderbookB={[]} orderbookState="error" pane="book" onRetryBook={() => undefined} /></PhoneShell> }
export const ChartError: Story = { render: () => <PhoneShell><MarketDetailScreen showMarketDataSwitch tradeHistoryState="error" chartSeriesA={[]} chartSeriesB={[]} orderbookA={orderBookA} orderbookB={orderBookB} orderbookState="ready" pane="chart" onRetryTrades={() => undefined} onRetryBook={() => undefined} /></PhoneShell> }
export const Loading: Story = { render: () => <PhoneShell><MarketDetailScreen viewState="loading" /></PhoneShell> }
export const NetworkError: Story = { render: () => <PhoneShell><MarketDetailScreen viewState="error" onRetry={() => undefined} /></PhoneShell> }
export const Closed: Story = { render: () => <PhoneShell><MarketDetailScreen market={closedMarket} showMarketDataSwitch tradeHistoryState="ready" pane="chart" /></PhoneShell> }
export const Resolved: Story = { render: () => <PhoneShell><MarketDetailScreen market={resolvedMarket} showMarketDataSwitch tradeHistoryState="ready" pane="chart" /></PhoneShell> }
export const Cancelled: Story = { render: () => <PhoneShell><MarketDetailScreen market={cancelledMarket} showMarketDataSwitch tradeHistoryState="ready" pane="chart" /></PhoneShell> }
export const Admin: Story = { render: () => <PhoneShell><MarketDetailScreen showMarketDataSwitch tradeHistoryState="ready" orderbookA={orderBookA} orderbookB={orderBookB} pane="chart" extra={<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><button type="button" style={{ minHeight: 44 }}>Модерация</button><textarea defaultValue="" style={{ minHeight: 88, width: '100%' }} /><button type="button" style={{ minHeight: 44 }}>Отменить событие</button></div>} /></PhoneShell> }
export const EmptyDescription: Story = { render: () => <PhoneShell><MarketDetailScreen market={emptyDescription} showMarketDataSwitch tradeHistoryState="empty" pane="chart" /></PhoneShell> }
export const SideB: Story = { render: () => <PhoneShell><MarketDetailScreen selectedSide="b" showMarketDataSwitch tradeHistoryState="ready" pane="chart" /></PhoneShell> }
export const LongContent: Story = { render: () => <PhoneShell><MarketDetailScreen market={marketLongQuestion} showMarketDataSwitch tradeHistoryState="ready" pane="chart" /></PhoneShell> }
export const Wide430: Story = { parameters: { viewport: { defaultViewport: 'phone430' } }, render: () => <PhoneShell width={430} height={932}><MarketDetailScreen showMarketDataSwitch tradeHistoryState="ready" pane="chart" /></PhoneShell> }
export const Compact380: Story = { parameters: { viewport: { defaultViewport: 'phone380' } }, render: () => <PhoneShell width={380} height={720}><MarketDetailScreen showMarketDataSwitch tradeHistoryState="ready" chartSeriesA={chartSpartakA} chartSeriesB={chartSpartakB} orderbookA={orderBookA} orderbookB={orderBookB} orderbookState="ready" pane="chart" /></PhoneShell> }
