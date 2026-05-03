import type { Preview } from '@storybook/react-vite'
import { AppThemeProvider } from '@csv/mui-theme'
import '@csv/tokens/tokens/design-tokens.css'
import '../apps/shell/src/index.css'
import theme from './theme'

const preview: Preview = {
  decorators: [
    (Story) => (
      <AppThemeProvider>
        <Story />
      </AppThemeProvider>
    ),
  ],
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
