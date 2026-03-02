// T112: Closure Service — getClosureStatus, saveCXSurvey, savePostMortem, generateLearnings, closeCampaign
import { apiClient } from '@/lib/api-client';

export interface ClosureChecklist {
  reportApproved: boolean;
  allInvoicesSettled: boolean;
  cxSurveyCompleted: boolean;
  postMortemCompleted: boolean;
  aiLearningsGenerated: boolean;
}

export interface ClosureStatus {
  campaignId: string;
  status: string;
  checklist: ClosureChecklist;
  canClose: boolean;
  unmetRequirements: string[];
}

export interface CXSurveyData {
  overallScore: number;
  communicationScore: number;
  qualityScore: number;
  timelinessScore: number;
  valueScore: number;
  testimonial?: string;
}

export interface PostMortemData {
  wentWell: string[];
  improvements: string[];
  lessons: string[];
  actionItems: string[];
  riskNotes?: string;
}

export interface AILearnings {
  learnings: string[];
  bestPractices: string[];
  intelligenceDocument: string;
}

class ClosureService {
  async getClosureStatus(campaignId: string) {
    const response = await apiClient.get<{ success: boolean; data: ClosureStatus }>(
      `/campaigns/${campaignId}/closure`
    );
    return response.data;
  }

  async saveCXSurvey(campaignId: string, data: CXSurveyData) {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      `/campaigns/${campaignId}/closure/cx-survey`,
      data
    );
    return response.data;
  }

  async savePostMortem(campaignId: string, data: PostMortemData) {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      `/campaigns/${campaignId}/closure/post-mortem`,
      data
    );
    return response.data;
  }

  async generateLearnings(campaignId: string) {
    const response = await apiClient.post<{ success: boolean; data: AILearnings }>(
      `/campaigns/${campaignId}/closure/ai-learnings`,
      {}
    );
    return response.data;
  }

  async closeCampaign(campaignId: string) {
    const response = await apiClient.post<{
      success: boolean;
      data: { campaignId: string; status: string; closedAt: string; retentionExpiresAt: string };
    }>(`/campaigns/${campaignId}/closure/close`, {});
    return response.data;
  }
}

export const closureService = new ClosureService();
