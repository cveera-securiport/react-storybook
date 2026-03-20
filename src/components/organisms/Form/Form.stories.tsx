import type { Meta, StoryObj } from '@storybook/react'
import { within, userEvent, expect } from '@storybook/test'
import { Form } from './Form'

const meta: Meta<typeof Form> = {
  title: 'Organisms/Form',
  component: Form,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onSubmit: { action: 'submitted' },
    onCancel: { action: 'cancelled' },
  },
}

export default meta
type Story = StoryObj<typeof Form>

export const Default: Story = {
  args: {
    title: 'Contact us',
    description: "We'll get back to you within one business day.",
    fields: [
      { name: 'name', label: 'Name', placeholder: 'Jane Doe' },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
      { name: 'message', label: 'Message', placeholder: 'How can we help?' },
    ],
    submitLabel: 'Send message',
  },
}

export const Registration: Story = {
  args: {
    title: 'Create account',
    description: 'Enter your details to register.',
    fields: [
      { name: 'firstName', label: 'First name', placeholder: 'Jane', half: true, required: true },
      { name: 'lastName', label: 'Last name', placeholder: 'Doe', half: true, required: true },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', required: true },
      { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••', required: true },
    ],
    submitLabel: 'Create account',
  },
}

export const WithValidation: Story = {
  args: {
    ...Registration.args,
    submitLabel: 'Submit',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const submitButton = canvas.getByRole('button', { name: /submit/i })
    await userEvent.click(submitButton)
    await expect(canvas.getByText(/first name is required/i)).toBeInTheDocument()
    await expect(canvas.getByText(/last name is required/i)).toBeInTheDocument()
    await expect(canvas.getByText(/email is required/i)).toBeInTheDocument()
    await expect(canvas.getByText(/password is required/i)).toBeInTheDocument()
  },
}

export const FilledForm: Story = {
  args: {
    ...Registration.args,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nameInput = canvas.getByLabelText(/first name/i)
    await userEvent.type(nameInput, 'John')
    const lastInput = canvas.getByLabelText(/last name/i)
    await userEvent.type(lastInput, 'Doe')
    const emailInput = canvas.getByLabelText(/email/i)
    await userEvent.type(emailInput, 'john@example.com')
    const passInput = canvas.getByLabelText(/password/i)
    await userEvent.type(passInput, 'secret123')
    const submitButton = canvas.getByRole('button', { name: /create account/i })
    await userEvent.click(submitButton)
  },
}
