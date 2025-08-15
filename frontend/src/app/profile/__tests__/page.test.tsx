import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ProfilePage from '../page'

jest.mock('next-auth/react')
jest.mock('next/navigation')

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

const mockPush = jest.fn()
const mockBack = jest.fn()
const mockRouter = {
  push: mockPush,
  back: mockBack,
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
}

const mockSession = {
  user: {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    image: 'https://example.com/avatar.jpg',
  },
  expires: '2024-12-31',
}

describe('ProfilePage', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue(mockRouter as any)
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    })
    mockPush.mockClear()
    mockBack.mockClear()
  })

  it('renders profile information', () => {
    render(<ProfilePage />)
    
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Profile Information')).toBeInTheDocument()
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
  })

  it('renders connected accounts section', () => {
    render(<ProfilePage />)
    
    expect(screen.getByText('Connected Accounts')).toBeInTheDocument()
    expect(screen.getByText('Email & Password')).toBeInTheDocument()
    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.getAllByText('Connected')).toHaveLength(2)
  })

  it('renders notification settings', () => {
    render(<ProfilePage />)
    
    expect(screen.getByText('Notification Settings')).toBeInTheDocument()
    expect(screen.getByText('Budget Alerts')).toBeInTheDocument()
    expect(screen.getByText('Family Updates')).toBeInTheDocument()
    expect(screen.getByText('Expense Reminders')).toBeInTheDocument()
    expect(screen.getByText('Weekly Reports')).toBeInTheDocument()
  })

  it('renders default view toggle', () => {
    render(<ProfilePage />)
    
    expect(screen.getByText('Default View')).toBeInTheDocument()
    expect(screen.getByLabelText(/personal/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/family/i)).toBeInTheDocument()
  })

  it('renders export data section', () => {
    render(<ProfilePage />)
    
    expect(screen.getByText('Export Data')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export as pdf/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export as excel/i })).toBeInTheDocument()
  })

  it('submits profile form with valid data', async () => {
    const mockUpdate = jest.fn()
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: mockUpdate,
    })
    
    render(<ProfilePage />)
    
    const nameInput = screen.getByDisplayValue('John Doe')
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Smith' } })
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument()
    })
  })

  it('toggles notification settings', () => {
    render(<ProfilePage />)
    
    const budgetAlertsToggle = screen.getByRole('checkbox', { name: /budget alerts/i })
    expect(budgetAlertsToggle).toBeChecked()
    
    fireEvent.click(budgetAlertsToggle)
    expect(budgetAlertsToggle).not.toBeChecked()
  })

  it('changes default view', () => {
    render(<ProfilePage />)
    
    const personalRadio = screen.getByLabelText(/personal/i)
    const familyRadio = screen.getByLabelText(/family/i)
    
    expect(personalRadio).toBeChecked()
    expect(familyRadio).not.toBeChecked()
    
    fireEvent.click(familyRadio)
    
    expect(personalRadio).not.toBeChecked()
    expect(familyRadio).toBeChecked()
  })

  it('handles export data buttons', async () => {
    render(<ProfilePage />)
    
    const pdfButton = screen.getByRole('button', { name: /export as pdf/i })
    fireEvent.click(pdfButton)
    
    await waitFor(() => {
      expect(screen.getByText('Data exported successfully as PDF!')).toBeInTheDocument()
    })
  })

  it('redirects unauthenticated users', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })
    
    render(<ProfilePage />)
    
    expect(mockPush).toHaveBeenCalledWith('/auth/login')
  })

  it('shows loading spinner while session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    })
    
    render(<ProfilePage />)
    
    expect(screen.getByRole('status')).toBeInTheDocument() // spinner
  })

  it('navigates back when back button is clicked', () => {
    render(<ProfilePage />)
    
    const backButton = screen.getByText('←')
    fireEvent.click(backButton)
    
    expect(mockBack).toHaveBeenCalled()
  })

  it('validates form fields', async () => {
    render(<ProfilePage />)
    
    const emailInput = screen.getByDisplayValue('john@example.com')
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('shows success message after successful update', async () => {
    render(<ProfilePage />)
    
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument()
    })
  })
})