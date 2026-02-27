'use client';

// T077: FinanceTab — budget tracker, management fee, invoices, revision history
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign, Plus, ChevronDown, ChevronUp, Loader2, Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { financeService } from '@/services/finance.service';
import type { BudgetTracker, InvoiceItem, BudgetRevision } from '@/services/finance.service';
import { toast } from 'sonner';

interface FinanceTabProps {
  campaignId: string;
  campaign: any;
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  paid: 'bg-purple-100 text-purple-800',
};

const NEXT_STATUS: Record<string, string> = {
  draft: 'sent',
  sent: 'approved',
  approved: 'paid',
};

function formatAED(amount: number): string {
  return `AED ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function FinanceTab({ campaignId, campaign }: FinanceTabProps) {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [formData, setFormData] = useState({
    type: 'client' as 'client' | 'influencer',
    amount: '',
    description: '',
    dueDate: '',
  });

  // ─── Queries ────────────────────────────────────────────────────────────

  const { data: budgetData, isLoading: budgetLoading } = useQuery({
    queryKey: ['campaign-budget', campaignId],
    queryFn: () => financeService.getBudget(campaignId),
    staleTime: 15000,
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['campaign-invoices', campaignId],
    queryFn: () => financeService.getInvoices(campaignId),
    staleTime: 15000,
  });

  const { data: revisionsData } = useQuery({
    queryKey: ['campaign-budget-revisions', campaignId],
    queryFn: () => financeService.getBudgetRevisions(campaignId),
    enabled: showRevisions,
  });

  const budget: BudgetTracker | null = budgetData?.data || null;
  const invoices: InvoiceItem[] = invoicesData?.data?.invoices || [];
  const revisions: BudgetRevision[] = revisionsData?.data?.revisions || [];

  // ─── Mutations ──────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: { type: 'client' | 'influencer'; amount: number; notes?: string; dueDate?: string }) =>
      financeService.createInvoice(campaignId, data),
    onSuccess: () => {
      toast.success('Invoice created');
      queryClient.invalidateQueries({ queryKey: ['campaign-invoices', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-budget', campaignId] });
      setShowCreateForm(false);
      setFormData({ type: 'client', amount: '', description: '', dueDate: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create invoice'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ invoiceId, status }: { invoiceId: string; status: string }) =>
      financeService.updateInvoiceStatus(campaignId, invoiceId, status),
    onSuccess: (data) => {
      toast.success(`Invoice moved to ${data.data?.newStatus || 'next status'}`);
      queryClient.invalidateQueries({ queryKey: ['campaign-invoices', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-budget', campaignId] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update status'),
  });

  const handleCreate = () => {
    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      toast.error('Amount must be a positive number');
      return;
    }
    createMutation.mutate({
      type: formData.type,
      amount,
      notes: formData.description || undefined,
      dueDate: formData.dueDate || undefined,
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  if (budgetLoading || invoicesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Tracker Bar */}
      {budget && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Budget Tracker
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Total Budget</p>
                <p className="text-lg font-bold">{formatAED(budget.budget)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Committed</p>
                <p className="text-lg font-bold text-green-700">{formatAED(budget.committed)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Spent</p>
                <p className="text-lg font-bold text-amber-700">{formatAED(budget.spent)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Available</p>
                <p className="text-lg font-bold text-blue-700">{formatAED(budget.remaining)}</p>
              </div>
            </div>

            {/* Progress bar */}
            {budget.netBudget > 0 && (
              <div className="space-y-1">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden flex">
                  {/* Spent (amber) */}
                  <div
                    className="bg-amber-500 h-3 transition-all"
                    style={{ width: `${Math.min((budget.spent / budget.netBudget) * 100, 100)}%` }}
                  />
                  {/* Committed but not yet paid (green) */}
                  <div
                    className="bg-green-500 h-3 transition-all"
                    style={{ width: `${Math.min(((budget.committed - budget.spent) / budget.netBudget) * 100, 100)}%` }}
                  />
                  {/* Available (blue) — implicit from remaining bar width */}
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Spent
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Committed
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-200 inline-block" /> Available
                  </span>
                </div>
              </div>
            )}

            {/* Management fee */}
            <div className="flex items-center gap-2 pt-2 border-t text-sm text-gray-600">
              <span>Management Fee:</span>
              <span className="font-semibold">{budget.managementFee}%</span>
              <span className="text-gray-400">|</span>
              <span className="font-semibold">{formatAED(budget.managementFeeAmount)}</span>
              <span className="text-gray-400">|</span>
              <span>Net Budget: <span className="font-semibold">{formatAED(budget.netBudget)}</span></span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <Button size="sm" onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="h-4 w-4 mr-1" /> Create Invoice
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Create invoice form */}
          {showCreateForm && (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="inv-type" className="text-xs">Type</Label>
                  <select
                    id="inv-type"
                    className="w-full rounded-md border border-gray-300 p-2 text-sm mt-1"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'client' | 'influencer' })}
                  >
                    <option value="client">Client Invoice</option>
                    <option value="influencer">Influencer Payment</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="inv-amount" className="text-xs">Amount (AED)</Label>
                  <Input
                    id="inv-amount"
                    type="number"
                    placeholder="0"
                    className="mt-1"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="inv-desc" className="text-xs">Description</Label>
                  <Input
                    id="inv-desc"
                    placeholder="Optional description"
                    className="mt-1"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="inv-due" className="text-xs">Due Date</Label>
                  <Input
                    id="inv-due"
                    type="date"
                    className="mt-1"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  Create
                </Button>
              </div>
            </div>
          )}

          {/* Invoice list */}
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <DollarSign className="h-8 w-8 mx-auto mb-2" />
              No invoices yet. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount (AED)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm">
                      {inv.displayId || inv.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge className={inv.type === 'client' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}>
                        {inv.type === 'client' ? 'Client' : 'Influencer'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatAED(inv.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_BADGE[inv.status] || ''}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {NEXT_STATUS[inv.status] && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={statusMutation.isPending}
                          onClick={() => statusMutation.mutate({ invoiceId: inv.id, status: NEXT_STATUS[inv.status] })}
                        >
                          {statusMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            `Mark ${NEXT_STATUS[inv.status]}`
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Budget Revision History */}
      <Card>
        <CardHeader className="pb-3">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setShowRevisions(!showRevisions)}
          >
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" /> Budget Revision History
            </CardTitle>
            {showRevisions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </CardHeader>
        {showRevisions && (
          <CardContent>
            {revisions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No budget revisions recorded.</p>
            ) : (
              <div className="space-y-3">
                {revisions.map((rev) => (
                  <div key={rev.id} className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50">
                    <div className="flex-1 text-sm">
                      <p className="font-medium">
                        {formatAED(rev.previousBudget)} &rarr; {formatAED(rev.newBudget)}
                      </p>
                      {rev.reason && <p className="text-gray-500 mt-1">{rev.reason}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        by {rev.changedByName || 'Unknown'} on {new Date(rev.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge className={
                      rev.newBudget > rev.previousBudget
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }>
                      {rev.newBudget > rev.previousBudget ? '+' : ''}
                      {formatAED(rev.newBudget - rev.previousBudget)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
