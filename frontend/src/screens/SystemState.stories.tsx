import type { Meta, StoryObj } from '@storybook/react'
import { PhoneShell } from '../layouts/PhoneShell'
import { SystemStateScreen, type SystemStateKind } from './SystemStateScreen'

const meta = {
  title: 'Screens/SystemState',
  component: SystemStateScreen,
  parameters: { layout: 'fullscreen', viewport: { defaultViewport: 'phone390' } },
  args: { kind: 'loading' },
} satisfies Meta<typeof SystemStateScreen>

export default meta
type Story = StoryObj<typeof meta>

const noop = () => undefined

function stateStory(kind: SystemStateKind, withAction = true, withCancel = false): Story {
  return {
    args: {
      kind,
      ...(withAction ? { onRetry: noop } : {}),
      ...(withCancel ? { onCancel: noop } : {}),
    },
    render: (args) => <PhoneShell><SystemStateScreen {...args} /></PhoneShell>,
  }
}

export const Skeleton = stateStory('loading', false)
export const InitialLoading = stateStory('initial-loading', false)
export const Offline = stateStory('offline')
export const Retry = stateStory('retry')
export const AuthRequired = stateStory('auth')
export const AuthExpired = stateStory('auth-expired')
export const NotFound404 = stateStory('not-found')
export const Maintenance = stateStory('maintenance', false)
export const StaleQuote = stateStory('stale', true, true)
export const DestructiveConfirmation = stateStory('destructive', true, true)
export const BottomSheet = stateStory('bottom-sheet', false)
export const Modal = stateStory('modal', false)
export const Empty = stateStory('empty')
export const Processing = stateStory('processing', false)
export const Success = stateStory('success')
export const ToastSuccess = stateStory('toast-success', false)
export const NetworkError = stateStory('network')
export const Forbidden = stateStory('forbidden')
export const MarketNotFound = stateStory('market-not-found')
export const InvalidShareToken = stateStory('invalid-share')
export const UnavailableUnlistedLink = stateStory('unavailable-unlisted')
export const InsufficientBalance = stateStory('insufficient')
export const GenericError = stateStory('error')
export const ToastError = stateStory('toast-error', false)
