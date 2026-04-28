import React, { useState } from 'react'
import MuiAlert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

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

  const handleDismiss = () => {
    setVisible(false)
    onDismiss?.()
  }

  return (
    <MuiAlert
      severity={variant}
      role="alert"
      action={
        dismissible ? (
          <IconButton aria-label="Dismiss alert" size="small" onClick={handleDismiss}>
            <CloseIcon fontSize="inherit" />
          </IconButton>
        ) : undefined
      }
      sx={{ width: '100%' }}
    >
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      {message}
    </MuiAlert>
  )
}
