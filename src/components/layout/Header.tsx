import React from 'react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Settings } from 'lucide-react'
import { logInfo, logError } from '@/lib/error-logger'

export const Header: React.FC = () => {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  
  const handleSignOut = async () => {
    try {
      logInfo('User logout attempt', {
        feature: 'authentication',
        action: 'logout-attempt',
        metadata: { userId: user?.id }
      })

      await signOut()
      
      logInfo('User logout successful', {
        feature: 'authentication',
        action: 'logout-success'
      })
      
      navigate('/login')
    } catch (error) {
      logError('Logout failed', {
        feature: 'authentication',
        action: 'logout-error',
        metadata: { error: String(error) }
      })
      // Still navigate to login even on error
      navigate('/login')
    }
  }

  return (
    <header className="border-b border-border bg-background">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <h1 
            className="text-xl font-semibold cursor-pointer" 
            onClick={() => navigate('/dashboard')}
          >
            Searchmatic
          </h1>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <a 
              href="/dashboard" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </a>
            <a 
              href="/projects" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Projects
            </a>
            <a 
              href="/migrations" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Migrations
            </a>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/settings')}
            className="hidden sm:flex"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}