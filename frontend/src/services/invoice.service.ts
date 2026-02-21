import { apiClient } from '@/lib/api-client';
import { BaseService } from './base.service';

export interface Invoice {
  id: string;
  invoiceNumber: string | null;
  type: 'client' | 'influencer';
  status: 'draft' | 'sent' | 'approved' | 'paid';
  amount: number;
  dueDate: string | null;
  fileUrl: string | null;
  notes: string | null;
  campaignId: string;
  campaign?: {
    campaignId: string;
    campaignName: string;
    status: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceRequest {
  invoiceNumber?: string;
  type: 'client' | 'influencer';
  amount: number;
  dueDate?: string;
  fileUrl?: string;
  notes?: string;
  campaignId: string;
}

class InvoiceService extends BaseService<Invoice> {
  constructor() {
    super('/invoices');
  }

  async getByCampaign(campaignId: string) {
    const response = await apiClient.get<{ success: boolean; data: Invoice[] }>(
      `${this.endpoint}?campaignId=${campaignId}`
    );
    return response.data;
  }
}

export const invoiceService = new InvoiceService();
