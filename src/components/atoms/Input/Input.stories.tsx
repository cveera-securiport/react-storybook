import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './Input'

const meta: Meta<typeof Input> = {
  title: 'Atoms/Input',
  component: Input,
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'password', 'number'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    state: { control: 'select', options: ['default', 'error', 'success'] },
    onChange: { action: 'changed' },
  },
}

export default meta

type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: {
    placeholder: 'Enter text…',
  },
}

export const WithLabel: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    type: 'email',
  },
}

export const States: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        maxWidth: 320,
      }}
    >
      <Input placeholder="Default" helperText="Looks good." />
      <Input state="error" placeholder="Error" helperText="This field is required." />
      <Input state="success" placeholder="Success" helperText="Saved successfully." />
    </div>
  ),
}

export const Password: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: '••••••••',
  },
}

export const Disabled: Story = {
  args: {
    label: 'Disabled',
    placeholder: 'Cannot edit',
    value: 'Read only value',
    disabled: true,
  },
}

export const Sizes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        maxWidth: 320,
      }}
    >
      <Input size="sm" label="Small" placeholder="Small input" />
      <Input size="md" label="Medium" placeholder="Medium input" />
      <Input size="lg" label="Large" placeholder="Large input" />
    </div>
  ),
}
