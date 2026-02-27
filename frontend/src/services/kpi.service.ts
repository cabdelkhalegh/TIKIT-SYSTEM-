// T083: KPI Service — manual entry, list, summary, schedules, auto-capture
import { apiClient } from '@/lib/api-client';

export interface KPIEntry {
  id: string;
  campaignInfluencerId: string;
  influencer: {
    id: string;
    displayId: string | null;
    handle: string | null;
    fullName?: string;
  } | null;
  reach: number | null;
  impressions: number | null;
  engagement: number | null;
  clicks: number | null;
  captureDay: number | null;
  source: 'manual' | 'auto';
  createdAt: string;
}

export interface KPISummary {
  campaignId: string;
  summary: {
    totalReach: number;
    totalImpressions: number;
    totalEngagement: number;
    totalClicks: number;
    averageEngagementRate: number;
    influencerCount: number;
    capturedCount: number;
    pendingCount: number;
  };
  byInfluencer: Array<{
    campaignInfluencerId: string;
    handle: string | null;
    displayId: string | null;
    latestCapture: {
      captureDay: number | null;
      reach: number | null;
      impressions: number | null;
      engagement: number | null;
      clicks: number | null;
      source: string;
    };
  }>;
  byCaptureDay: {
    day1: { reach: number; impressions: number; engagement: number; clicks: number };
    day3: { reach: number; impressions: number; engagement: number; clicks: number };
    day7: { reach: number; impressions: number; engagement: number; clicks: number };
  };
}

export interface KPIScheduleEntry {
  id: string;
  campaignInfluencerId: string;
  influencer: { displayId: string | null; handle: string | null } | null;
  captureDay: number;
  scheduledAt: string;
  capturedAt: string | null;
  isFailed: boolean;
}

export interface KPIScheduleStats {
  total: number;
  completed: number;
  pending: number;
  failed: number;
}

export interface AddKPIData {
  campaignInfluencerId: string;
  reach?: number;
  impressions?: number;
  engagement?: number;
  clicks?: number;
  captureDay?: number;
}

class KPIService {
  async addKPI(campaignId: string, data: AddKPIData) {
    const response = await apiClient.post<{ success: boolean; data: KPIEntry }>(
      `/campaigns/${campaignId}/kpis`,
      data
    );
    return response.data;
  }

  async getKPIs(campaignId: string, filters?: {
    campaignInfluencerId?: string;
    captureDay?: number;
    source?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const response = await apiClient.get<{
      success: boolean;
      data: { campaignId: string; kpis: KPIEntry[]; count: number };
    }>(`/campaigns/${campaignId}/kpis`, { params: filters });
    return response.data;
  }

  async getKPISummary(campaignId: string) {
    const response = await apiClient.get<{ success: boolean; data: KPISummary }>(
      `/campaigns/${campaignId}/kpis/summary`
    );
    return response.data;
  }

  async getKPISchedules(campaignId: string) {
    const response = await apiClient.get<{
      success: boolean;
      data: { campaignId: string; schedules: KPIScheduleEntry[]; stats: KPIScheduleStats };
    }>(`/campaigns/${campaignId}/kpis/schedules`);
    return response.data;
  }

  async triggerAutoCapture(campaignId: string, campaignInfluencerId?: string) {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      `/campaigns/${campaignId}/kpis/auto-capture`,
      campaignInfluencerId ? { campaignInfluencerId } : {}
    );
    return response.data;
  }
}

export const kpiService = new KPIService();
