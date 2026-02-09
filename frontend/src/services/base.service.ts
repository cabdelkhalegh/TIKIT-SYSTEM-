/**
 * Base Service Class
 * Provides generic CRUD operations for API resources
 */

import { apiClient } from '@/lib/api-client';

/**
 * Generic response types
 */
export interface BaseListResponse<T> {
  success: boolean;
  data: T[];
  count: number;
}

export interface BaseItemResponse<T> {
  success: boolean;
  data: T;
}

export interface BaseDeleteResponse {
  success: boolean;
  message?: string;
}

/**
 * Base service class for CRUD operations
 */
export class BaseService<T> {
  protected endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  /**
   * Get all entities with optional query parameters
   */
  async getAll(params?: Record<string, any>): Promise<BaseListResponse<T>> {
    const response = await apiClient.get<BaseListResponse<T>>(this.endpoint, { params });
    return response.data;
  }

  /**
   * Get a single entity by ID
   */
  async getById(id: string): Promise<BaseItemResponse<T>> {
    const response = await apiClient.get<BaseItemResponse<T>>(`${this.endpoint}/${id}`);
    return response.data;
  }

  /**
   * Create a new entity
   */
  async create(data: Record<string, any>): Promise<BaseItemResponse<T>> {
    const response = await apiClient.post<BaseItemResponse<T>>(this.endpoint, data);
    return response.data;
  }

  /**
   * Update an existing entity
   */
  async update(id: string, data: Record<string, any>): Promise<BaseItemResponse<T>> {
    const response = await apiClient.put<BaseItemResponse<T>>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  /**
   * Delete an entity
   */
  async delete(id: string): Promise<BaseDeleteResponse> {
    const response = await apiClient.delete<BaseDeleteResponse>(`${this.endpoint}/${id}`);
    return response.data;
  }
}
