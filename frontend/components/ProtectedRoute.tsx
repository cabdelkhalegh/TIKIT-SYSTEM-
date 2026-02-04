'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isRouteAllowed } from '@/utils/rbac';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredApproval?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requiredApproval = true 
}: ProtectedRouteProps) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Not authenticated
      if (!profile) {
        router.push('/login');
        return;
      }

      // Role not approved yet
      if (requiredApproval && (!profile.role || !profile.role_approved)) {
        router.push('/pending-approval');
        return;
      }

      // Check route access
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (!isRouteAllowed(profile, currentPath)) {
          router.push('/dashboard');
          return;
        }
      }
    }
  }, [profile, loading, router, requiredApproval]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!profile || (requiredApproval && (!profile.role || !profile.role_approved))) {
    return null;
  }

  return <>{children}</>;
}
