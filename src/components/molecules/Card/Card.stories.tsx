import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from '../../atoms/Badge/Badge'
import { Button } from '../../atoms/Button/Button'
import { Card } from './Card'

const narrowDecorator: Meta<typeof Card>['decorators'] = [
  (Story) => (
    <div style={{ maxWidth: 360 }}>
      <Story />
    </div>
  ),
]

const meta: Meta<typeof Card> = {
  title: 'Molecules/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'stat'],
    },
    title: { control: 'text' },
    description: { control: 'text' },
    statValue: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  decorators: narrowDecorator,
  args: {
    title: 'Project roadmap',
    description:
      'Align milestones with stakeholders and keep delivery predictable across teams.',
  },
}

export const WithImage: Story = {
  decorators: narrowDecorator,
  args: {
    title: 'Design systems',
    description: 'Tokens, components, and documentation that scale with your product.',
    image:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=300&fit=crop',
  },
}

export const WithFooter: Story = {
  decorators: narrowDecorator,
  args: {
    title: 'Team plan',
    description: 'Collaboration features for growing organizations.',
    footer: (
      <>
        <Button size="sm" variant="outline">
          View details
        </Button>
        <Badge variant="success">Popular</Badge>
      </>
    ),
  },
}

export const StatCard: Story = {
  decorators: narrowDecorator,
  args: {
    variant: 'stat',
    statValue: '2,847',
    title: 'Active Users',
  },
}

export const ProfileCard: Story = {
  decorators: narrowDecorator,
  args: {
    title: 'Alex Morgan',
    description: 'Product Designer · Design Systems',
    image:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&facepad=2',
    footer: (
      <span
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-neutral-500)',
        }}
      >
        LinkedIn · GitHub · Dribbble
      </span>
    ),
  },
}

export const CardGrid: Story = {
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 720, width: '100%', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 'var(--space-4)',
        alignItems: 'stretch',
      }}
    >
      <Card variant="stat" statValue="2,847" title="Active Users" />
      <Card variant="stat" statValue="94%" title="Satisfaction" />
      <Card variant="stat" statValue="12" title="Integrations" />
    </div>
  ),
}
