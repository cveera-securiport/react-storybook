import type { Meta, StoryObj } from '@storybook/react'
import { within, userEvent, expect } from '@storybook/test'
import { LoginPage } from './LoginPage'

const meta: Meta<typeof LoginPage> = {
  title: 'Pages/LoginPage',
  component: LoginPage,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    onLogin: { action: 'login' },
    onForgotPassword: { action: 'forgotPassword' },
    onSignUp: { action: 'signUp' },
  },
}

export default meta
type Story = StoryObj<typeof LoginPage>

export const Default: Story = {}

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}

export const Loading: Story = {
  args: {
    loading: true,
  },
}

export const LoginFlow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const emailInput = canvas.getByLabelText(/email/i)
    await userEvent.type(emailInput, 'alice@example.com', { delay: 50 })
    const passwordInput = canvas.getByLabelText(/password/i)
    await userEvent.type(passwordInput, 'password123', { delay: 50 })
    const signInButton = canvas.getByRole('button', { name: /sign in/i })
    await userEvent.click(signInButton)
  },
}

export const ValidationErrors: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const signInButton = canvas.getByRole('button', { name: /sign in/i })
    await userEvent.click(signInButton)
    expect(await canvas.findByText('Email is required')).toBeInTheDocument()
    expect(canvas.getByText('Password is required')).toBeInTheDocument()
  },
}
