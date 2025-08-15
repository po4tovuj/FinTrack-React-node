'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * Registration form validation schema
 */
const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Registration page component matching registration.png design
 */
export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call GraphQL register mutation
      const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation Register($input: RegisterInputType!) {
              register(input: $input) {
                user {
                  id
                  email
                  name
                }
                token
                refreshToken
              }
            }
          `,
          variables: {
            input: {
              email: data.email,
              password: data.password,
              name: data.fullName,
            },
          },
        }),
      });

      const result = await response.json();
      
      if (result.errors) {
        setError(result.errors[0].message || 'Registration failed');
        return;
      }

      // Auto sign in after registration
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError('Registration successful, but sign in failed. Please try logging in.');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (err) {
      setError('Google sign up failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl px-10 py-12">
          {/* Header - Exact match to registration.png */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-800">Register</h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Registration Form - Exact layout from registration.png */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Full Name Field */}
            <div>
              <label htmlFor="fullName" className="block text-base font-medium text-gray-600 mb-3">
                Full Name
              </label>
              <input
                {...register('fullName')}
                type="text"
                id="fullName"
                autoComplete="name"
                className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-gray-900 bg-gray-50/50"
                placeholder=""
              />
              {errors.fullName && (
                <p className="mt-2 text-sm text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-base font-medium text-gray-600 mb-3">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                autoComplete="email"
                className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-gray-900 bg-gray-50/50"
                placeholder=""
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-base font-medium text-gray-600 mb-3">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                id="password"
                autoComplete="new-password"
                className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-gray-900 bg-gray-50/50"
                placeholder=""
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me - Matching image position */}
            <div className="flex items-center pt-2">
              <input
                {...register('rememberMe')}
                id="rememberMe"
                type="checkbox"
                className="h-5 w-5 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="rememberMe" className="ml-3 text-base text-gray-600">
                Remember me
              </label>
            </div>

            {/* Google Sign Up Button - Exact styling from registration.png */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-5 py-4 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 mt-6"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-gray-700 font-medium text-base">Sign up with Google</span>
            </button>

            {/* Sign Up Button - Exact blue styling from image */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-5 rounded-xl transition-colors disabled:opacity-50 text-base"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          {/* Login Link - Matching image bottom text */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-base">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-blue-500 hover:text-blue-600 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}