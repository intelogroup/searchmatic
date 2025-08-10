import { useEffect, useState, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import './App.css'

const Login = lazy(() => import('@/pages/Login'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Chat = lazy(() => import('@/pages/Chat'))
const Settings = lazy(() => import('@/pages/Settings'))
const Profile = lazy(() => import('@/pages/Profile'))
const Conversations = lazy(() => import('@/pages/Conversations'))
const Help = lazy(() => import('@/pages/Help'))
const About = lazy(() => import('@/pages/About'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const Terms = lazy(() => import('@/pages/Terms'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <Router>
      <div className="h-screen bg-gray-50">
        <Suspense fallback={
          <div className="h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-pulse text-gray-500">Loading...</div>
          </div>
        }>
          <Routes>
            <Route 
              path="/" 
              element={session ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/login" 
              element={session ? <Navigate to="/dashboard" replace /> : <Login />} 
            />
            
            {/* Authenticated Routes */}
            <Route 
              path="/dashboard" 
              element={session ? <Dashboard /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/chat" 
              element={session ? <Chat /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/chat/:conversationId" 
              element={session ? <Chat /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/conversations" 
              element={session ? <Conversations /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/settings" 
              element={session ? <Settings /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/profile" 
              element={session ? <Profile /> : <Navigate to="/login" replace />} 
            />
            
            {/* Public Routes */}
            <Route path="/help" element={<Help />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  )
}

export default App