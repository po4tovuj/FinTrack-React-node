'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Bell, 
  Download, 
  Eye, 
  Users, 
  Mail, 
  Camera,
  Settings,
  FileText,
  Shield,
  ExternalLink
} from 'lucide-react';
import { exportData } from '@/utils/export';

/**
 * Profile form validation schema
 */
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  avatar: z.string().url().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

/**
 * User Profile Page Component
 * Features: Avatar, Name, Email, Connected Accounts, Notifications, Default View Toggle, Export Data
 */
export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [defaultView, setDefaultView] = useState<'personal' | 'family'>('personal');
  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    familyUpdates: true,
    expenseReminders: false,
    weeklyReports: true,
    pushNotifications: true,
    emailNotifications: true,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/login');
    }
  }, [session, status, router]);

  // Set form values when session loads
  useEffect(() => {
    if (session?.user) {
      setValue('name', session.user.name || '');
      setValue('email', session.user.email || '');
      setValue('avatar', session.user.image || '');
    }
  }, [session, setValue]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Here you would typically update the user profile via GraphQL
      // For now, we'll simulate the update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the session
      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.name,
          email: data.email,
          image: data.avatar,
        },
      });

      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handleExportData = async (format: 'pdf' | 'excel') => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await exportData(format);
      setSuccess(`Data exported successfully as ${format.toUpperCase()}! Check your downloads folder.`);
    } catch (err) {
      console.error('Export error:', err);
      setError(`Failed to export data as ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                ←
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Information */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <User className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-semibold">
                      {session.user?.image ? (
                        <img
                          src={session.user.image}
                          alt="Profile"
                          className="h-20 w-20 rounded-full object-cover"
                        />
                      ) : (
                        session.user?.name?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <button
                      type="button"
                      className="absolute -bottom-1 -right-1 h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{session.user?.name}</h3>
                    <p className="text-sm text-gray-600">{session.user?.email}</p>
                  </div>
                </div>

                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    id="name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>

            {/* Connected Accounts */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <Shield className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Connected Accounts</h2>
              </div>

              <div className="space-y-4">
                {/* Email Account */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <Mail className="h-8 w-8 text-gray-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Email & Password</p>
                      <p className="text-sm text-gray-600">{session.user?.email}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Connected
                  </span>
                </div>

                {/* Google Account */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-8 w-8 mr-3">
                      <svg viewBox="0 0 24 24" className="h-8 w-8">
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
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Google</p>
                      <p className="text-sm text-gray-600">Single sign-on authentication</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Connected
                  </span>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <Bell className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
              </div>

              <div className="space-y-6">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </p>
                      <p className="text-sm text-gray-600">
                        {key === 'budgetAlerts' && 'Get notified when approaching budget limits'}
                        {key === 'familyUpdates' && 'Receive updates on family member activities'}
                        {key === 'expenseReminders' && 'Reminders to log daily expenses'}
                        {key === 'weeklyReports' && 'Weekly summary of your financial activity'}
                        {key === 'pushNotifications' && 'Browser push notifications'}
                        {key === 'emailNotifications' && 'Email notifications and reports'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={value}
                        onChange={(e) => handleNotificationChange(key, e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Default View Toggle */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <Eye className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Default View</h3>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="defaultView"
                    value="personal"
                    checked={defaultView === 'personal'}
                    onChange={(e) => setDefaultView(e.target.value as 'personal')}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">Personal</span>
                    <p className="text-xs text-gray-600">Show only your personal data</p>
                  </div>
                </label>
                
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="defaultView"
                    value="family"
                    checked={defaultView === 'family'}
                    onChange={(e) => setDefaultView(e.target.value as 'family')}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex items-center">
                    <Users className="h-4 w-4 text-gray-600 mr-1" />
                    <span className="text-sm font-medium text-gray-900">Family</span>
                    <p className="text-xs text-gray-600 ml-2">Include family member data</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Export Data */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <Download className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Download your financial data for backup or analysis.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleExportData('pdf')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </button>
                
                <button
                  onClick={() => handleExportData('excel')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Export as Excel
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <Settings className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              
              <div className="space-y-3">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  Change Password
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  Privacy Settings
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  Two-Factor Authentication
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}