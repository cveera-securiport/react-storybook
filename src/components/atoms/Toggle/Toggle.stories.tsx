import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Toggle } from './Toggle'

const meta: Meta<typeof Toggle> = {
  title: 'Atoms/Toggle',
  component: Toggle,
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    onChange: { action: 'toggled' },
  },
}

export default meta
type Story = StoryObj<typeof Toggle>

export const Default: Story = {
  args: {
    checked: false,
  },
}

export const Checked: Story = {
  args: {
    checked: true,
  },
}

export const WithLabel: Story = {
  args: {
    label: 'Dark Mode',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    checked: true,
  },
}

export const Sizes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 'var(--space-4)',
      }}
    >
      <Toggle size="sm" />
      <Toggle size="md" />
      <Toggle size="lg" />
    </div>
  ),
}

export const Interactive: Story = {
  render: () => {
    const [on, setOn] = React.useState(false)
    return <Toggle checked={on} onChange={setOn} label="Interactive" />
  },
}
