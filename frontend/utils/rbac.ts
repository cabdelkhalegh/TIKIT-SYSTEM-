import { UserRole, Profile } from '@/types';

// Role hierarchy: director > account_manager > influencer/client
const roleHierarchy: Record<UserRole, number> = {
  director: 4,
  account_manager: 3,
  influencer: 2,
  client: 1,
};

/**
 * Check if user has a specific role
 */
export function hasRole(profile: Profile | null, role: UserRole): boolean {
  if (!profile || !profile.role || !profile.role_approved) return false;
  return profile.role === role;
}

/**
 * Check if user has at least the minimum required role
 */
export function hasMinimumRole(profile: Profile | null, minRole: UserRole): boolean {
  if (!profile || !profile.role || !profile.role_approved) return false;
  return roleHierarchy[profile.role] >= roleHierarchy[minRole];
}

/**
 * Check if user is a director
 */
export function isDirector(profile: Profile | null): boolean {
  return hasRole(profile, 'director');
}

/**
 * Check if user is an account manager or higher
 */
export function isAccountManagerOrHigher(profile: Profile | null): boolean {
  return hasMinimumRole(profile, 'account_manager');
}

/**
 * Get allowed routes for a user role
 */
export function getAllowedRoutes(role: UserRole | null): string[] {
  if (!role) return ['/'];

  const baseRoutes = ['/dashboard', '/profile'];

  switch (role) {
    case 'director':
      return [
        ...baseRoutes,
        '/users',
        '/invitations',
        '/campaigns',
        '/clients',
        '/influencers',
        '/content',
        '/reports',
      ];
    case 'account_manager':
      return [
        ...baseRoutes,
        '/campaigns',
        '/clients',
        '/influencers',
        '/content',
        '/reports',
      ];
    case 'influencer':
      return [...baseRoutes, '/campaigns', '/content'];
    case 'client':
      return [...baseRoutes, '/campaigns', '/reports'];
    default:
      return baseRoutes;
  }
}

/**
 * Check if route is allowed for user
 */
export function isRouteAllowed(profile: Profile | null, path: string): boolean {
  if (!profile || !profile.role || !profile.role_approved) {
    return path === '/' || path === '/login' || path === '/signup';
  }

  // Public routes
  if (path === '/' || path === '/login' || path === '/signup') {
    return true;
  }

  const allowedRoutes = getAllowedRoutes(profile.role);
  return allowedRoutes.some(route => path.startsWith(route));
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    director: 'Director',
    account_manager: 'Account Manager',
    influencer: 'Influencer',
    client: 'Client',
  };
  return names[role];
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    director: 'bg-purple-100 text-purple-800',
    account_manager: 'bg-blue-100 text-blue-800',
    influencer: 'bg-green-100 text-green-800',
    client: 'bg-gray-100 text-gray-800',
  };
  return colors[role];
}
