'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { LogOut } from 'lucide-react';

interface InfluencerPortalLayoutProps {
  children: ReactNode;
}

export default function InfluencerPortalLayout({ children }: InfluencerPortalLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isInfluencer } = useRoleAccess();

  useEffect(() => {
    if (!isInfluencer) {
      router.push('/dashboard');
    }
  }, [isInfluencer, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isInfluencer) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Label */}
            <div className="flex items-center gap-3">
              <Link href="/influencer-portal" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                TIKIT
              </Link>
              <span className="text-sm font-medium text-gray-500 border-l border-gray-300 pl-3">
                Creator Portal
              </span>
            </div>

            {/* User + Logout */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.fullName || 'Creator'}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-pink-600 flex items-center justify-center text-white font-semibold text-sm">
                {user?.fullName?.[0]?.toUpperCase() || 'I'}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
