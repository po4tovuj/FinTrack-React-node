import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import LoginPage from '../page'

// Mock the modules
jest.mock('next-auth/react')
jest.mock('next/navigation')

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

const mockPush = jest.fn()
const mockRouter = {
  push: mockPush,
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
}

describe('LoginPage', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue(mockRouter as any)
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })
    mockSignIn.mockClear()
    mockPush.mockClear()
  })

  it('renders login form', () => {
    render(<LoginPage />)
    
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<LoginPage />)
    
    const submitButton = screen.getByRole('button', { name: /login/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /login/i })
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid credentials', async () => {
    mockSignIn.mockResolvedValue({ error: null, status: 200, ok: true, url: null })
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /login/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false,
      })
    })
  })

  it('handles login error', async () => {
    mockSignIn.mockResolvedValue({ error: 'CredentialsSignin', status: 401, ok: false, url: null })
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /login/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    })
  })

  it('handles Google sign in', async () => {
    mockSignIn.mockResolvedValue({ error: null, status: 200, ok: true, url: null })
    
    render(<LoginPage />)
    
    const googleButton = screen.getByRole('button', { name: /sign in with google/i })
    fireEvent.click(googleButton)
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/dashboard' })
    })
  })

  it('shows loading state during submission', async () => {
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /login/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    expect(screen.getByText(/signing in/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('has remember me checkbox', () => {
    render(<LoginPage />)
    
    const rememberMeCheckbox = screen.getByLabelText(/remember me/i)
    expect(rememberMeCheckbox).toBeInTheDocument()
    expect(rememberMeCheckbox).not.toBeChecked()
  })

  it('has forgot password link', () => {
    render(<LoginPage />)
    
    const forgotPasswordLink = screen.getByText(/forgot password/i)
    expect(forgotPasswordLink).toBeInTheDocument()
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/auth/forgot-password')
  })

  it('redirects authenticated users', () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
      update: jest.fn(),
    })
    
    render(<LoginPage />)
    
    // Component should not render login form for authenticated users
    expect(screen.queryByText('Login')).not.toBeInTheDocument()
  })
})