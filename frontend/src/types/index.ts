/**
 * TiKiT OS V2 — TypeScript types for all 26 models and 16 enums
 * Source of truth: specs/001-tikit-os-prd/data-model.md
 */

// ─── Enums (16 per data-model.md + paused/cancelled) ────────────────────────

export type CampaignStatusV2 =
  | 'draft' | 'in_review' | 'pitching' | 'live'
  | 'reporting' | 'closed' | 'paused' | 'cancelled';

export type CampaignPhase =
  | 'brief_intake' | 'ai_structuring' | 'budget_review'
  | 'influencer_matching' | 'client_pitching' | 'content_production'
  | 'performance_tracking' | 'report_generation' | 'closure';

export type RiskLevel = 'low' | 'medium' | 'high';

export type RoleName =
  | 'director' | 'campaign_manager' | 'reviewer'
  | 'finance' | 'client' | 'influencer';

export type InfluencerLifecycleStatus =
  | 'proposed' | 'approved' | 'contracted'
  | 'brief_accepted' | 'live' | 'completed';

export type ContentTypeV2 = 'script' | 'video_draft' | 'final';

export type ContentApprovalStatus =
  | 'pending' | 'internal_approved' | 'client_approved' | 'changes_requested';

export type InvoiceType = 'client' | 'influencer';

export type InvoiceStatus = 'draft' | 'sent' | 'approved' | 'paid';

export type ReportStatus = 'draft' | 'pending_approval' | 'approved' | 'exported';

export type ApprovalType =
  | 'budget' | 'shortlist' | 'content_internal' | 'content_client'
  | 'report' | 'exception' | 'high_risk_override' | 'registration';

export type KPISource = 'manual' | 'auto';

export type ProfileStatus = 'complete' | 'stub';

export type ClientType = 'company' | 'individual';

export type RegistrationStatus = 'pending' | 'approved' | 'rejected';

export type ExceptionType = 'urgent_posting' | 'verbal_approval' | 'client_timeout';

// ─── Model Interfaces (26 models) ───────────────────────────────────────────

export interface UserV2 {
  userId: string;
  email: string;
  fullName: string;
  displayName?: string;
  phone?: string;
  profileImageUrl?: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  failedLoginCount: number;
  lockedUntil?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  roles?: UserRole[];
  profile?: Profile;
}

export interface UserRole {
  id: string;
  userId: string;
  role: RoleName;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyRegistration {
  id: string;
  userId: string;
  companyName?: string;
  vatTrnNumber?: string;
  licenseNumber?: string;
  expiryDate?: string;
  businessAddress?: string;
  activities?: string;
  ownerNames?: string;
  licenseFileUrl?: string;
  status: RegistrationStatus;
  reviewedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientV2 {
  clientId: string;
  displayId?: string;
  type: ClientType;
  legalCompanyName: string;
  brandDisplayName: string;
  industryVertical?: string;
  primaryContactEmails: string;
  billingContactEmails: string;
  preferredCommChannels: string;
  phone?: string;
  avatar?: string;
  totalAdSpend?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignV2 {
  campaignId: string;
  displayId?: string;
  campaignName: string;
  campaignDescription?: string;
  campaignObjectives?: string;
  status: CampaignStatusV2;
  phase: CampaignPhase;
  riskLevel: RiskLevel;
  riskScore: number;
  totalBudget?: number;
  managementFee: number;
  allocatedBudget?: number;
  spentBudget?: number;
  startDate?: string;
  endDate?: string;
  closedAt?: string;
  isDeleted: boolean;
  version: number;
  clientId?: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
  client?: ClientV2;
  owner?: UserV2;
  strategy?: Strategy;
}

export interface CampaignClientAssignment {
  id: string;
  campaignId: string;
  clientId: string;
  clientUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BriefV2 {
  id: string;
  campaignId: string;
  version: number;
  rawText?: string;
  fileName?: string;
  fileUrl?: string;
  objectives?: string;
  kpis?: string;
  targetAudience?: string;
  deliverables?: string;
  budgetSignals?: string;
  clientInfo?: string;
  keyMessages?: string;
  contentPillars?: string;
  matchingCriteria?: string;
  confidenceScores?: string;
  extractionStatus: string;
  isReviewed: boolean;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
  versions?: BriefVersion[];
}

export interface BriefVersion {
  id: string;
  briefId: string;
  versionNumber: number;
  objectives?: string;
  kpis?: string;
  targetAudience?: string;
  deliverables?: string;
  budgetSignals?: string;
  clientInfo?: string;
  keyMessages?: string;
  contentPillars?: string;
  matchingCriteria?: string;
  changedBy?: string;
  createdAt: string;
}

export interface Strategy {
  id: string;
  campaignId: string;
  summary?: string;
  keyMessages?: string;
  contentPillars?: string;
  matchingCriteria?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InfluencerV2 {
  influencerId: string;
  displayId?: string;
  handle?: string;
  fullName: string;
  displayName: string;
  email: string;
  phone?: string;
  bio?: string;
  profileImageUrl?: string;
  platform: string;
  niches?: string;
  geo?: string;
  language?: string;
  followerCount?: number;
  engagementRate?: number;
  rateCard?: string;
  tier?: string;
  gender?: string;
  city?: string;
  country?: string;
  representation?: string;
  agentContact?: string;
  tiktokHandle?: string;
  tiktokLink?: string;
  sociataProfileUrl?: string;
  profileStatus: ProfileStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignInfluencerV2 {
  id: string;
  campaignId: string;
  influencerId: string;
  status: InfluencerLifecycleStatus;
  collaborationStatus: string;
  aiMatchScore?: number;
  aiMatchRationale?: string;
  estimatedCost?: number;
  agreedCost?: number;
  briefAccepted: boolean;
  briefAcceptedAt?: string;
  contractStatus?: string;
  scheduledPostDate?: string;
  postPlatform?: string;
  invitedAt: string;
  approvedAt?: string;
  contractedAt?: string;
  liveAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  influencer?: InfluencerV2;
}

export interface ContentV2 {
  id: string;
  campaignId?: string;
  type: string;
  version: number;
  approvalStatus: string;
  filmingBlocked: boolean;
  postingBlocked: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSizeBytes?: number;
  livePostUrl?: string;
  internalFeedback?: string;
  clientFeedback?: string;
  exceptionType?: ExceptionType;
  exceptionApprovedBy?: string;
  exceptionEvidence?: string;
  collaborationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface KPI {
  id: string;
  campaignId: string;
  campaignInfluencerId?: string;
  reach?: number;
  impressions?: number;
  engagement?: number;
  clicks?: number;
  captureDay?: number;
  source: KPISource;
  createdAt: string;
}

export interface KPISchedule {
  id: string;
  campaignId: string;
  campaignInfluencerId: string;
  captureDay: number;
  scheduledAt: string;
  capturedAt?: string;
  isFailed: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  campaignId: string;
  status: ReportStatus;
  kpiSummary?: string;
  highlights?: string;
  aiNarrative?: string;
  approvedBy?: string;
  approvedAt?: string;
  exportedAt?: string;
  shareableUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceV2 {
  id: string;
  displayId?: string;
  invoiceNumber?: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  dueDate?: string;
  fileUrl?: string;
  notes?: string;
  campaignId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetRevision {
  id: string;
  campaignId: string;
  previousBudget: number;
  newBudget: number;
  changedBy: string;
  reason?: string;
  createdAt: string;
}

export interface Approval {
  id: string;
  campaignId: string;
  type: ApprovalType;
  entityId?: string;
  status: string;
  approvedBy?: string;
  rejectedBy?: string;
  reason?: string;
  evidence?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationV2 {
  notificationId: string;
  userId: string;
  campaignId?: string;
  notificationType: string;
  category: string;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  isEscalation: boolean;
  escalationLevel?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  campaignId?: string;
  entityType?: string;
  entityId?: string;
  title: string;
  description?: string;
  dueDate: string;
  isSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CXSurvey {
  id: string;
  campaignId: string;
  overallScore: number;
  communicationScore: number;
  qualityScore: number;
  timelinessScore: number;
  valueScore: number;
  testimonial?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostMortem {
  id: string;
  campaignId: string;
  wentWell?: string;
  improvements?: string;
  lessons?: string;
  actionItems?: string;
  riskNotes?: string;
  budgetAnalysis?: string;
  timelineAnalysis?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface InstagramConnection {
  id: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: string;
  igUserId?: string;
  igUsername?: string;
  pageId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Risk Assessment Response ────────────────────────────────────────────────

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  breakdown: Array<{
    field: string;
    points: number;
    reason: string;
  }>;
}

// ─── Status Transition Response ──────────────────────────────────────────────

export interface TransitionValidation {
  allowed: boolean;
  reason: string;
  missingRequirements: string[];
}
