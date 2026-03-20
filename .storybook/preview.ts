import type { Preview } from '@storybook/react'
import '../src/tokens/design-tokens.css'
import '../src/index.css'
import theme from './theme'

const preview: Preview = {
  parameters: {
    docs: {
      theme,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default preview
