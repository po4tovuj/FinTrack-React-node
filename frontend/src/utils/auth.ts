/**
 * Authentication utilities for password reset and validation
 */

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a mock reset token for testing
 */
export function generateMockToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Validate reset token format
 */
export function validateTokenFormat(token: string): boolean {
  // Token should be at least 16 characters and contain only alphanumeric characters
  return token.length >= 16 && /^[a-zA-Z0-9]+$/.test(token);
}

/**
 * Mock API calls for development when backend is not available
 */
export const mockAPI = {
  /**
   * Mock forgot password request
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock validation
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Please enter a valid email address' };
    }
    
    console.log(`[MOCK] Password reset email would be sent to: ${email}`);
    console.log(`[MOCK] Reset link: http://localhost:3000/auth/reset-password?token=${generateMockToken()}`);
    
    return { 
      success: true, 
      message: 'If an account with that email exists, you will receive a password reset email.' 
    };
  },

  /**
   * Mock validate reset token
   */
  async validateResetToken(token: string): Promise<{ valid: boolean; message: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!validateTokenFormat(token)) {
      return { valid: false, message: 'Invalid token format' };
    }
    
    // For testing, accept any valid format token
    console.log(`[MOCK] Validating reset token: ${token}`);
    return { valid: true, message: 'Token is valid' };
  },

  /**
   * Mock reset password
   */
  async resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (!validateTokenFormat(token)) {
      return { success: false, message: 'Invalid or expired token' };
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return { success: false, message: passwordValidation.errors[0] };
    }
    
    console.log(`[MOCK] Password reset successful for token: ${token}`);
    return { success: true, message: 'Password has been reset successfully' };
  },
};

/**
 * Check if we're in development mode and should use mock API
 */
export function shouldUseMockAPI(): boolean {
  return process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_USE_REAL_API;
}