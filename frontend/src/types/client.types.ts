export interface Client {
  id: string;
  companyLegalName: string;
  brandName: string;
  industry?: string;
  websiteUrl?: string;
  primaryContacts: Contact[];
  billingContacts: Contact[];
  communicationPreferences: CommunicationPreference[];
  spendTotals?: number;
  performanceTrends?: string;
  createdAt: string;
  updatedAt: string;
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
  id: string;
  title: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  budget: number;
  startDate?: string;
  endDate?: string;
}

export interface ClientListResponse {
  success: boolean;
  data: Client[];
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
  companyLegalName: string;
  brandName: string;
  industry?: string;
  websiteUrl?: string;
  primaryContacts: Contact[];
  billingContacts?: Contact[];
  communicationPreferences?: CommunicationPreference[];
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {}
