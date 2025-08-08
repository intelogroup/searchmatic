import { useEffect, useState, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { ProjectProvider } from '@/contexts/ProjectContext'
import { Landing } from '@/pages/Landing'
import { Login } from '@/pages/Login'

// Lazy load authenticated pages to reduce initial bundle size
const Dashboard = lazy(() => import('@/pages/Dashboard').then(module => ({ default: module.Dashboard })))
const NewProject = lazy(() => import('@/pages/NewProject').then(module => ({ default: module.NewProject })))
const ProjectView = lazy(() => import('@/pages/ProjectView').then(module => ({ default: module.ProjectView })))
const Settings = lazy(() => import('@/pages/Settings').then(module => ({ default: module.Settings })))
const Migrations = lazy(() => import('@/pages/Migrations').then(module => ({ default: module.Migrations })))
const NotFound = lazy(() => import('@/pages/NotFound').then(module => ({ default: module.NotFound })))

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
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <p>Loading...</p>
            </div>
          }>
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
                path="/migrations" 
                element={session ? <Migrations /> : <Navigate to="/login" replace />} 
              />
              <Route 
                path="*" 
                element={<NotFound />} 
              />
            </Routes>
          </Suspense>
        </ProjectProvider>
      </Router>
    </QueryClientProvider>
  )
}

export default App