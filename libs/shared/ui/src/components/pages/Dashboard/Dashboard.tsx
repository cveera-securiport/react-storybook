import React, { useState } from 'react'
import styles from './Dashboard.module.css'
import { Navbar } from '../../organisms/Navbar/Navbar'
import { Sidebar } from '../../organisms/Sidebar/Sidebar'
import { Card } from '../../molecules/Card/Card'
import { DataTable } from '../../organisms/DataTable/DataTable'
import { Badge } from '../../atoms/Badge/Badge'
import { SearchBar } from '../../molecules/SearchBar/SearchBar'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  [key: string]: unknown
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', active: true },
  { label: 'Projects', href: '/projects' },
  { label: 'Team', href: '/team' },
  { label: 'Settings', href: '/settings' },
]

const sidebarSections = [
  {
    title: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', active: true },
      { id: 'analytics', label: 'Analytics' },
      { id: 'projects', label: 'Projects' },
      { id: 'tasks', label: 'Tasks' },
    ],
  },
  {
    title: 'Account',
    items: [
      { id: 'settings', label: 'Settings' },
      { id: 'billing', label: 'Billing' },
    ],
  },
]

const stats = [
  { title: 'Total Users', value: '12,847', variant: 'primary' as const },
  { title: 'Revenue', value: '$48,290', variant: 'success' as const },
  { title: 'Active Projects', value: '38', variant: 'warning' as const },
  { title: 'Open Issues', value: '7', variant: 'danger' as const },
]

const recentUsers: User[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'Active' },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'Editor', status: 'Active' },
  { id: '3', name: 'Carol White', email: 'carol@example.com', role: 'Viewer', status: 'Inactive' },
  { id: '4', name: 'Dan Brown', email: 'dan@example.com', role: 'Editor', status: 'Active' },
  { id: '5', name: 'Eve Davis', email: 'eve@example.com', role: 'Admin', status: 'Active' },
]

const columns = [
  { key: 'name' as const, label: 'Name', sortable: true },
  { key: 'email' as const, label: 'Email', sortable: true },
  { key: 'role' as const, label: 'Role', sortable: true },
  {
    key: 'status' as const,
    label: 'Status',
    sortable: false,
    render: (value: unknown) => (
      <Badge variant={value === 'Active' ? 'success' : 'neutral'} size="sm" dot>
        {String(value)}
      </Badge>
    ),
  },
]

export interface DashboardProps {
  onNavigate?: (href: string) => void
  /** For Storybook / demos: start with the sidebar collapsed. */
  initialSidebarCollapsed?: boolean
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  initialSidebarCollapsed = false,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialSidebarCollapsed)

  return (
    <div className={styles.page}>
      <Navbar
        brandName="Design System"
        items={navItems}
        avatarSrc="https://i.pravatar.cc/150?img=3"
        onNavigate={onNavigate}
      />
      <div className={styles.layout}>
        <Sidebar
          sections={sidebarSections}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className={styles.main}>
          <div className={styles.content}>
            <div className={styles.header}>
              <h1 className={styles.headerTitle}>Dashboard</h1>
              <div className={styles.headerActions}>
                <SearchBar placeholder="Search..." />
              </div>
            </div>

            <div className={styles.statsGrid}>
              {stats.map((stat) => (
                <Card key={stat.title} variant="stat" title={stat.title} statValue={stat.value} />
              ))}
            </div>

            <div className={styles.tableSection}>
              <div className={styles.tableSectionHeader}>
                <h2 className={styles.tableSectionTitle}>Recent Users</h2>
                <Badge variant="neutral" size="sm">
                  {recentUsers.length} total
                </Badge>
              </div>
              <DataTable columns={columns} data={recentUsers} selectable pageSize={5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
