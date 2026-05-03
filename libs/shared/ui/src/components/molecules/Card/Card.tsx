import type React from 'react'
import MuiCard from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

export interface CardProps {
  variant?: 'default' | 'stat'
  image?: string
  title: string
  description?: string
  statValue?: string
  footer?: React.ReactNode
  children?: React.ReactNode
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  image,
  title,
  description,
  statValue,
  footer,
  children,
}) => {
  if (variant === 'stat') {
    return (
      <MuiCard>
        <CardContent>
          <Typography variant="h4" component="div">
            {statValue}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </CardContent>
      </MuiCard>
    )
  }

  return (
    <MuiCard>
      {image && <CardMedia component="img" height="180" image={image} alt={title} />}
      <CardContent>
        <Typography variant="h6" component="h3" gutterBottom>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {description}
          </Typography>
        )}
        {children}
      </CardContent>
      {footer ? (
        <CardActions>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>{footer}</Box>
        </CardActions>
      ) : null}
    </MuiCard>
  )
}
