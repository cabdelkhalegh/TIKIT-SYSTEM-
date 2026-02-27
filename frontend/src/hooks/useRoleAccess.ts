/**
 * useRoleAccess — TiKiT OS V2 role access hook
 * Constitution Section III: 6 roles, multi-role union, Client/Influencer exclusive
 */

import { useMemo } from 'react';
import { RoleName } from '@/types';

// Read user roles from localStorage (Zustand persisted state or JWT payload)
function getUserRoles(): RoleName[] {
  try {
    // First try Zustand persisted auth storage
    const authStorage = localStorage.getItem('tikit-auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      const user = parsed.state?.user;
      if (user?.roles && Array.isArray(user.roles)) return user.roles;
      // Also try decoding the token
      const token = parsed.state?.token;
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (Array.isArray(payload.roles)) return payload.roles;
        if (payload.userRole) return [payload.userRole];
      }
    }
    // Fallback: legacy 'token' key
    const token = localStorage.getItem('token');
    if (!token) return [];
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (Array.isArray(payload.roles)) return payload.roles;
    if (payload.userRole) return [payload.userRole];
    if (payload.role) return [payload.role];
    return [];
  } catch {
    return [];
  }
}

export interface RoleAccessFlags {
  isDirector: boolean;
  isCampaignManager: boolean;
  isReviewer: boolean;
  isFinance: boolean;
  isClient: boolean;
  isInfluencer: boolean;
  isInternalUser: boolean;
  roles: RoleName[];
  hasRole: (role: RoleName) => boolean;
  hasAnyRole: (roles: RoleName[]) => boolean;
  canViewTab: (tab: string) => boolean;
  canPerformAction: (action: string) => boolean;
}

export function useRoleAccess(): RoleAccessFlags {
  const roles = useMemo(() => getUserRoles(), []);

  const hasRole = (role: RoleName) => roles.includes(role);
  const hasAnyRole = (checkRoles: RoleName[]) => checkRoles.some(r => roles.includes(r));

  const isDirector = hasRole('director');
  const isCampaignManager = hasRole('campaign_manager');
  const isReviewer = hasRole('reviewer');
  const isFinance = hasRole('finance');
  const isClient = hasRole('client');
  const isInfluencer = hasRole('influencer');
  const isInternalUser = hasAnyRole(['director', 'campaign_manager', 'reviewer', 'finance']);

  const canViewTab = (tab: string): boolean => {
    switch (tab) {
      case 'brief':
      case 'strategy':
      case 'influencers':
        return hasAnyRole(['director', 'campaign_manager', 'reviewer']);
      case 'content':
        return true; // all roles
      case 'kpis':
      case 'reports':
        return hasAnyRole(['director', 'campaign_manager', 'reviewer', 'client']);
      case 'finance':
        return hasAnyRole(['director', 'finance']);
      case 'closure':
        return isInternalUser;
      default:
        return isInternalUser;
    }
  };

  const canPerformAction = (action: string): boolean => {
    switch (action) {
      case 'create_campaign':
      case 'edit_campaign':
        return hasAnyRole(['director', 'campaign_manager']);
      case 'delete_campaign':
        return hasAnyRole(['director', 'campaign_manager']);
      case 'approve_budget':
      case 'override_high_risk':
      case 'approve_exception':
        return isDirector;
      case 'approve_internal_content':
        return hasAnyRole(['director', 'campaign_manager']);
      case 'approve_client_content':
        return hasAnyRole(['director', 'client']);
      case 'approve_shortlist':
        return hasAnyRole(['director', 'client']);
      case 'manage_invoices':
        return hasAnyRole(['director', 'finance']);
      case 'manage_users':
      case 'approve_registrations':
        return isDirector;
      case 'submit_content':
        return isInfluencer;
      default:
        return isInternalUser;
    }
  };

  return {
    isDirector,
    isCampaignManager,
    isReviewer,
    isFinance,
    isClient,
    isInfluencer,
    isInternalUser,
    roles,
    hasRole,
    hasAnyRole,
    canViewTab,
    canPerformAction,
  };
}

export default useRoleAccess;
