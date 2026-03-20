import React from 'react'
import styles from './Tooltip.module.css'

export interface TooltipProps {
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  children: React.ReactNode
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  placement = 'top',
  children,
}) => {
  return (
    <div className={styles.wrapper}>
      {children}
      <div className={`${styles.tooltip} ${styles[placement]}`} role="tooltip">
        {content}
      </div>
    </div>
  )
}
