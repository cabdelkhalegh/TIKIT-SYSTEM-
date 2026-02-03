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

// ============================================================================
// CONTENT WORKFLOW TYPES (TASK 4)
// ============================================================================

export type CampaignStatus = 
  | 'draft'
  | 'brief_pending'
  | 'active'
  | 'content_review'
  | 'client_review'
  | 'completed'
  | 'archived';

export type ContentStatus = 
  | 'draft'
  | 'pending_internal'
  | 'internal_rejected'
  | 'pending_client'
  | 'client_rejected'
  | 'approved'
  | 'published';

export interface Client {
  id: string;
  client_code: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  industry: string | null;
  website: string | null;
  notes: string | null;
  primary_contact_name: string | null;
  account_manager_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Campaign {
  id: string;
  campaign_code: string;
  name: string;
  client_id: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: CampaignStatus;
  budget_amount: number | null;
  budget_currency: string;
  campaign_manager_id: string | null;
  reviewer_id: string | null;
  brief_document_url: string | null;
  strategy_document_url: string | null;
  brief_approved_at: string | null;
  brief_approved_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ContentItem {
  id: string;
  campaign_id: string;
  title: string;
  description: string | null;
  content_type: string | null;
  platform: string | null;
  scheduled_date: string | null;
  current_version_id: string | null;
  status: ContentStatus;
  internal_review_deadline: string | null;
  client_review_deadline: string | null;
  publish_deadline: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ContentVersion {
  id: string;
  content_item_id: string;
  version_number: number;
  version_label: string | null;
  file_url: string;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  thumbnail_url: string | null;
  change_description: string | null;
  created_at: string;
  uploaded_by: string | null;
}

export type ApprovalStage = 'internal' | 'client';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ContentApproval {
  id: string;
  content_version_id: string;
  approval_stage: ApprovalStage;
  status: ApprovalStatus;
  decision_notes: string | null;
  approver_id: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface ContentFeedback {
  id: string;
  content_version_id: string;
  comment: string;
  annotation_x: number | null;
  annotation_y: number | null;
  parent_feedback_id: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  created_by: string | null;
}
