import { UserRole, Profile } from '@/types';

// Role hierarchy per PRD v1.2 Section 2
// Higher number = more permissions
const roleHierarchy: Record<UserRole, number> = {
  director: 6,         // Super-user - full access
  finance: 5,          // Financial control
  campaign_manager: 4, // Runs campaigns
  reviewer: 3,         // Quality & approvals
  influencer: 2,       // External contributor
  client: 1,           // External approver (limited view)
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
 * Check if user is finance role or higher
 */
export function isFinanceOrHigher(profile: Profile | null): boolean {
  return hasMinimumRole(profile, 'finance');
}

/**
 * Check if user is a campaign manager or higher
 */
export function isCampaignManagerOrHigher(profile: Profile | null): boolean {
  return hasMinimumRole(profile, 'campaign_manager');
}

/**
 * Check if user is a reviewer or higher
 */
export function isReviewerOrHigher(profile: Profile | null): boolean {
  return hasMinimumRole(profile, 'reviewer');
}

/**
 * Get allowed routes for a user role per PRD v1.2
 */
export function getAllowedRoutes(role: UserRole | null): string[] {
  if (!role) return ['/'];

  const baseRoutes = ['/dashboard', '/profile'];

  switch (role) {
    case 'director':
      // Super-user: Full access to everything
      return [
        ...baseRoutes,
        '/users',
        '/invitations',
        '/campaigns',
        '/clients',
        '/influencers',
        '/content',
        '/reports',
        '/finance',
        '/invoices',
      ];
    case 'finance':
      // Financial control: Invoices, reports, campaigns
      return [
        ...baseRoutes,
        '/campaigns',
        '/clients',
        '/influencers',
        '/reports',
        '/finance',
        '/invoices',
      ];
    case 'campaign_manager':
      // Runs campaigns: Manage campaigns, clients, influencers, content
      return [
        ...baseRoutes,
        '/campaigns',
        '/clients',
        '/influencers',
        '/content',
        '/reports',
      ];
    case 'reviewer':
      // Quality & approvals: Review briefs, content, reports
      return [
        ...baseRoutes,
        '/campaigns',
        '/content',
        '/reports',
      ];
    case 'influencer':
      // External contributor: View own campaigns, upload content
      return [...baseRoutes, '/campaigns', '/content'];
    case 'client':
      // External approver: View campaigns and reports
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
 * Get role display name per PRD v1.2
 */
export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    director: 'Director',
    campaign_manager: 'Campaign Manager',
    reviewer: 'Reviewer',
    finance: 'Finance',
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
    campaign_manager: 'bg-blue-100 text-blue-800',
    reviewer: 'bg-yellow-100 text-yellow-800',
    finance: 'bg-green-100 text-green-800',
    influencer: 'bg-pink-100 text-pink-800',
    client: 'bg-gray-100 text-gray-800',
  };
  return colors[role];
}

/**
 * Get role description per PRD v1.2
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    director: 'Super-user with global visibility, budget overrides, and exception approvals',
    campaign_manager: 'Runs campaigns - create/edit campaigns, manage workflows',
    reviewer: 'Quality & approvals - approve briefs, content, and reports',
    finance: 'Financial control - create & approve invoices, mark as paid',
    influencer: 'External contributor - upload content, connect Instagram, view status',
    client: 'External approver - view & approve shortlist, content, and reports',
  };
  return descriptions[role];
}
