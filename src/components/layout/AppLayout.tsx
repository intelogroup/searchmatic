import React from 'react'
import { Header } from './Header'

interface AppLayoutProps {
  children: React.ReactNode
  showHeader?: boolean
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  showHeader = true 
}) => {
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {showHeader && <Header />}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}