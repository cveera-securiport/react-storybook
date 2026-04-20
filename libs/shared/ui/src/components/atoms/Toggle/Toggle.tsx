import React from 'react'
import styles from './Toggle.module.css'

export interface ToggleProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export const Toggle: React.FC<ToggleProps> = ({
  checked = false,
  onChange,
  disabled = false,
  label,
  size = 'md',
}) => {
  return (
    <div className={styles.wrapper}>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label || 'Toggle'}
        className={`${styles.track} ${styles[size]} ${checked ? styles.checked : ''}`}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        type="button"
      >
        <span className={styles.thumb} />
      </button>
      {label && <span className={styles.label}>{label}</span>}
    </div>
  )
}
