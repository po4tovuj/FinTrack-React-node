'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingUp, Wallet, Users, ShoppingCart } from 'lucide-react';

/**
 * Landing page component for FinTrack application
 * Redirects authenticated users to dashboard
 */
export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (session) {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render landing page if user is authenticated (they'll be redirected)
  if (session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Navigation Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold text-gray-900">
              FinTrack
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mb-6">
              ✨ Personal Finance Made Simple
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Take Control of Your{' '}
            <span className="text-blue-600">Finances</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Track expenses, manage budgets, collaborate with family, and achieve your financial goals with our intuitive platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              Start Free Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for Financial Success
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to help you understand and control your financial life.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Expense Tracking */}
          <div className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm p-8 hover:shadow-lg hover:bg-white transition-all duration-300 border border-white/50">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Wallet className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Expense Tracking
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Track every transaction with smart categorization and powerful filtering options.
            </p>
          </div>

          {/* Budget Management */}
          <div className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm p-8 hover:shadow-lg hover:bg-white transition-all duration-300 border border-white/50">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Smart Budgeting
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Set monthly and yearly budgets with real-time tracking and overspending alerts.
            </p>
          </div>

          {/* Family Sharing */}
          <div className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm p-8 hover:shadow-lg hover:bg-white transition-all duration-300 border border-white/50">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Users className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Family Sharing
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Share expenses with family members and automatically split costs fairly.
            </p>
          </div>

          {/* Shopping Lists */}
          <div className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm p-8 hover:shadow-lg hover:bg-white transition-all duration-300 border border-white/50">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <ShoppingCart className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Shopping Lists
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Create collaborative shopping lists that automatically convert to transactions.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 relative">
          <div className="text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Finances?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of users who have already taken control of their financial future with FinTrack.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center px-8 py-4 bg-white hover:bg-gray-50 text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center px-8 py-4 bg-blue-500/20 hover:bg-blue-500/30 text-white font-semibold rounded-xl border border-blue-300/30 backdrop-blur-sm transition-all duration-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4">
              <div className="text-2xl font-bold text-white mb-2">FinTrack</div>
              <p className="text-gray-400 max-w-md mx-auto">
                Your personal finance companion for a brighter financial future.
              </p>
            </div>
            <div className="pt-6 border-t border-gray-800">
              <p className="text-gray-500 text-sm">
                © 2024 FinTrack. Built with Next.js, GraphQL, and PostgreSQL.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}