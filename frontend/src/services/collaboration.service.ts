import { apiClient } from '@/lib/api-client';
import type {
  Collaboration,
  CollaborationListResponse,
  CollaborationResponse,
  CreateCollaborationRequest,
  UpdateCollaborationRequest,
  BulkInviteRequest,
  SubmitDeliverableRequest,
  ReviewDeliverableRequest,
  AddNoteRequest,
  CollaborationAnalyticsResponse,
  Note,
} from '@/types/collaboration.types';

export const collaborationService = {
  async getAll(params?: {
    page?: number;
    perPage?: number;
    campaignId?: string;
    influencerId?: string;
    status?: string;
  }): Promise<CollaborationListResponse> {
    const response = await apiClient.get<CollaborationListResponse>('/collaborations', { params });
    return response.data;
  },

  async getById(id: string): Promise<CollaborationResponse> {
    const response = await apiClient.get<CollaborationResponse>(`/collaborations/${id}`);
    return response.data;
  },

  async create(data: CreateCollaborationRequest): Promise<CollaborationResponse> {
    const response = await apiClient.post<CollaborationResponse>('/collaborations', data);
    return response.data;
  },

  async update(id: string, data: UpdateCollaborationRequest): Promise<CollaborationResponse> {
    const response = await apiClient.put<CollaborationResponse>(`/collaborations/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/collaborations/${id}`);
    return response.data;
  },

  async accept(id: string): Promise<CollaborationResponse> {
    const response = await apiClient.post<CollaborationResponse>(`/collaborations/${id}/accept`);
    return response.data;
  },

  async decline(id: string): Promise<CollaborationResponse> {
    const response = await apiClient.post<CollaborationResponse>(`/collaborations/${id}/decline`);
    return response.data;
  },

  async start(id: string): Promise<CollaborationResponse> {
    const response = await apiClient.post<CollaborationResponse>(`/collaborations/${id}/start`);
    return response.data;
  },

  async complete(id: string): Promise<CollaborationResponse> {
    const response = await apiClient.post<CollaborationResponse>(`/collaborations/${id}/complete`);
    return response.data;
  },

  async cancel(id: string): Promise<CollaborationResponse> {
    const response = await apiClient.post<CollaborationResponse>(`/collaborations/${id}/cancel`);
    return response.data;
  },

  async bulkInvite(data: BulkInviteRequest): Promise<{ success: boolean; data: Collaboration[] }> {
    const response = await apiClient.post<{ success: boolean; data: Collaboration[] }>(
      '/collaborations/invite-bulk',
      data
    );
    return response.data;
  },

  async submitDeliverable(id: string, data: SubmitDeliverableRequest): Promise<CollaborationResponse> {
    const response = await apiClient.post<CollaborationResponse>(
      `/collaborations/${id}/deliverables/submit`,
      data
    );
    return response.data;
  },

  async reviewDeliverable(id: string, data: ReviewDeliverableRequest): Promise<CollaborationResponse> {
    const response = await apiClient.post<CollaborationResponse>(
      `/collaborations/${id}/deliverables/review`,
      data
    );
    return response.data;
  },

  async approveDeliverable(id: string, deliverableId: string, feedback?: string): Promise<CollaborationResponse> {
    const response = await apiClient.post<CollaborationResponse>(
      `/collaborations/${id}/deliverables/approve`,
      { deliverableId, feedback }
    );
    return response.data;
  },

  async rejectDeliverable(id: string, deliverableId: string, feedback?: string): Promise<CollaborationResponse> {
    const response = await apiClient.post<CollaborationResponse>(
      `/collaborations/${id}/deliverables/reject`,
      { deliverableId, feedback }
    );
    return response.data;
  },

  async updatePayment(
    id: string,
    paymentStatus: string
  ): Promise<CollaborationResponse> {
    const response = await apiClient.put<CollaborationResponse>(
      `/collaborations/${id}/payment`,
      { paymentStatus }
    );
    return response.data;
  },

  async getAnalytics(id: string): Promise<CollaborationAnalyticsResponse> {
    const response = await apiClient.get<CollaborationAnalyticsResponse>(
      `/collaborations/${id}/analytics`
    );
    return response.data;
  },

  async addNote(id: string, data: AddNoteRequest): Promise<{ success: boolean; data: Note }> {
    const response = await apiClient.post<{ success: boolean; data: Note }>(
      `/collaborations/${id}/notes`,
      data
    );
    return response.data;
  },

  async getNotes(id: string): Promise<{ success: boolean; data: Note[] }> {
    const response = await apiClient.get<{ success: boolean; data: Note[] }>(
      `/collaborations/${id}/notes`
    );
    return response.data;
  },
};
