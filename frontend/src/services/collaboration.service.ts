import { apiClient } from '@/lib/api-client';
import { BaseService } from './base.service';
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

class CollaborationService extends BaseService<Collaboration> {
  constructor() {
    super('/collaborations');
  }

  // Extend getAll with typed response
  async getAll(params?: {
    page?: number;
    perPage?: number;
    campaignId?: string;
    influencerId?: string;
    status?: string;
  }): Promise<CollaborationListResponse> {
    return super.getAll(params) as Promise<CollaborationListResponse>;
  }

  // Extend getById with typed response
  async getById(id: string): Promise<CollaborationResponse> {
    return super.getById(id) as Promise<CollaborationResponse>;
  }

  // Extend create with typed request/response
  async create(data: CreateCollaborationRequest): Promise<CollaborationResponse> {
    return super.create(data) as Promise<CollaborationResponse>;
  }

  // Extend update with typed request/response
  async update(id: string, data: UpdateCollaborationRequest): Promise<CollaborationResponse> {
    return super.update(id, data) as Promise<CollaborationResponse>;
  }

  // Collaboration-specific lifecycle methods
  async accept(id: string): Promise<CollaborationResponse> {
    const response = await apiClient.post<CollaborationResponse>(`${this.endpoint}/${id}/accept`);
    return response.data;
  }

  async decline(id: string): Promise<CollaborationResponse> {
    const response = await apiClient.post<CollaborationResponse>(`${this.endpoint}/${id}/decline`);
    return response.data;
  }

  async start(id: string): Promise<CollaborationResponse> {
    const response = await apiClient.post<CollaborationResponse>(`${this.endpoint}/${id}/start`);
    return response.data;
  }

  async complete(id: string): Promise<CollaborationResponse> {
    const response = await apiClient.post<CollaborationResponse>(`${this.endpoint}/${id}/complete`);
    return response.data;
  }

  async cancel(id: string): Promise<CollaborationResponse> {
    const response = await apiClient.post<CollaborationResponse>(`${this.endpoint}/${id}/cancel`);
    return response.data;
  }

  async bulkInvite(data: BulkInviteRequest): Promise<{ success: boolean; data: Collaboration[] }> {
    const response = await apiClient.post<{ success: boolean; data: Collaboration[] }>(
      `${this.endpoint}/invite-bulk`,
      data
    );
    return response.data;
  }

  async submitDeliverable(id: string, data: SubmitDeliverableRequest): Promise<CollaborationResponse> {
    const response = await apiClient.post<CollaborationResponse>(
      `${this.endpoint}/${id}/deliverables/submit`,
      data
    );
    return response.data;
  }

  async reviewDeliverable(id: string, data: ReviewDeliverableRequest): Promise<CollaborationResponse> {
    const response = await apiClient.post<CollaborationResponse>(
      `${this.endpoint}/${id}/deliverables/review`,
      data
    );
    return response.data;
  }

  async approveDeliverable(id: string, deliverableId: string, feedback?: string): Promise<CollaborationResponse> {
    const response = await apiClient.post<CollaborationResponse>(
      `${this.endpoint}/${id}/deliverables/approve`,
      { deliverableId, feedback }
    );
    return response.data;
  }

  async rejectDeliverable(id: string, deliverableId: string, feedback?: string): Promise<CollaborationResponse> {
    const response = await apiClient.post<CollaborationResponse>(
      `${this.endpoint}/${id}/deliverables/reject`,
      { deliverableId, feedback }
    );
    return response.data;
  }

  async updatePayment(
    id: string,
    paymentStatus: string
  ): Promise<CollaborationResponse> {
    const response = await apiClient.put<CollaborationResponse>(
      `${this.endpoint}/${id}/payment`,
      { paymentStatus }
    );
    return response.data;
  }

  async getAnalytics(id: string): Promise<CollaborationAnalyticsResponse> {
    const response = await apiClient.get<CollaborationAnalyticsResponse>(
      `${this.endpoint}/${id}/analytics`
    );
    return response.data;
  }

  async addNote(id: string, data: AddNoteRequest): Promise<{ success: boolean; data: Note }> {
    const response = await apiClient.post<{ success: boolean; data: Note }>(
      `${this.endpoint}/${id}/notes`,
      data
    );
    return response.data;
  }

  async getNotes(id: string): Promise<{ success: boolean; data: Note[] }> {
    const response = await apiClient.get<{ success: boolean; data: Note[] }>(
      `${this.endpoint}/${id}/notes`
    );
    return response.data;
  }
}

export const collaborationService = new CollaborationService();
