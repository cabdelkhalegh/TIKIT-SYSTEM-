// T106: Report Service — createReport, getReport, transitionStatus, exportPdf, exportCsv, getShareLink, getAllReports
import { apiClient } from '@/lib/api-client';

export interface ReportKPISummary {
  totalReach: number;
  totalImpressions: number;
  totalEngagement: number;
  totalClicks: number;
  averageEngagementRate: number;
  influencerCount: number;
  byInfluencer?: Array<{
    handle: string | null;
    reach: number;
    impressions: number;
    engagement: number;
    clicks: number;
  }>;
}

export interface ReportItem {
  id: string;
  campaignId: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'exported';
  kpiSummary: ReportKPISummary | null;
  highlights: string[];
  recommendations: string[];
  aiNarrative: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  exportedAt: string | null;
  shareableUrl: string | null;
  createdAt: string;
  updatedAt: string;
  campaign?: {
    displayId: string;
    campaignName: string;
    client?: { companyName: string };
    startDate?: string;
    endDate?: string;
    status?: string;
  };
}

export interface CreateReportData {
  highlights?: string;
  generateNarrative?: boolean;
}

class ReportService {
  async createReport(campaignId: string, data?: CreateReportData) {
    const response = await apiClient.post<{ success: boolean; data: ReportItem }>(
      `/campaigns/${campaignId}/reports`,
      data || {}
    );
    return response.data;
  }

  async getReports(campaignId: string) {
    const response = await apiClient.get<{ success: boolean; data: ReportItem[] }>(
      `/campaigns/${campaignId}/reports`
    );
    return response.data;
  }

  async getReport(campaignId: string, reportId: string) {
    const response = await apiClient.get<{ success: boolean; data: ReportItem }>(
      `/campaigns/${campaignId}/reports/${reportId}`
    );
    return response.data;
  }

  async transitionStatus(campaignId: string, reportId: string, status: string) {
    const response = await apiClient.patch<{ success: boolean; data: any }>(
      `/campaigns/${campaignId}/reports/${reportId}/status`,
      { status }
    );
    return response.data;
  }

  async exportPdf(campaignId: string, reportId: string) {
    const response = await apiClient.get<{ success: boolean; data: any }>(
      `/campaigns/${campaignId}/reports/${reportId}/export/pdf`
    );
    return response.data;
  }

  async exportCsv(campaignId: string, reportId: string) {
    const response = await apiClient.get(
      `/campaigns/${campaignId}/reports/${reportId}/export/csv`,
      { responseType: 'text' }
    );
    return response.data;
  }

  async getShareLink(campaignId: string, reportId: string) {
    const response = await apiClient.get<{ success: boolean; data: { id: string; shareableUrl: string } }>(
      `/campaigns/${campaignId}/reports/${reportId}/share`
    );
    return response.data;
  }

  async getAllReports(filters?: {
    status?: string;
    campaignId?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        reports: ReportItem[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    }>('/reports', { params: filters });
    return response.data;
  }
}

export const reportService = new ReportService();
