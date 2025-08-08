import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Eye, EyeOff, Sparkles, CheckCircle2, Shield, Users } from 'lucide-react'
import { errorLogger, logInfo, logSupabaseError, logPerformance } from '@/lib/error-logger'

export const Login: React.FC = () => {
  const { goToDashboard } = useAppNavigation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const startTime = performance.now()
    const operation = isSignUp ? 'signup' : 'signin'
    
    // Log authentication attempt (with privacy protection)
    logInfo(`Authentication attempt: ${operation}`, {
      feature: 'authentication',
      action: operation,
      metadata: {
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email for privacy
        hasPassword: !!password,
        passwordLength: password.length
      }
    })

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        const duration = performance.now() - startTime
        logPerformance(`Supabase signup`, duration)

        if (error) {
          logSupabaseError('signup', error, {
            feature: 'authentication',
            action: 'signup',
            metadata: {
              email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
              errorCode: error.code || 'UNKNOWN',
              errorMessage: error.message
            }
          })
          setError(error.message)
          setIsLoading(false)
        } else {
          logInfo('User signup successful', {
            feature: 'authentication',
            action: 'signup-success',
            metadata: {
              userId: data.user?.id,
              email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
              emailConfirmed: data.user?.email_confirmed_at ? 'yes' : 'no'
            }
          })
          
          // Set user ID for future error logging
          if (data.user?.id) {
            errorLogger.setUserId(data.user.id)
          }
          
          // Show success message for email confirmation
          setSuccess('Please check your email for a confirmation link, then sign in.')
          setIsLoading(false)
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        const duration = performance.now() - startTime
        logPerformance(`Supabase signin`, duration)

        if (error) {
          logSupabaseError('signin', error, {
            feature: 'authentication',
            action: 'signin',
            metadata: {
              email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
              errorCode: error.code || 'UNKNOWN',
              errorMessage: error.message
            }
          })
          setError(error.message)
          setIsLoading(false)
        } else {
          logInfo('User signin successful', {
            feature: 'authentication',
            action: 'signin-success',
            metadata: {
              userId: data.user?.id,
              email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
              sessionId: data.session?.access_token ? 'present' : 'missing'
            }
          })
          
          // Set user ID for future error logging
          if (data.user?.id) {
            errorLogger.setUserId(data.user.id)
          }
          
          logInfo('Navigating to dashboard', {
            feature: 'navigation',
            action: 'redirect-to-dashboard'
          })
          
          goToDashboard()
        }
      }
    } catch (unexpectedError) {
      const duration = performance.now() - startTime
      logPerformance(`Failed ${operation}`, duration)
      
      logSupabaseError(`${operation}-unexpected`, unexpectedError, {
        feature: 'authentication',
        action: `${operation}-unexpected-error`,
        metadata: {
          email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
          errorType: 'unexpected',
          error: String(unexpectedError)
        }
      })
      
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="absolute inset-0 bg-grid-white/10 bg-grid-16 [mask-image:radial-gradient(white,transparent_85%)]" />
      
      {/* Header */}
      <div className="relative z-10 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-4 w-4" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Searchmatic</span>
            </div>
          </Link>
          
          <Badge variant="secondary" className="hidden sm:flex">
            <Shield className="h-3 w-3 mr-1" />
            Enterprise Security
          </Badge>
        </div>
      </div>

      <div className="relative z-10 flex">
        {/* Left Side - Social Proof */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-12">
          <div className="max-w-lg">
            <div className="mb-8">
              <Badge variant="secondary" className="mb-4">
                <Users className="h-3 w-3 mr-1" />
                Trusted by 10,000+ Researchers
              </Badge>
              <h2 className="text-3xl font-bold mb-4">
                Join the future of systematic reviews
              </h2>
              <p className="text-muted-foreground text-lg">
                Accelerate your research with AI-powered literature reviews used by top institutions worldwide.
              </p>
            </div>

            <div className="space-y-4">
              {[
                "Complete systematic reviews 20x faster",
                "AI-assisted protocol generation and validation", 
                "Multi-database search with smart deduplication",
                "Publication-ready exports in multiple formats"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t">
              <p className="text-sm text-muted-foreground mb-3">Trusted by researchers at</p>
              <div className="flex items-center gap-6 opacity-60">
                <div className="font-semibold text-sm">Harvard</div>
                <div className="font-semibold text-sm">Stanford</div>
                <div className="font-semibold text-sm">MIT</div>
                <div className="font-semibold text-sm">Mayo Clinic</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <Card className="w-full max-w-md shadow-xl border-0 bg-background/95 backdrop-blur">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </CardTitle>
              <CardDescription>
                {isSignUp 
                  ? 'Start your free trial - no credit card required'
                  : 'Sign in to your Searchmatic account'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                    placeholder="researcher@university.edu"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 pr-12 border border-input rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                      placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {!isSignUp && (
                    <div className="text-right">
                      <button type="button" className="text-sm text-primary hover:underline">
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                
                {success && (
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full py-3 text-base"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {isSignUp ? 'Creating account...' : 'Signing in...'}
                    </div>
                  ) : (
                    isSignUp ? 'Create account' : 'Sign in'
                  )}
                </Button>

                {isSignUp && (
                  <div className="text-xs text-muted-foreground text-center">
                    By creating an account, you agree to our{' '}
                    <a href="#" className="text-primary hover:underline">Terms of Service</a>{' '}
                    and{' '}
                    <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                  </div>
                )}
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError(null)
                    setSuccess(null)
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"
                  }
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}