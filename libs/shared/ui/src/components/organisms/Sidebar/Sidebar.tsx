import React from 'react'
import styles from './Sidebar.module.css'

export interface SidebarItem {
  id: string
  label: string
  icon?: React.ReactNode
  active?: boolean
}

export interface SidebarSection {
  title?: string
  items: SidebarItem[]
}

export interface SidebarProps {
  sections: SidebarSection[]
  collapsed?: boolean
  onToggleCollapse?: () => void
  onItemClick?: (id: string) => void
  title?: string
}

// Simple SVG icons for demo
const ChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
)

const ChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
)

export const Sidebar: React.FC<SidebarProps> = ({
  sections,
  collapsed = false,
  onToggleCollapse,
  onItemClick,
  title = 'Navigation',
}) => {
  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <button
          className={styles.collapseBtn}
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          type="button"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

      <div className={styles.menu}>
        {sections.map((section, sIdx) => (
          <div key={sIdx} className={section.title ? styles.section : undefined}>
            {section.title && (
              <div className={styles.sectionTitle}>{section.title}</div>
            )}
            {section.items.map((item) => (
              <button
                key={item.id}
                className={`${styles.menuItem} ${item.active ? styles.active : ''}`}
                onClick={() => onItemClick?.(item.id)}
                title={collapsed ? item.label : undefined}
                type="button"
              >
                {item.icon && <span className={styles.menuIcon}>{item.icon}</span>}
                <span className={styles.menuLabel}>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </aside>
  )
}
