import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  default: 'h-8 w-8',
  lg: 'h-12 w-12'
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'default', 
  className 
}) => {
  return (
    <Loader2 
      className={cn(
        'animate-spin text-primary', 
        sizeClasses[size], 
        className
      )} 
    />
  )
}

interface LoadingPageProps {
  message?: string
  className?: string
}

export const LoadingPage: React.FC<LoadingPageProps> = ({ 
  message = 'Loading...', 
  className 
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center h-screen space-y-4", 
      className
    )}>
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  )
}

interface LoadingCardProps {
  message?: string
  className?: string
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ 
  message = 'Loading...', 
  className 
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 space-y-4", 
      className
    )}>
      <LoadingSpinner />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  )
}