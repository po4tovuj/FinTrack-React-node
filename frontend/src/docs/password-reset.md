# Password Reset System

This document describes the password reset functionality implemented in the FinTrack application.

## Overview

The password reset system allows users to securely reset their passwords when they forget them. It follows a standard email-based token verification flow.

## User Flow

1. **Request Reset**: User clicks "Forgot password?" on login page
2. **Enter Email**: User enters their email address on `/auth/forgot-password`
3. **Email Sent**: System sends reset email with secure token link
4. **Click Link**: User clicks the link in their email (leads to `/auth/reset-password?token=...`)
5. **New Password**: User enters and confirms their new password
6. **Success**: Password is updated and user can login with new credentials

## Pages

### `/auth/forgot-password`
- Form to request password reset
- Validates email format
- Shows success message after submission
- Includes link back to login page

### `/auth/reset-password`
- Validates reset token from URL parameter
- Form to set new password with confirmation
- Password strength requirements
- Success state with link to login

## API Integration

The system supports both real GraphQL backend and mock API for development:

### GraphQL Mutations (Production)
```graphql
mutation ForgotPassword($input: ForgotPasswordInputType!) {
  forgotPassword(input: $input) {
    success
    message
  }
}

mutation ValidateResetToken($input: ValidateResetTokenInputType!) {
  validateResetToken(input: $input) {
    valid
    message
  }
}

mutation ResetPassword($input: ResetPasswordInputType!) {
  resetPassword(input: $input) {
    success
    message
  }
}
```

### Mock API (Development)
- Located in `src/utils/auth.ts`
- Simulates API delays and responses
- Logs actions to console for testing
- Generates mock tokens for testing

## Security Features

- Token-based authentication for reset requests
- Token validation before allowing password reset
- Password strength requirements
- Secure token format validation
- Email verification required

## Testing

### Development Mode
The system automatically uses mock API when:
- `NODE_ENV === 'development'`
- `NEXT_PUBLIC_USE_REAL_API` is not set

### Test Flow
1. Go to http://localhost:3000/auth/forgot-password
2. Enter any valid email format
3. Check browser console for mock reset link
4. Copy the token from the console log
5. Visit http://localhost:3000/auth/reset-password?token=YOUR_TOKEN
6. Enter new password and confirm

### Example Mock Token
The mock system generates tokens like: `abcd1234efgh5678ijklmnop`

## Production Setup

To enable real password reset functionality:

1. Implement the GraphQL mutations in your backend
2. Set up email sending service (SendGrid, SES, etc.)
3. Set `NEXT_PUBLIC_USE_REAL_API=true` in environment
4. Configure `NEXT_PUBLIC_GRAPHQL_URL` to point to your backend

## Error Handling

The system includes comprehensive error handling:
- Invalid email format
- Network errors
- Invalid/expired tokens
- Password validation errors
- Backend service failures

All errors show user-friendly messages and provide appropriate fallback actions.