import type { Meta, StoryObj } from '@storybook/react'
import { within, userEvent, expect } from '@storybook/test'
import { Alert } from './Alert'

const meta: Meta<typeof Alert> = {
  title: 'Molecules/Alert',
  component: Alert,
  argTypes: {
    variant: { control: 'select', options: ['info', 'success', 'warning', 'error'] },
    onDismiss: { action: 'dismissed' },
  },
}

export default meta
type Story = StoryObj<typeof Alert>

export const Default: Story = {
  args: {
    message: 'This is an informational alert.',
  },
}

export const Success: Story = {
  args: {
    variant: 'success',
    message: 'Your changes were saved successfully.',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    message: 'This action may have unintended side effects.',
  },
}

export const Error: Story = {
  args: {
    variant: 'error',
    message: 'Something went wrong. Please try again.',
  },
}

export const WithTitle: Story = {
  args: {
    variant: 'info',
    title: 'Update available',
    message: 'A new version of the app is ready to install.',
  },
}

export const Dismissible: Story = {
  args: {
    variant: 'warning',
    title: 'Heads up',
    message: 'This alert can be dismissed.',
    dismissible: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const dismissButton = canvas.getByRole('button', { name: /dismiss/i })
    await expect(dismissButton).toBeInTheDocument()
    await userEvent.click(dismissButton)
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
  },
}

export const AllVariants: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        width: '100%',
        maxWidth: '32rem',
      }}
    >
      <Alert variant="info" message="Info: neutral context or guidance." />
      <Alert variant="success" message="Success: the operation completed." />
      <Alert variant="warning" message="Warning: review before continuing." />
      <Alert variant="error" message="Error: something needs your attention." />
    </div>
  ),
}
