import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookOpen, Search, Filter, BarChart3 } from 'lucide-react'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        })
        if (error) throw error
        setMessage('Check your email to confirm your account!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setMessage(errorMessage)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left side - Branding and Features */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="max-w-md mx-auto text-white">
          <div className="flex items-center mb-8">
            <BookOpen className="h-10 w-10 mr-3" />
            <h1 className="text-3xl font-bold">Searchmatic</h1>
          </div>
          
          <h2 className="text-xl font-semibold mb-6">
            AI-Powered Systematic Literature Reviews
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <Search className="h-6 w-6 mt-1 mr-4 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Smart Literature Search</h3>
                <p className="text-blue-100 text-sm">
                  AI-powered search across multiple academic databases with PICO framework support
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Filter className="h-6 w-6 mt-1 mr-4 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Intelligent Screening</h3>
                <p className="text-blue-100 text-sm">
                  Automated article screening with AI assistance and customizable criteria
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <BarChart3 className="h-6 w-6 mt-1 mr-4 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Data Analysis</h3>
                <p className="text-blue-100 text-sm">
                  Comprehensive data extraction and analysis tools for evidence synthesis
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Searchmatic</h1>
            </div>
            <p className="text-gray-600">AI-Powered Systematic Literature Reviews</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="text-gray-600 mt-1 text-sm">
                {isSignUp 
                  ? 'Start your systematic literature review journey' 
                  : 'Continue your research projects'}
              </p>
            </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required={isSignUp}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {message && (
              <div className={`text-sm p-3 rounded ${
                message.includes('error') || message.includes('Error') 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <p className="font-semibold text-blue-800 mb-2 flex items-center">
              <BookOpen className="h-4 w-4 mr-1" />
              Demo Account
            </p>
            <div className="space-y-1">
              <p className="text-blue-700"><span className="font-medium">Email:</span> test@example.com</p>
              <p className="text-blue-700"><span className="font-medium">Password:</span> password123</p>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Try our platform with pre-loaded research projects and sample data
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}