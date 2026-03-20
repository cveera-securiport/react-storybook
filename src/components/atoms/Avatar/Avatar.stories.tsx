import type { Meta, StoryObj } from '@storybook/react'
import { Avatar } from './Avatar'

const meta: Meta<typeof Avatar> = {
  title: 'Atoms/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    status: {
      control: 'select',
      options: ['online', 'offline', 'busy'],
    },
    src: { control: 'text' },
    alt: { control: 'text' },
    initials: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof Avatar>

export const Default: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=1',
    alt: 'Portrait',
    size: 'md',
  },
}

export const WithInitials: Story = {
  args: {
    initials: 'AB',
    alt: 'User AB',
    size: 'md',
  },
}

export const Sizes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Avatar src="https://i.pravatar.cc/150?img=2" alt="Small" size="sm" />
      <Avatar src="https://i.pravatar.cc/150?img=3" alt="Medium" size="md" />
      <Avatar src="https://i.pravatar.cc/150?img=4" alt="Large" size="lg" />
      <Avatar src="https://i.pravatar.cc/150?img=5" alt="Extra large" size="xl" />
    </div>
  ),
}

export const WithStatus: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-6)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Avatar
        src="https://i.pravatar.cc/150?img=6"
        alt="Online user"
        size="lg"
        status="online"
      />
      <Avatar
        src="https://i.pravatar.cc/150?img=7"
        alt="Offline user"
        size="lg"
        status="offline"
      />
      <Avatar
        src="https://i.pravatar.cc/150?img=8"
        alt="Busy user"
        size="lg"
        status="busy"
      />
    </div>
  ),
}

export const Fallback: Story = {
  args: {
    size: 'md',
  },
}
