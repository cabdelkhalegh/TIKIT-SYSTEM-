export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'facebook' | 'linkedin';

export type ContentCategory =
  | 'lifestyle'
  | 'beauty'
  | 'fitness'
  | 'tech'
  | 'fashion'
  | 'food'
  | 'travel'
  | 'gaming'
  | 'business'
  | 'education'
  | 'entertainment'
  | 'health'
  | 'parenting'
  | 'sports';

export type InfluencerStatus = 'active' | 'inactive' | 'paused';

export interface SocialMediaHandles {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  twitter?: string;
  facebook?: string;
  linkedin?: string;
}

export interface AudienceMetrics {
  followers: number;
  engagementRate: number;
  avgViews: number;
  avgLikes?: number;
  avgComments?: number;
  avgShares?: number;
}

export interface Rates {
  perPost?: number;
  perVideo?: number;
  perStory?: number;
  perReel?: number;
}

export interface PerformanceHistory {
  date: string;
  followers: number;
  engagementRate: number;
  postsCount: number;
}

export interface Influencer {
  id: string;
  fullName: string;
  displayName?: string;
  bio?: string;
  email: string;
  phone?: string;
  socialMediaHandles: SocialMediaHandles;
  primaryPlatform: Platform;
  contentCategories: ContentCategory[];
  audienceMetrics: AudienceMetrics;
  rates: Rates;
  location?: string;
  languages: string[];
  verified: boolean;
  qualityScore: number;
  performanceHistory?: PerformanceHistory[];
  status: InfluencerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InfluencerListResponse {
  success: boolean;
  data: Influencer[];
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface InfluencerResponse {
  success: boolean;
  data: Influencer;
}

export interface CreateInfluencerRequest {
  fullName: string;
  displayName?: string;
  bio?: string;
  email: string;
  phone?: string;
  socialMediaHandles: SocialMediaHandles;
  primaryPlatform: Platform;
  contentCategories: ContentCategory[];
  audienceMetrics: AudienceMetrics;
  rates: Rates;
  location?: string;
  languages: string[];
  verified?: boolean;
  qualityScore?: number;
  status?: InfluencerStatus;
}

export interface UpdateInfluencerRequest extends Partial<CreateInfluencerRequest> {}

export interface AdvancedSearchParams {
  platform?: Platform;
  categories?: ContentCategory[];
  minFollowers?: number;
  maxFollowers?: number;
  minEngagementRate?: number;
  maxEngagementRate?: number;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minQualityScore?: number;
  verified?: boolean;
  languages?: string[];
}

export interface AdvancedSearchResponse {
  success: boolean;
  data: Influencer[];
  total: number;
}

export interface CampaignMatch {
  influencer: Influencer;
  matchScore: number;
  reasons: string[];
}

export interface CampaignMatchResponse {
  success: boolean;
  data: CampaignMatch[];
}

export interface SimilarInfluencersResponse {
  success: boolean;
  data: Influencer[];
}

export interface CompareInfluencersRequest {
  influencerIds: string[];
}

export interface CompareInfluencersResponse {
  success: boolean;
  data: Influencer[];
}
