import React from 'react'
import styles from './Input.module.css'

export interface InputProps {
  id?: string
  label?: string
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'number'
  size?: 'sm' | 'md' | 'lg'
  state?: 'default' | 'error' | 'success'
  helperText?: string
  disabled?: boolean
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const Input: React.FC<InputProps> = ({
  id,
  label,
  placeholder,
  type = 'text',
  size = 'md',
  state = 'default',
  helperText,
  disabled = false,
  value,
  onChange,
}) => {
  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={id}
        className={`${styles.input} ${styles[size]} ${state !== 'default' ? styles[state] : ''} ${disabled ? styles.disabled : ''}`}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={onChange}
      />
      {helperText && (
        <span className={`${styles.helperText} ${state !== 'default' ? styles[state + 'Text'] : ''}`}>
          {helperText}
        </span>
      )}
    </div>
  )
}
