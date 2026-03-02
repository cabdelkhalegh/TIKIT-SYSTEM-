'use client';

// T108: Global reports page — filterable report list across campaigns
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ClipboardList, Filter, Eye, Loader2,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { reportService } from '@/services/report.service';

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  pending_approval: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
  exported: { label: 'Exported', color: 'bg-blue-100 text-blue-800' },
};

function formatNumber(n: number | null | undefined): string {
  if (n == null) return '-';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function ReportsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['all-reports', statusFilter, page],
    queryFn: () =>
      reportService.getAllReports({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit: 20,
      }),
    staleTime: 15000,
  });

  const reports = reportsData?.data?.reports || [];
  const pagination = reportsData?.data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">All campaign reports across the organization</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4 flex items-center gap-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Status:</span>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="exported">Exported</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm text-gray-500 ml-auto">
              {pagination.total} report{pagination.total !== 1 ? 's' : ''} found
            </span>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No reports found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Reach</TableHead>
                    <TableHead className="text-right">Engagement</TableHead>
                    <TableHead className="text-right">Influencers</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {report.campaign?.campaignName || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {report.campaign?.displayId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {report.campaign?.client?.companyName || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_BADGES[report.status]?.color || ''}>
                          {STATUS_BADGES[report.status]?.label || report.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatNumber(report.kpiSummary?.totalReach)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatNumber(report.kpiSummary?.totalEngagement)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {report.kpiSummary?.influencerCount ?? '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/campaigns/${report.campaignId}?tab=reports`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
