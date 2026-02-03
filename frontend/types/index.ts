// PRD v1.2 Section 2 - Six user roles for RBAC
export type UserRole = 
  | 'director'           // Founder/Director - super-user
  | 'campaign_manager'   // Runs campaigns
  | 'reviewer'           // Quality & approvals
  | 'finance'            // Financial control
  | 'client'             // External approver
  | 'influencer';        // External contributor

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole | null;
  role_approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  invite_code: string;
  status: InvitationStatus;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}
