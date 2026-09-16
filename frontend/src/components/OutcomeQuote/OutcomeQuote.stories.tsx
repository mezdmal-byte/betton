import type { Meta, StoryObj } from '@storybook/react'
import { OutcomeQuote } from './OutcomeQuote'

const meta = {
  title: 'Components/OutcomeQuote',
  component: OutcomeQuote,
  tags: ['autodocs'],
  args: {
    label: 'Да',
    odds: 1.82,
    liquidity: 320,
    side: 'a',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 171 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OutcomeQuote>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Selected: Story = {
  args: { state: 'selected' },
}

export const Pressed: Story = {
  args: { state: 'pressed' },
}

export const Disabled: Story = {
  args: { state: 'disabled' },
}

export const Loading: Story = {
  args: { state: 'loading' },
}

export const NoLiquidity: Story = {
  args: { state: 'no-liquidity', odds: null, liquidity: null },
}

export const SideB: Story = {
  args: { label: 'Нет', odds: 2.18, liquidity: 190, side: 'b' },
}

export const Teams: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: 358 }}>
      <OutcomeQuote label="Спартак" odds={1.72} liquidity={540} side="a" />
      <OutcomeQuote label="ЦСКА" odds={2.2} liquidity={380} side="b" />
    </div>
  ),
  decorators: [],
}

export const LongLabels: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: 358 }}>
      <OutcomeQuote label="BTC > $100k" odds={1.61} liquidity={180} side="a" />
      <OutcomeQuote label="BTC ≤ $100k" odds={2.45} liquidity={70} side="b" />
    </div>
  ),
  decorators: [],
}

export const AboveBelow: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: 358 }}>
      <OutcomeQuote label="Выше" odds={1.55} liquidity={210} side="a" />
      <OutcomeQuote label="Ниже" odds={2.8} liquidity={95} side="b" />
    </div>
  ),
  decorators: [],
}

export const Names: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: 358 }}>
      <OutcomeQuote label="Trump" odds={1.45} liquidity={800} side="a" />
      <OutcomeQuote label="Harris" odds={2.9} liquidity={260} side="b" />
    </div>
  ),
  decorators: [],
}
