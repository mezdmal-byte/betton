import type { Meta, StoryObj } from '@storybook/react'
import { PhoneShell } from '../../layouts/PhoneShell'
import { FilterSheet } from './FilterSheet'

const meta = {
  title: 'Screens/FilterSheet',
  component: FilterSheet,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'phone390' },
  },
} satisfies Meta<typeof FilterSheet>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  args: {
    open: true,
    status: 'open',
    onClose: () => undefined,
    onApply: () => undefined,
  },
  render: (args) => (
    <PhoneShell>
      <FilterSheet {...args} />
    </PhoneShell>
  ),
}

export const Open320: Story = {
  args: {
    open: true,
    status: 'closed',
    onClose: () => undefined,
    onApply: () => undefined,
  },
  render: (args) => (
    <PhoneShell width={320} height={700}>
      <FilterSheet {...args} />
    </PhoneShell>
  ),
}

export const Open360: Story = {
  args: {
    open: true,
    status: 'all',
    onClose: () => undefined,
    onApply: () => undefined,
  },
  render: (args) => (
    <PhoneShell width={360} height={800}>
      <FilterSheet {...args} />
    </PhoneShell>
  ),
}
