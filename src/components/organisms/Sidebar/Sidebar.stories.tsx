import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Sidebar } from './Sidebar'
import type { SidebarSection } from './Sidebar'

const IconHome = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const IconFolder = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
)

const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
)

const IconCreditCard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)

const sampleSections: SidebarSection[] = [
  {
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <IconHome />, active: true },
      { id: 'projects', label: 'Projects', icon: <IconFolder /> },
      { id: 'team', label: 'Team', icon: <IconUsers /> },
    ],
  },
]

const multiSections: SidebarSection[] = [
  {
    title: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <IconHome />, active: true },
      { id: 'projects', label: 'Projects', icon: <IconFolder /> },
      { id: 'team', label: 'Team', icon: <IconUsers /> },
    ],
  },
  {
    title: 'Account',
    items: [
      { id: 'settings', label: 'Settings', icon: <IconSettings /> },
      { id: 'billing', label: 'Billing', icon: <IconCreditCard /> },
    ],
  },
]

const meta: Meta<typeof Sidebar> = {
  title: 'Organisms/Sidebar',
  component: Sidebar,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    onItemClick: { action: 'itemClicked' },
    onToggleCollapse: { action: 'toggleCollapse' },
  },
}

export default meta
type Story = StoryObj<typeof Sidebar>

export const Default: Story = {
  args: {
    sections: sampleSections,
    title: 'Navigation',
    collapsed: false,
  },
}

export const Collapsed: Story = {
  args: {
    sections: sampleSections,
    title: 'Navigation',
    collapsed: true,
  },
}

export const Interactive: Story = {
  args: {
    sections: sampleSections,
    title: 'Navigation',
  },
  render: (args) => {
    const [collapsed, setCollapsed] = React.useState(false)
    return (
      <Sidebar
        {...args}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
    )
  },
}

export const WithSections: Story = {
  args: {
    sections: multiSections,
    title: 'App',
    collapsed: false,
  },
}
