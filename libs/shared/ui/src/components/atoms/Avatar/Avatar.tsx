import React from 'react'
import styles from './Avatar.module.css'

export interface AvatarProps {
  src?: string
  alt?: string
  initials?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline' | 'busy'
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  initials,
  size = 'md',
  status,
}) => {
  return (
    <div className={`${styles.avatar} ${styles[size]}`}>
      {src ? (
        <img className={styles.image} src={src} alt={alt} />
      ) : (
        <span className={styles.initials}>{initials || '?'}</span>
      )}
      {status && <span className={`${styles.status} ${styles[status]}`} />}
    </div>
  )
}
