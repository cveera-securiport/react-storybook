import type React from 'react'
import { Avatar as MuiAvatar, Badge, Box } from '@mui/material'

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
  const sizeMap = {
    sm: 28,
    md: 40,
    lg: 56,
    xl: 72,
  } as const

  const statusColor = {
    online: 'success.main',
    offline: 'grey.500',
    busy: 'error.main',
  } as const

  const avatarNode = (
    <MuiAvatar src={src} alt={alt} sx={{ width: sizeMap[size], height: sizeMap[size] }}>
      {!src ? initials || '?' : null}
    </MuiAvatar>
  )

  if (!status) {
    return avatarNode
  }

  return (
    <Badge
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      badgeContent={
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: statusColor[status],
            border: '2px solid var(--color-white)',
          }}
        />
      }
    >
      {avatarNode}
    </Badge>
  )
}
