import React, { useState, useCallback } from 'react'
import styles from './SearchBar.module.css'

export interface SearchBarProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onClear?: () => void
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value: controlledValue,
  onChange,
  onClear,
}) => {
  const [internalValue, setInternalValue] = useState('')
  const value = controlledValue !== undefined ? controlledValue : internalValue

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      if (controlledValue === undefined) setInternalValue(val)
      onChange?.(val)
    },
    [controlledValue, onChange],
  )

  const handleClear = useCallback(() => {
    if (controlledValue === undefined) setInternalValue('')
    onChange?.('')
    onClear?.()
  }, [controlledValue, onChange, onClear])

  return (
    <div className={styles.wrapper}>
      <svg
        className={styles.icon}
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        className={styles.input}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        aria-label="Search"
      />
      {value && (
        <button
          className={styles.clear}
          onClick={handleClear}
          aria-label="Clear search"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
