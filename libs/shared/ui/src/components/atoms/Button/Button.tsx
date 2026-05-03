import type React from 'react'
import Box from '@mui/material/Box'
import MuiButton from '@mui/material/Button'
import type { ButtonProps as MuiButtonProps } from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'color' | 'size'> {
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
  const muiVariant: 'contained' | 'outlined' | 'text' =
    variant === 'outline' ? 'outlined' : variant === 'ghost' ? 'text' : 'contained'
  const muiColor: NonNullable<MuiButtonProps['color']> =
    variant === 'secondary' ? 'secondary' : variant === 'danger' ? 'error' : 'primary'
  const muiSize: 'small' | 'medium' | 'large' =
    size === 'sm' ? 'small' : size === 'lg' ? 'large' : 'medium'

  return (
    <MuiButton
      type={type as 'button' | 'submit' | 'reset'}
      variant={muiVariant}
      color={muiColor}
      size={muiSize}
      className={className}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading || undefined}
      startIcon={icon}
      {...rest}
    >
      {loading ? (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <CircularProgress size={16} color="inherit" />
          <span>{children}</span>
        </Box>
      ) : (
        children
      )}
    </MuiButton>
  )
}
