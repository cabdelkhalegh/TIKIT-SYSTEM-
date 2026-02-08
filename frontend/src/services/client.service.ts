import { BaseService } from './base.service';
import type {
  Client,
  ClientListResponse,
  ClientResponse,
  CreateClientRequest,
  UpdateClientRequest,
} from '@/types/client.types';

class ClientService extends BaseService<Client> {
  constructor() {
    super('/clients');
  }

  // Extend getAll with typed response
  async getAll(params?: {
    page?: number;
    perPage?: number;
    search?: string;
  }): Promise<ClientListResponse> {
    return super.getAll(params) as Promise<ClientListResponse>;
  }

  // Extend getById with typed response
  async getById(id: string): Promise<ClientResponse> {
    return super.getById(id) as Promise<ClientResponse>;
  }

  // Extend create with typed request/response
  async create(data: CreateClientRequest): Promise<ClientResponse> {
    return super.create(data) as Promise<ClientResponse>;
  }

  // Extend update with typed request/response
  async update(id: string, data: UpdateClientRequest): Promise<ClientResponse> {
    return super.update(id, data) as Promise<ClientResponse>;
  }
}

export const clientService = new ClientService();
