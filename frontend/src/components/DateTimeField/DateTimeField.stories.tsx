import type { Meta, StoryObj } from '@storybook/react'
import { DateTimeField } from './DateTimeField'

const meta = {
  title: 'Components/DateTimeField',
  component: DateTimeField,
  tags: ['autodocs'],
  args: {
    label: 'Закрытие',
    value: '20 сен 2026 · 20:00',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 358 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DateTimeField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Open: Story = {
  args: { open: true },
}
