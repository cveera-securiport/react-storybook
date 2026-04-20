import React from 'react'
import styles from './Badge.module.css'

export interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
  children: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  dot = false,
  children,
}) => {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${styles[size]}`}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  )
}
