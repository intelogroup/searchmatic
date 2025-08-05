import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { ProjectProvider } from '@/contexts/ProjectContext'
import { Landing } from '@/pages/Landing'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { NewProject } from '@/pages/NewProject'
import { ProjectView } from '@/pages/ProjectView'
import { Settings } from '@/pages/Settings'
import { NotFound } from '@/pages/NotFound'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ProjectProvider>
          <Routes>
            <Route 
              path="/" 
              element={<Landing />} 
            />
            <Route 
              path="/login" 
              element={session ? <Navigate to="/dashboard" replace /> : <Login />} 
            />
            <Route 
              path="/dashboard" 
              element={session ? <Dashboard /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/projects/new" 
              element={session ? <NewProject /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/projects/:projectId" 
              element={session ? <ProjectView /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/settings" 
              element={session ? <Settings /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="*" 
              element={<NotFound />} 
            />
          </Routes>
        </ProjectProvider>
      </Router>
    </QueryClientProvider>
  )
}

export default App