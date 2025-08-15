'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { mockAPI, shouldUseMockAPI } from '@/utils/auth';

/**
 * Forgot password form validation schema
 */
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Forgot password page component for password reset requests
 */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      let result;
      
      // Use mock API if in development or backend not available
      if (shouldUseMockAPI()) {
        result = await mockAPI.forgotPassword(data.email);
        if (result.success) {
          setSuccess(true);
        } else {
          setError(result.message);
        }
      } else {
        // Call GraphQL forgot password mutation
        const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              mutation ForgotPassword($input: ForgotPasswordInputType!) {
                forgotPassword(input: $input) {
                  success
                  message
                }
              }
            `,
            variables: {
              input: {
                email: data.email,
              },
            },
          }),
        });

        const graphqlResult = await response.json();
        
        if (graphqlResult.errors) {
          setError(graphqlResult.errors[0].message || 'Failed to send reset email');
          return;
        }

        if (graphqlResult.data?.forgotPassword?.success) {
          setSuccess(true);
        } else {
          setError(graphqlResult.data?.forgotPassword?.message || 'Failed to send reset email');
        }
      }
    } catch (err) {
      // Fallback to mock API if real API fails
      try {
        const mockResult = await mockAPI.forgotPassword(data.email);
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
              <h1 className="text-2xl font-bold text-gray-800">Email Sent!</h1>
              <p className="text-gray-600 mt-2">
                Check your email for password reset instructions.
              </p>
            </div>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-blue-600 hover:text-blue-500 font-medium text-sm"
              >
                ← Back to Login
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
            <h1 className="text-3xl font-bold text-gray-800">Forgot Password</h1>
            <p className="text-gray-600 mt-2 text-sm">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Forgot Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                autoComplete="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Sending Email...' : 'Send Reset Email'}
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