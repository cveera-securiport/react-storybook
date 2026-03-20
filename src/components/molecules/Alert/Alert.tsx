import React, { useState } from 'react'
import styles from './Alert.module.css'

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  message: string
  dismissible?: boolean
  onDismiss?: () => void
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  message,
  dismissible = false,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  const iconMap = {
    info: 'ℹ',
    success: '✓',
    warning: '⚠',
    error: '✕',
  }

  const handleDismiss = () => {
    setVisible(false)
    onDismiss?.()
  }

  return (
    <div className={`${styles.alert} ${styles[variant]}`} role="alert">
      <span className={styles.icon}>{iconMap[variant]}</span>
      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.message}>{message}</div>
      </div>
      {dismissible && (
        <button
          className={styles.close}
          onClick={handleDismiss}
          aria-label="Dismiss alert"
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  )
}
