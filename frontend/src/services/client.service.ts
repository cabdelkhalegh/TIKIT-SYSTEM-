import { apiClient } from '@/lib/api-client';
import type {
  Client,
  ClientListResponse,
  ClientResponse,
  CreateClientRequest,
  UpdateClientRequest,
} from '@/types/client.types';

export const clientService = {
  async getAll(params?: {
    page?: number;
    perPage?: number;
    search?: string;
  }): Promise<ClientListResponse> {
    const response = await apiClient.get<ClientListResponse>('/clients', { params });
    return response.data;
  },

  async getById(id: string): Promise<ClientResponse> {
    const response = await apiClient.get<ClientResponse>(`/clients/${id}`);
    return response.data;
  },

  async create(data: CreateClientRequest): Promise<ClientResponse> {
    const response = await apiClient.post<ClientResponse>('/clients', data);
    return response.data;
  },

  async update(id: string, data: UpdateClientRequest): Promise<ClientResponse> {
    const response = await apiClient.put<ClientResponse>(`/clients/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/clients/${id}`);
    return response.data;
  },
};
