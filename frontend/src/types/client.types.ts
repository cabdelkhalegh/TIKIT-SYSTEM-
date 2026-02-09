export interface Client {
  clientId: string;
  legalCompanyName: string;
  brandDisplayName: string;
  industryVertical?: string;
  websiteUrl?: string;
  primaryContactEmails: string;
  billingContactEmails: string;
  preferredCommChannels: string;
  totalAdSpend?: number;
  performanceMetricsJson?: string;
  accountCreatedAt: string;
  lastModifiedAt: string;
  campaigns?: Campaign[];
  _count?: {
    campaigns: number;
  };
}

export interface Contact {
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

export interface CommunicationPreference {
  channel: 'email' | 'phone' | 'slack' | 'teams';
  value: string;
  preferred?: boolean;
}

export interface Campaign {
  campaignId: string;
  campaignName: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  totalBudget: number;
  startDate?: string;
  endDate?: string;
}

export interface ClientListResponse {
  success: boolean;
  data: Client[];
  count: number;
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface ClientResponse {
  success: boolean;
  data: Client;
}

export interface CreateClientRequest {
  legalCompanyName: string;
  brandDisplayName: string;
  industryVertical?: string;
  websiteUrl?: string;
  primaryContactEmails: string;
  billingContactEmails?: string;
  preferredCommChannels?: string;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {}
