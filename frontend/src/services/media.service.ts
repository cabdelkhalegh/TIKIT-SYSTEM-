import { apiClient } from '@/lib/api-client';
import type { Media, MediaListResponse, MediaUploadResponse } from '@/types/media.types';

export const mediaService = {
  async upload(
    file: File,
    entityType: 'campaign' | 'collaboration',
    entityId: string,
    onProgress?: (progress: number) => void
  ): Promise<Media> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    const response = await apiClient.post<MediaUploadResponse>('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    return response.data.data;
  },

  async getById(id: string): Promise<Media> {
    const response = await apiClient.get<Media>(`/media/${id}`);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/media/${id}`);
  },

  async getByCampaign(campaignId: string): Promise<Media[]> {
    const response = await apiClient.get<MediaListResponse>(`/media/campaign/${campaignId}`);
    return response.data.data;
  },

  async getByCollaboration(collaborationId: string): Promise<Media[]> {
    const response = await apiClient.get<MediaListResponse>(`/media/collaboration/${collaborationId}`);
    return response.data.data;
  },
};
