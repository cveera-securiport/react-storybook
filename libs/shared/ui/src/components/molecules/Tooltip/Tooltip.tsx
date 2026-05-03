import type React from 'react'
import MuiTooltip from '@mui/material/Tooltip'

export interface TooltipProps {
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  children: React.ReactNode
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  placement = 'top',
  children,
}) => {
  const placementMap = {
    top: 'top',
    bottom: 'bottom',
    left: 'left',
    right: 'right',
  } as const

  return (
    <MuiTooltip title={content} placement={placementMap[placement]} arrow>
      <span>{children}</span>
    </MuiTooltip>
  )
}
