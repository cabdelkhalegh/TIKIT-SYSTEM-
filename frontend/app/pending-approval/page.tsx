'use client';

import { useAuth } from '@/contexts/AuthContext';
import { getRoleDisplayName } from '@/utils/rbac';

export default function PendingApprovalPage() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Pending Approval
          </h2>
          <div className="mt-4 bg-white shadow overflow-hidden rounded-lg p-6">
            <p className="text-gray-600">
              Your account has been created and is pending approval from a director.
            </p>
            {profile?.role && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  Role: <span className="font-medium">{getRoleDisplayName(profile.role)}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Email: <span className="font-medium">{profile.email}</span>
                </p>
              </div>
            )}
            <p className="mt-4 text-sm text-gray-500">
              You will be notified via email once your account has been approved.
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="mt-6 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
