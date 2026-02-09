export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface Campaign {
  campaignId: string;
  campaignName: string;
  campaignDescription?: string;
  campaignObjectives?: string[]; // JSON parsed
  clientId: string;
  status: CampaignStatus;
  totalBudget?: number;
  allocatedBudget?: number;
  spentBudget?: number;
  startDate?: string;
  endDate?: string;
  launchDate?: string;
  targetAudienceJson?: string;
  targetAudience?: TargetAudience; // JSON parsed
  targetPlatformsJson?: string;
  targetPlatforms?: string[]; // JSON parsed
  performanceKPIsJson?: string;
  performanceKPIs?: Record<string, number>; // JSON parsed
  actualPerformanceJson?: string;
  actualPerformance?: Record<string, number>; // JSON parsed
  createdAt: string;
  updatedAt: string;
  client?: {
    clientId: string;
    legalCompanyName: string;
    brandDisplayName: string;
    industryVertical?: string;
  };
  _count?: {
    campaignInfluencers: number;
  };
}

export interface TargetAudience {
  demographics?: {
    ageRange?: string;
    gender?: string;
    locations?: string[];
  };
  interests?: string[];
  behaviors?: string[];
}

export interface CampaignInfluencer {
  id: string;
  campaignId: string;
  influencerId: string;
  role?: string;
  collaborationStatus: string;
  agreedDeliverables?: string;
  deliveredContent?: string;
  agreedPayment?: number;
  paymentStatus: string;
  performanceMetrics?: string;
  invitedAt: string;
  acceptedAt?: string;
  completedAt?: string;
  influencer?: {
    influencerId: string;
    fullName: string;
    displayName?: string;
    primaryPlatform?: string;
    profileImageUrl?: string;
  };
}

export interface BudgetStatus {
  totalBudget: number;
  allocatedBudget: number;
  spentBudget: number;
  remainingBudget: number;
  utilizationPercentage: number;
}

export interface CampaignListResponse {
  success: boolean;
  data: Campaign[];
  count: number;
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface CampaignResponse {
  success: boolean;
  data: Campaign;
}

export interface CreateCampaignRequest {
  campaignName: string;
  campaignDescription?: string;
  campaignObjectives?: string[];
  clientId: string;
  totalBudget?: number;
  startDate?: string;
  endDate?: string;
  targetAudience?: TargetAudience;
  targetPlatforms?: string[];
  performanceKPIs?: Record<string, number>;
}

export interface UpdateCampaignRequest extends Partial<CreateCampaignRequest> {}

export interface BudgetStatusResponse {
  success: boolean;
  data: BudgetStatus;
}
