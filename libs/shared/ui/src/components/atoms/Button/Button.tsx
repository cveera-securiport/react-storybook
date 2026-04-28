import type React from 'react'
import MuiButton from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  children,
  type = 'button',
  className,
  onClick,
  ...rest
}) => {
  const muiVariant = variant === 'outline' ? 'outlined' : variant === 'ghost' ? 'text' : 'contained'
  const muiColor =
    variant === 'secondary' ? 'secondary' : variant === 'danger' ? 'error' : 'primary'

  return (
    <MuiButton
      type={type as 'button' | 'submit' | 'reset'}
      variant={muiVariant}
      color={muiColor}
      size={size}
      className={className}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading || undefined}
      startIcon={icon}
      {...rest}
    >
      {loading ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={16} color="inherit" />
          <span>{children}</span>
        </Stack>
      ) : (
        children
      )}
    </MuiButton>
  )
}
