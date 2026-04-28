import type React from 'react'
import TextField from '@mui/material/TextField'

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
  const color = state === 'success' ? 'success' : state === 'error' ? 'error' : 'primary'
  const resolvedSize = size === 'lg' ? 'medium' : size === 'sm' ? 'small' : 'medium'

  return (
    <TextField
      id={id}
      label={label}
      placeholder={placeholder}
      type={type}
      size={resolvedSize}
      color={color}
      error={state === 'error'}
      helperText={helperText}
      disabled={disabled}
      value={value}
      onChange={onChange}
      fullWidth
      sx={{
        '& .MuiInputBase-root': {
          ...(size === 'lg' ? { minHeight: '3rem', fontSize: 'var(--text-lg)' } : {}),
        },
      }}
      InputLabelProps={{
        htmlFor: id,
      }}
      inputProps={{
        id,
      }}
      FormHelperTextProps={{
        sx: state === 'success' ? { color: 'var(--color-success-600)' } : undefined,
      }}
    />
  )
}
