import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { SearchField } from './SearchField'

const meta = {
  title: 'Components/SearchField',
  component: SearchField,
  tags: ['autodocs'],
  args: { value: '' },
  decorators: [
    (Story) => (
      <div style={{ width: 358 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchField>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Filled: Story = {
  args: { value: 'Спартак' },
}

export const Interactive: Story = {
  render: function Render() {
    const [value, setValue] = useState('')
    return <SearchField value={value} onChange={setValue} />
  },
}
