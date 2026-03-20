import type { Meta, StoryObj } from '@storybook/react'
import { Dashboard } from './Dashboard'

const meta: Meta<typeof Dashboard> = {
  title: 'Pages/Dashboard',
  component: Dashboard,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    onNavigate: { action: 'navigated' },
  },
}

export default meta
type Story = StoryObj<typeof Dashboard>

export const Default: Story = {}

export const CollapsedSidebar: Story = {
  render: (args) => <Dashboard {...args} initialSidebarCollapsed />,
}

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
}
