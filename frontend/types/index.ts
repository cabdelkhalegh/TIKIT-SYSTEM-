export type UserRole = 'director' | 'account_manager' | 'influencer' | 'client';

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
