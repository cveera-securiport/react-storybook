import { fn } from 'storybook/test';
import { Input } from './Input';

export default {
  title: 'Example/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: { onChange: fn() },
};

export const Default = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    type: 'email',
  },
};

export const WithHint = {
  args: {
    label: 'Password',
    placeholder: 'Enter your password',
    type: 'password',
    hint: 'Must be at least 8 characters long.',
  },
};

export const WithError = {
  args: {
    label: 'Username',
    placeholder: 'Enter a username',
    value: 'bad user!',
    hint: 'Username may only contain letters, numbers, and underscores.',
    error: true,
  },
};

export const Disabled = {
  args: {
    label: 'Read-only field',
    value: 'Cannot be changed',
    disabled: true,
  },
};

export const NoLabel = {
  args: {
    placeholder: 'Search…',
    type: 'search',
  },
};
