// T076: Finance Service — campaign budget tracking, invoicing, global finance
import { apiClient } from '@/lib/api-client';

export interface BudgetTracker {
  campaignId: string;
  displayId: string;
  budget: number;
  managementFee: number;
  managementFeeAmount: number;
  netBudget: number;
  committed: number;
  spent: number;
  remaining: number;
  utilizationPercent: number;
  breakdown: {
    influencerCosts: { committed: number; paid: number };
    clientInvoices: { total: number; sent: number; approved: number; paid: number };
    influencerInvoices: { total: number; sent: number; approved: number; paid: number };
  };
  lastRevision: BudgetRevision | null;
}

export interface BudgetRevision {
  id: string;
  previousBudget: number;
  newBudget: number;
  changedBy: string;
  changedByName?: string;
  reason: string | null;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  displayId: string;
  type: 'client' | 'influencer';
  status: 'draft' | 'sent' | 'approved' | 'paid';
  amount: number;
  currency: string;
  dueDate: string | null;
  notes: string | null;
  sentAt: string | null;
  paidAt: string | null;
  campaignId: string;
  campaign?: { id: string; displayId: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface FinanceOverview {
  totalRevenue: number;
  pendingReceivables: number;
  pendingPayables: number;
  activeCampaigns: number;
  totalManagementFees: number;
  byStatus: Record<string, { count: number; total: number }>;
}

export interface CreateInvoiceData {
  type: 'client' | 'influencer';
  amount: number;
  currency?: string;
  dueDate?: string;
  notes?: string;
  fileUrl?: string;
}

class FinanceService {
  // ─── Campaign Invoice CRUD ───────────────────────────────────────────────

  async createInvoice(campaignId: string, data: CreateInvoiceData) {
    const response = await apiClient.post<{ success: boolean; data: InvoiceItem }>(
      `/campaigns/${campaignId}/invoices`,
      data
    );
    return response.data;
  }

  async getInvoices(campaignId: string, params?: { type?: string; status?: string }) {
    const response = await apiClient.get<{ success: boolean; data: { invoices: InvoiceItem[]; count: number } }>(
      `/campaigns/${campaignId}/invoices`,
      { params }
    );
    return response.data;
  }

  async updateInvoiceStatus(campaignId: string, invoiceId: string, status: string) {
    const response = await apiClient.patch<{ success: boolean; data: any }>(
      `/campaigns/${campaignId}/invoices/${invoiceId}/status`,
      { status }
    );
    return response.data;
  }

  // ─── Budget Tracking ─────────────────────────────────────────────────────

  async getBudget(campaignId: string) {
    const response = await apiClient.get<{ success: boolean; data: BudgetTracker }>(
      `/campaigns/${campaignId}/budget`
    );
    return response.data;
  }

  async getBudgetRevisions(campaignId: string) {
    const response = await apiClient.get<{ success: boolean; data: { revisions: BudgetRevision[]; count: number } }>(
      `/campaigns/${campaignId}/budget/revisions`
    );
    return response.data;
  }

  // ─── Global Finance ──────────────────────────────────────────────────────

  async getFinanceOverview() {
    const response = await apiClient.get<{ success: boolean; data: FinanceOverview }>(
      '/finance/overview'
    );
    return response.data;
  }

  async getAllInvoices(filters?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
    campaignId?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        invoices: InvoiceItem[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    }>('/finance/invoices', { params: filters });
    return response.data;
  }
}

export const financeService = new FinanceService();
