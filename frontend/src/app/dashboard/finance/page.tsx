'use client';

// T078: Global Finance Page — Director + Finance roles only
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign, TrendingUp, Clock, CreditCard, Loader2, Search,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { financeService } from '@/services/finance.service';
import type { FinanceOverview, InvoiceItem } from '@/services/finance.service';

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  paid: 'bg-purple-100 text-purple-800',
};

function formatAED(amount: number): string {
  return `AED ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function FinancePage() {
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: '',
    page: 1,
  });

  // ─── Queries ────────────────────────────────────────────────────────────

  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['finance-overview'],
    queryFn: () => financeService.getFinanceOverview(),
    staleTime: 30000,
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['finance-invoices', filters],
    queryFn: () =>
      financeService.getAllInvoices({
        page: filters.page,
        limit: 20,
        status: filters.status || undefined,
        type: filters.type || undefined,
        search: filters.search || undefined,
      }),
    staleTime: 15000,
  });

  const overview: FinanceOverview | null = overviewData?.data || null;
  const invoices: InvoiceItem[] = invoicesData?.data?.invoices || [];
  const pagination = invoicesData?.data?.pagination;

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-sm text-gray-500 mt-1">Organization-wide financial overview and invoice management</p>
        </div>

        {/* Stats cards */}
        {overviewLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : overview ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center gap-3 py-5">
                <div className="p-2 rounded-lg bg-green-100">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Revenue</p>
                  <p className="text-lg font-bold">{formatAED(overview.totalRevenue)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-5">
                <div className="p-2 rounded-lg bg-blue-100">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pending Receivables</p>
                  <p className="text-lg font-bold">{formatAED(overview.pendingReceivables)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-5">
                <div className="p-2 rounded-lg bg-orange-100">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pending Payables</p>
                  <p className="text-lg font-bold">{formatAED(overview.pendingPayables)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-5">
                <div className="p-2 rounded-lg bg-purple-100">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Active Campaigns</p>
                  <p className="text-lg font-bold">{overview.activeCampaigns}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Filterable Invoice Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="text-sm font-medium">All Invoices</CardTitle>
              <div className="flex flex-wrap gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    className="pl-8 w-40"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  />
                </div>
                {/* Status filter */}
                <select
                  className="rounded-md border border-gray-300 p-2 text-sm"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                </select>
                {/* Type filter */}
                <select
                  className="rounded-md border border-gray-300 p-2 text-sm"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
                >
                  <option value="">All Types</option>
                  <option value="client">Client</option>
                  <option value="influencer">Influencer</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                <DollarSign className="h-8 w-8 mx-auto mb-2" />
                No invoices found.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount (AED)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-sm">
                          {inv.displayId || inv.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {inv.campaign ? (
                            <span>
                              <span className="font-mono text-xs text-gray-400 mr-1">{inv.campaign.displayId}</span>
                              {inv.campaign.name}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
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
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t mt-4">
                    <p className="text-sm text-gray-500">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} invoices
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
