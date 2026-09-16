import type { Preview } from '@storybook/react'
import '../src/styles/tokens.css'
import '../src/styles/reset.css'
import '../src/styles/global.css'

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'canvas',
      values: [
        { name: 'canvas', value: '#F7F8FA' },
        { name: 'surface', value: '#FFFFFF' },
      ],
    },
    viewport: {
      viewports: {
        phone390: {
          name: '390×844',
          styles: { width: '390px', height: '844px' },
        },
        phone430: {
          name: '430×932',
          styles: { width: '430px', height: '932px' },
        },
      },
      defaultViewport: 'phone390',
    },
    options: {
      storySort: {
        order: ['Components', 'Screens'],
      },
    },
  },
}

export default preview
