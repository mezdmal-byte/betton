import type { Meta, StoryObj } from '@storybook/react'
import { StatusMessage } from './StatusMessage'

const meta = {
  title: 'Components/StatusMessage',
  component: StatusMessage,
  tags: ['autodocs'],
  args: {
    title: 'Нет позиций',
    children: 'Исполненные ставки появятся здесь.',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 358 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StatusMessage>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Loading: Story = {
  args: { tone: 'loading', title: 'Загрузка', children: 'Обновляем данные.' },
}

export const Error: Story = {
  args: { tone: 'error', title: 'Не удалось загрузить', children: 'Проверьте соединение и попробуйте снова.' },
}

export const Warning: Story = {
  args: {
    tone: 'warning',
    title: 'Коэффициент изменился',
    children: 'Обновите предложение, чтобы поставить.',
  },
}
