import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Login } from '@/pages/Login'
import { supabase } from '@/lib/supabase'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    }
  }
}))

// Mock error logger
vi.mock('@/lib/error-logger', () => ({
  logInfo: vi.fn(),
  logSupabaseError: vi.fn(),
  logPerformance: vi.fn(),
  errorLogger: {
    setUserId: vi.fn()
  }
}))

// Mock react-router navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  )
}

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Login Component', () => {
    it('should render login form by default', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should switch to signup mode when toggle clicked', async () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      const toggleButton = screen.getByText(/don't have an account\? sign up/i)
      fireEvent.click(toggleButton)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
      })
    })

    it('should handle successful login', async () => {
      const mockSignIn = vi.mocked(supabase.auth.signInWithPassword)
      mockSignIn.mockResolvedValueOnce({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: { access_token: 'token-123' }
        } as unknown,
        error: null
      })

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        })
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should handle login error', async () => {
      const mockSignIn = vi.mocked(supabase.auth.signInWithPassword)
      const error = new Error('Invalid credentials')
      mockSignIn.mockResolvedValueOnce({
        data: { user: null, session: null },
        error
      } as unknown)

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })
    })

    it('should handle successful signup', async () => {
      const mockSignUp = vi.mocked(supabase.auth.signUp)
      mockSignUp.mockResolvedValueOnce({
        data: {
          user: { id: 'user-123', email: 'test@example.com', email_confirmed_at: null },
          session: null
        } as unknown,
        error: null
      })

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      // Switch to signup mode
      const toggleButton = screen.getByText(/don't have an account\? sign up/i)
      fireEvent.click(toggleButton)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
      })

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'password123'
        })
        expect(screen.getByText(/please check your email for a confirmation link/i)).toBeInTheDocument()
      })
    })

    it('should handle signup error', async () => {
      const mockSignUp = vi.mocked(supabase.auth.signUp)
      const error = new Error('Password should be at least 6 characters')
      mockSignUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error
      } as unknown)

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      // Switch to signup mode
      const toggleButton = screen.getByText(/don't have an account\? sign up/i)
      fireEvent.click(toggleButton)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
      })

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } })
      fireEvent.change(passwordInput, { target: { value: '123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Password should be at least 6 characters')).toBeInTheDocument()
      })
    })

    it('should show loading state during authentication', async () => {
      const mockSignIn = vi.mocked(supabase.auth.signInWithPassword)
      
      // Create a promise that we can control
      let resolvePromise: (value: unknown) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      mockSignIn.mockReturnValueOnce(promise as unknown)

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      // Check loading state
      expect(screen.getByText(/signing in\.\.\./i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()

      // Resolve the promise to complete the test
      resolvePromise!({
        data: { user: { id: 'user-123' }, session: { access_token: 'token' } },
        error: null
      })
    })

    it('should toggle password visibility', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement
      const toggleButton = screen.getByRole('button', { name: '' }) // Eye icon button

      expect(passwordInput.type).toBe('password')

      fireEvent.click(toggleButton)
      expect(passwordInput.type).toBe('text')

      fireEvent.click(toggleButton)
      expect(passwordInput.type).toBe('password')
    })
  })

  describe('Authentication State Management', () => {
    it('should clear error when switching between login and signup', async () => {
      const mockSignIn = vi.mocked(supabase.auth.signInWithPassword)
      mockSignIn.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error('Invalid credentials')
      } as unknown)

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })

      // Switch to signup mode
      const toggleButton = screen.getByText(/don't have an account\? sign up/i)
      fireEvent.click(toggleButton)

      await waitFor(() => {
        expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument()
      })
    })
  })
})