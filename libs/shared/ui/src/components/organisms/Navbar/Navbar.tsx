import React, { useState } from 'react'
import styles from './Navbar.module.css'
import { Avatar } from '../../atoms/Avatar/Avatar'

export interface NavItem {
  label: string
  href: string
  active?: boolean
}

export interface NavbarProps {
  brandName?: string
  items?: NavItem[]
  avatarSrc?: string
  avatarInitials?: string
  onNavigate?: (href: string) => void
}

export const Navbar: React.FC<NavbarProps> = ({
  brandName = 'Design System',
  items = [],
  avatarSrc,
  avatarInitials = 'DS',
  onNavigate,
}) => {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className={`${styles.navbar} ${menuOpen ? styles.open : ''}`}>
      <div className={styles.brand}>
        <span className={styles.logo}>{brandName}</span>
      </div>

      <div className={styles.nav}>
        {items.map((item) => (
          <button
            key={item.href}
            className={`${styles.navLink} ${item.active ? styles.active : ''}`}
            onClick={() => onNavigate?.(item.href)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={styles.actions}>
        <Avatar src={avatarSrc} initials={avatarInitials} size="sm" status="online" />
        <button
          className={styles.menuButton}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          type="button"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </nav>
  )
}
