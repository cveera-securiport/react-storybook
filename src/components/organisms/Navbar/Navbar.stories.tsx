import type { Meta, StoryObj } from '@storybook/react'
import { Navbar } from './Navbar'

const meta: Meta<typeof Navbar> = {
  title: 'Organisms/Navbar',
  component: Navbar,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    onNavigate: { action: 'navigated' },
  },
  args: {
    brandName: 'Design System',
    items: [
      { label: 'Dashboard', href: '/dashboard', active: true },
      { label: 'Projects', href: '/projects' },
      { label: 'Team', href: '/team' },
      { label: 'Settings', href: '/settings' },
    ],
    avatarSrc: 'https://i.pravatar.cc/150?img=3',
  },
}

export default meta
type Story = StoryObj<typeof Navbar>

export const Default: Story = {}

export const NoAvatar: Story = {
  args: {
    avatarSrc: undefined,
  },
}

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
}

export const Tablet: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
}
