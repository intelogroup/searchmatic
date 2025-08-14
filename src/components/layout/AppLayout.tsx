import React from 'react'
import { Header } from './Header'

interface AppLayoutProps {
  children: React.ReactNode
  showHeader?: boolean
  className?: string
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  showHeader = true,
  className = ''
}) => {
  return (
    <div className={`h-screen bg-gray-50 flex flex-col ${className}`}>
      {showHeader && <Header />}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}

interface PageLayoutProps {
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  className?: string
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  maxWidth = 'full',
  className = ''
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'w-full'
  }

  return (
    <div className={`h-screen bg-gray-50 ${className}`}>
      <div className={`mx-auto ${maxWidthClasses[maxWidth]} h-full`}>
        {children}
      </div>
    </div>
  )
}