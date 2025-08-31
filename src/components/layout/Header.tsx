import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Settings, Menu, X } from 'lucide-react'
import { logInfo, logError } from '@/lib/error-logger'

export const Header: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut, user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
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
            <Link 
              to="/dashboard" 
              className={`transition-colors ${
                location.pathname === '/dashboard' 
                  ? 'text-foreground font-medium' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/projects" 
              className={`transition-colors ${
                location.pathname.startsWith('/projects') 
                  ? 'text-foreground font-medium' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Projects
            </Link>
            <Link 
              to="/protocols" 
              className={`transition-colors ${
                location.pathname === '/protocols' 
                  ? 'text-foreground font-medium' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Protocols
            </Link>
            <Link 
              to="/workflows" 
              className={`transition-colors ${
                location.pathname === '/workflows' 
                  ? 'text-foreground font-medium' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Workflows
            </Link>
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
          <Button variant="outline" size="sm" onClick={handleSignOut} className="hidden md:flex">
            Sign Out
          </Button>
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container px-4 py-4">
            <nav className="flex flex-col space-y-3">
              <Link 
                to="/dashboard" 
                className={`text-sm transition-colors ${
                  location.pathname === '/dashboard' 
                    ? 'text-foreground font-medium' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                to="/projects" 
                className={`text-sm transition-colors ${
                  location.pathname.startsWith('/projects') 
                    ? 'text-foreground font-medium' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Projects
              </Link>
              <Link 
                to="/protocols" 
                className={`text-sm transition-colors ${
                  location.pathname === '/protocols' 
                    ? 'text-foreground font-medium' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Protocols
              </Link>
              <Link 
                to="/workflows" 
                className={`text-sm transition-colors ${
                  location.pathname === '/workflows' 
                    ? 'text-foreground font-medium' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Workflows
              </Link>
              
              <div className="border-t border-border pt-3 mt-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    navigate('/settings')
                    setMobileMenuOpen(false)
                  }}
                  className="w-full justify-start"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="w-full justify-start mt-2"
                >
                  Sign Out
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}