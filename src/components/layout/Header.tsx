import React from 'react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export const Header: React.FC = () => {
  const navigate = useNavigate()
  
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
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
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}