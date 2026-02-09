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

/** Parse audienceMetrics JSON string into AudienceMetrics object.
 *  Backend stores metrics per-platform, e.g. { instagram: { followers, engagement_rate, avg_likes } }.
 *  This flattens them using the influencer's primary platform (or first available). */
export function parseAudienceMetrics(influencer: Influencer): AudienceMetrics {
  const defaultMetrics: AudienceMetrics = { followers: 0, engagementRate: 0, avgViews: 0 };
  const raw = safeJsonParse<Record<string, any>>(influencer.audienceMetrics, {});

  // If already flat (has top-level followers), use directly
  if (typeof raw.followers === 'number') {
    return {
      followers: raw.followers || 0,
      engagementRate: raw.engagementRate || raw.engagement_rate || 0,
      avgViews: raw.avgViews || raw.avg_views || 0,
      avgLikes: raw.avgLikes || raw.avg_likes,
      avgComments: raw.avgComments || raw.avg_comments,
      avgShares: raw.avgShares || raw.avg_shares,
    };
  }

  // Nested per-platform: pick primary platform or first available
  const platformKey = influencer.primaryPlatform || Object.keys(raw)[0];
  const platformData = raw[platformKey] || {};

  // Sum followers across all platforms for total
  let totalFollowers = 0;
  for (const key of Object.keys(raw)) {
    const p = raw[key];
    if (p && typeof p === 'object') {
      totalFollowers += p.followers || p.subscribers || 0;
    }
  }

  return {
    followers: totalFollowers || platformData.followers || platformData.subscribers || 0,
    engagementRate: platformData.engagement_rate || platformData.engagementRate || 0,
    avgViews: platformData.avg_views || platformData.avgViews || 0,
    avgLikes: platformData.avg_likes || platformData.avgLikes,
    avgComments: platformData.avg_comments || platformData.avgComments,
    avgShares: platformData.avg_shares || platformData.avgShares,
  };
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
