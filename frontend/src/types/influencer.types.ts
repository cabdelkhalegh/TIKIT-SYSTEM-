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
  influencerId: string;
  fullName: string;
  displayName?: string;
  bio?: string;
  email: string;
  phone?: string;
  profileImageUrl?: string;
  socialMediaHandles?: string;
  primaryPlatform: Platform;
  contentCategories?: string;
  audienceMetrics?: string;
  ratePerPost?: number;
  ratePerVideo?: number;
  ratePerStory?: number;
  city?: string;
  country?: string;
  isVerified: boolean;
  qualityScore: number;
  performanceHistory?: string;
  availabilityStatus: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Safely parse a JSON string with a fallback default value. */
export function safeJsonParse<T>(value: string | undefined | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/** Parse socialMediaHandles JSON string into SocialMediaHandles object. */
export function parseSocialHandles(influencer: Influencer): SocialMediaHandles {
  return safeJsonParse<SocialMediaHandles>(influencer.socialMediaHandles, {});
}

/** Parse audienceMetrics JSON string into AudienceMetrics object. */
export function parseAudienceMetrics(influencer: Influencer): AudienceMetrics {
  return safeJsonParse<AudienceMetrics>(influencer.audienceMetrics, {
    followers: 0,
    engagementRate: 0,
    avgViews: 0,
  });
}

/** Parse contentCategories JSON string into ContentCategory array. */
export function parseContentCategories(influencer: Influencer): ContentCategory[] {
  return safeJsonParse<ContentCategory[]>(influencer.contentCategories, []);
}

/** Parse performanceHistory JSON string into PerformanceHistory array. */
export function parsePerformanceHistory(influencer: Influencer): PerformanceHistory[] {
  return safeJsonParse<PerformanceHistory[]>(influencer.performanceHistory, []);
}

/** Build a display location string from city and country. */
export function getDisplayLocation(influencer: Influencer): string {
  return [influencer.city, influencer.country].filter(Boolean).join(', ');
}

export interface InfluencerListResponse {
  success: boolean;
  data: Influencer[];
  count: number;
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
  profileImageUrl?: string;
  socialMediaHandles?: string;
  primaryPlatform: Platform;
  contentCategories?: string;
  audienceMetrics?: string;
  ratePerPost?: number;
  ratePerVideo?: number;
  ratePerStory?: number;
  city?: string;
  country?: string;
  isVerified?: boolean;
  qualityScore?: number;
  availabilityStatus?: string;
  internalNotes?: string;
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
