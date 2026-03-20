import React from 'react'
import styles from './Card.module.css'

export interface CardProps {
  variant?: 'default' | 'stat'
  image?: string
  title: string
  description?: string
  statValue?: string
  footer?: React.ReactNode
  children?: React.ReactNode
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  image,
  title,
  description,
  statValue,
  footer,
  children,
}) => {
  if (variant === 'stat') {
    return (
      <div className={`${styles.card} ${styles.stat}`}>
        <div className={styles.body}>
          <div className={styles.statValue}>{statValue}</div>
          <div className={styles.statLabel}>{title}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      {image && <img className={styles.image} src={image} alt={title} />}
      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}
        {children}
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  )
}
