'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { mockAPI, shouldUseMockAPI } from '@/utils/auth';

/**
 * Reset password form validation schema
 */
const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * Reset password page component for setting new password with token
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Extract token from URL parameters
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      validateToken(tokenParam);
    } else {
      setError('Invalid or missing reset token');
      setIsValidatingToken(false);
    }
  }, [searchParams]);

  /**
   * Validate the reset token with the backend
   */
  const validateToken = async (resetToken: string) => {
    try {
      let result;
      
      // Use mock API if in development or backend not available
      if (shouldUseMockAPI()) {
        result = await mockAPI.validateResetToken(resetToken);
        if (result.valid) {
          setError(null);
        } else {
          setError(result.message);
        }
      } else {
        const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              mutation ValidateResetToken($input: ValidateResetTokenInputType!) {
                validateResetToken(input: $input) {
                  valid
                  message
                }
              }
            `,
            variables: {
              input: {
                token: resetToken,
              },
            },
          }),
        });

        const graphqlResult = await response.json();
        
        if (graphqlResult.errors) {
          setError('Invalid or expired reset token');
        } else if (graphqlResult.data?.validateResetToken?.valid) {
          setError(null);
        } else {
          setError(graphqlResult.data?.validateResetToken?.message || 'Invalid or expired reset token');
        }
      }
    } catch (err) {
      // Fallback to mock API
      try {
        const mockResult = await mockAPI.validateResetToken(resetToken);
        if (mockResult.valid) {
          setError(null);
        } else {
          setError(mockResult.message);
        }
      } catch (mockErr) {
        setError('Failed to validate reset token. Please try again.');
      }
    } finally {
      setIsValidatingToken(false);
    }
  };

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('Missing reset token');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let result;
      
      // Use mock API if in development or backend not available
      if (shouldUseMockAPI()) {
        result = await mockAPI.resetPassword(token, data.password);
        if (result.success) {
          setSuccess(true);
        } else {
          setError(result.message);
        }
      } else {
        // Call GraphQL reset password mutation
        const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              mutation ResetPassword($input: ResetPasswordInputType!) {
                resetPassword(input: $input) {
                  success
                  message
                }
              }
            `,
            variables: {
              input: {
                token: token,
                password: data.password,
              },
            },
          }),
        });

        const graphqlResult = await response.json();
        
        if (graphqlResult.errors) {
          setError(graphqlResult.errors[0].message || 'Failed to reset password');
          return;
        }

        if (graphqlResult.data?.resetPassword?.success) {
          setSuccess(true);
        } else {
          setError(graphqlResult.data?.resetPassword?.message || 'Failed to reset password');
        }
      }
    } catch (err) {
      // Fallback to mock API
      try {
        const mockResult = await mockAPI.resetPassword(token, data.password);
        if (mockResult.success) {
          setSuccess(true);
        } else {
          setError(mockResult.message);
        }
      } catch (mockErr) {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while validating token
  if (isValidatingToken) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-xl shadow-lg px-8 py-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Validating reset token...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-xl shadow-lg px-8 py-10">
            {/* Success Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Password Reset!</h1>
              <p className="text-gray-600 mt-2">
                Your password has been successfully updated.
              </p>
            </div>

            {/* Login Button */}
            <Link
              href="/auth/login"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
            >
              Continue to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if token is invalid
  if (error && isValidatingToken === false && !token) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-xl shadow-lg px-8 py-10">
            {/* Error Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Invalid Link</h1>
              <p className="text-gray-600 mt-2">
                This password reset link is invalid or has expired.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href="/auth/forgot-password"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
              >
                Request New Reset Link
              </Link>
              <Link
                href="/auth/login"
                className="w-full text-blue-600 hover:text-blue-500 font-medium text-center block"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl shadow-lg px-8 py-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Reset Password</h1>
            <p className="text-gray-600 mt-2 text-sm">
              Enter your new password below.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Reset Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* New Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                {...register('password')}
                type="password"
                id="password"
                autoComplete="new-password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                placeholder="Enter new password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                placeholder="Confirm new password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}