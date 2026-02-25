/**
 * ProtectedRoute — TiKiT OS V2 route guard
 * Constitution Section III: enforces role-based access at UI level
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoleName } from '@/types';
import { useRoleAccess } from '@/hooks/useRoleAccess';

interface ProtectedRouteProps {
  allowedRoles: RoleName[];
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  allowedRoles,
  children,
  redirectTo,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { roles, isClient, isInfluencer } = useRoleAccess();

  useEffect(() => {
    // No token at all → login
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    // Check if user has any of the allowed roles
    const hasAccess = allowedRoles.some(r => roles.includes(r));
    if (!hasAccess) {
      // Route to appropriate portal based on role
      if (isClient) {
        router.replace('/client-portal');
      } else if (isInfluencer) {
        router.replace('/influencer-portal');
      } else if (redirectTo) {
        router.replace(redirectTo);
      } else {
        router.replace('/dashboard');
      }
    }
  }, [roles, allowedRoles, router, isClient, isInfluencer, redirectTo]);

  // Check synchronously to avoid flash of unauthorized content
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) return null;

  const hasAccess = allowedRoles.some(r => roles.includes(r));
  if (!hasAccess) return null;

  return <>{children}</>;
}

export default ProtectedRoute;
