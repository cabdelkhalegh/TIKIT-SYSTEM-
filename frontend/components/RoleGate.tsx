'use client';

import { useAuth } from '@/contexts/AuthContext';
import { hasRole, hasMinimumRole, isDirector } from '@/utils/rbac';
import { UserRole } from '@/types';

interface RoleGateProps {
  children: React.ReactNode;
  roles?: UserRole[];
  minimumRole?: UserRole;
  fallback?: React.ReactNode;
}

/**
 * Component that shows/hides content based on user role
 */
export default function RoleGate({ 
  children, 
  roles, 
  minimumRole, 
  fallback = null 
}: RoleGateProps) {
  const { profile } = useAuth();

  // Not authenticated or role not approved
  if (!profile || !profile.role || !profile.role_approved) {
    return <>{fallback}</>;
  }

  // Check specific roles
  if (roles && roles.length > 0) {
    const hasRequiredRole = roles.some(role => hasRole(profile, role));
    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // Check minimum role
  if (minimumRole) {
    if (!hasMinimumRole(profile, minimumRole)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

/**
 * Helper component for director-only content
 */
export function DirectorOnly({ 
  children, 
  fallback = null 
}: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <RoleGate roles={['director']} fallback={fallback}>{children}</RoleGate>;
}

/**
 * Helper component for account manager and above
 */
export function AccountManagerOnly({ 
  children, 
  fallback = null 
}: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <RoleGate minimumRole="account_manager" fallback={fallback}>{children}</RoleGate>;
}
