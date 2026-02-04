'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { DirectorOnly } from '@/components/RoleGate';
import { getRoleDisplayName, getRoleBadgeColor } from '@/utils/rbac';

export default function DashboardPage() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-purple-600">TiKiT</h1>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    href="/dashboard"
                    className="border-purple-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <DirectorOnly>
                    <Link
                      href="/invitations"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Invitations
                    </Link>
                  </DirectorOnly>
                  <Link
                    href="/profile"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Profile
                  </Link>
                </div>
              </div>
              <div className="flex items-center">
                {profile?.role && (
                  <span className={`mr-4 px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(profile.role)}`}>
                    {getRoleDisplayName(profile.role)}
                  </span>
                )}
                <button
                  onClick={handleSignOut}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome back, {profile?.full_name || profile?.email}!
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                You are logged in as {profile?.role && getRoleDisplayName(profile.role)}
              </p>
            </div>

            {/* Dashboard content */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Director-only cards */}
              <DirectorOnly>
                <Link href="/invitations">
                  <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-6 w-6 text-purple-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Manage Invitations
                            </dt>
                            <dd className="text-sm text-gray-900">
                              Send invites and approve users
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </DirectorOnly>

              {/* Common cards */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Campaigns
                        </dt>
                        <dd className="text-sm text-gray-900">Coming soon</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Profile</dt>
                        <dd className="text-sm text-gray-900">View your profile</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RBAC info box */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900">Role-Based Access Control</h3>
              <p className="mt-2 text-sm text-blue-700">
                Your access is determined by your role: <strong>{profile?.role && getRoleDisplayName(profile.role)}</strong>
              </p>
              <p className="mt-1 text-xs text-blue-600">
                Some features and pages may be hidden based on your permissions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
