'use client';

import { ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { User } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * Dashboard layout component with navigation header matching the design mockups
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', current: pathname === '/dashboard' },
    { name: 'Transactions', href: '/transactions', current: pathname === '/transactions' },
    { name: 'Budget', href: '/budget', current: pathname === '/budget' },
    { name: 'Shopping List', href: '/shopping-list', current: pathname === '/shopping-list' },
  ];

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                FinTrack
              </Link>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    item.current
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              {/* User Name */}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-700">
                  {session?.user?.name || 'Stacey'}
                </p>
              </div>
              
              {/* User Avatar - clickable to go to profile */}
              <Link href="/profile" className="flex items-center space-x-2">
                {session?.user?.image ? (
                  <img
                    className="h-7 w-7 rounded-full object-cover hover:ring-2 hover:ring-blue-300 transition-all"
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200">
          <div className="px-4 py-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 text-base font-medium rounded-lg transition-colors ${
                  item.current
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}