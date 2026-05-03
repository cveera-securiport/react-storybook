import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { SearchBar } from './SearchBar'

const meta: Meta<typeof SearchBar> = {
  title: 'Molecules/SearchBar',
  component: SearchBar,
  argTypes: {
    onChange: { action: 'changed' },
    onClear: { action: 'cleared' },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400, width: '100%' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof SearchBar>

function WithValueStory() {
  const [value, setValue] = useState('React')
  return <SearchBar value={value} onChange={setValue} onClear={() => setValue('')} />
}

function EmptyValueStory() {
  const [value, setValue] = useState('')
  return <SearchBar value={value} onChange={setValue} />
}

export const Default: Story = {}

export const WithPlaceholder: Story = {
  args: {
    placeholder: 'Search users...',
  },
}

export const WithValue: Story = {
  render: () => <WithValueStory />,
}

export const Empty: Story = {
  render: () => <EmptyValueStory />,
}
