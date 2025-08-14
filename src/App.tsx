import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/auth/ProtectedRoute'
import './App.css'

const Login = lazy(() => import('@/pages/Login'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Chat = lazy(() => import('@/pages/Chat'))
const Protocols = lazy(() => import('@/pages/Protocols'))
const Settings = lazy(() => import('@/pages/Settings'))
const Profile = lazy(() => import('@/pages/Profile'))
const Conversations = lazy(() => import('@/pages/Conversations'))
const Help = lazy(() => import('@/pages/Help'))
const About = lazy(() => import('@/pages/About'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const Terms = lazy(() => import('@/pages/Terms'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function App() {
  return (
    <AuthProvider>
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
                element={<Navigate to="/dashboard" replace />} 
              />
              <Route 
                path="/login" 
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                } 
              />
              
              {/* Authenticated Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/chat" 
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/chat/:conversationId" 
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/protocols" 
                element={
                  <ProtectedRoute>
                    <Protocols />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/conversations" 
                element={
                  <ProtectedRoute>
                    <Conversations />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
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
    </AuthProvider>
  )
}

export default App