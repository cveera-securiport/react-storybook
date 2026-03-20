import type { Meta, StoryObj } from '@storybook/react'
import { within, userEvent, expect } from '@storybook/test'
import { DataTable } from './DataTable'

interface User extends Record<string, unknown> {
  id: string
  name: string
  email: string
  role: string
  status: string
}

const sampleUsers: User[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'Active' },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'Editor', status: 'Active' },
  { id: '3', name: 'Carol White', email: 'carol@example.com', role: 'Viewer', status: 'Inactive' },
  { id: '4', name: 'Dan Brown', email: 'dan@example.com', role: 'Editor', status: 'Active' },
  { id: '5', name: 'Eve Davis', email: 'eve@example.com', role: 'Admin', status: 'Active' },
  { id: '6', name: 'Frank Lee', email: 'frank@example.com', role: 'Viewer', status: 'Inactive' },
  { id: '7', name: 'Grace Kim', email: 'grace@example.com', role: 'Editor', status: 'Active' },
  { id: '8', name: 'Hank Miller', email: 'hank@example.com', role: 'Viewer', status: 'Active' },
]

const columns = [
  { key: 'name' as const, label: 'Name', sortable: true },
  { key: 'email' as const, label: 'Email', sortable: true },
  { key: 'role' as const, label: 'Role', sortable: true },
  { key: 'status' as const, label: 'Status', sortable: false },
]

const meta = {
  title: 'Organisms/DataTable',
  component: DataTable,
  parameters: { layout: 'padded' },
  argTypes: {
    onRowSelect: { action: 'rowsSelected' },
  },
} as Meta<typeof DataTable<User>>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    columns,
    data: sampleUsers,
  },
}

export const WithSelection: Story = {
  args: {
    columns,
    data: sampleUsers,
    selectable: true,
  },
}

export const Paginated: Story = {
  args: {
    columns,
    data: sampleUsers,
    pageSize: 3,
  },
}

export const SortInteraction: Story = {
  args: {
    columns,
    data: sampleUsers,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nameHeader = canvas.getByText('Name')
    await userEvent.click(nameHeader)
    expect(nameHeader.textContent).toContain('↑')
  },
}
