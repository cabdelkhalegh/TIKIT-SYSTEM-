'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { contentService, type PendingContentItem } from '@/services/content.service';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, Clock, XCircle, FileText, Film, Video,
  Loader2, ChevronLeft, ChevronRight, Filter,
} from 'lucide-react';
import { toast } from 'sonner';

type StatusFilter = 'pending' | 'internal_approved' | 'changes_requested' | 'all';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  internal_approved: { label: 'Internal Approved', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  changes_requested: { label: 'Changes Requested', color: 'bg-red-100 text-red-800', icon: XCircle },
  client_approved: { label: 'Client Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
};

const TYPE_ICONS: Record<string, any> = {
  script: FileText,
  draft: Film,
  video_draft: Film,
  final: Video,
};

export default function ContentApprovalPage() {
  const router = useRouter();
  const { isDirector, isCampaignManager, isInternalUser, roles } = useRoleAccess();
  const userRole = roles[0] || 'campaign_manager';

  const [content, setContent] = useState<PendingContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter !== 'all') params.approvalStatus = statusFilter;
      const response = await contentService.getPendingContent(params);
      if (response.success) {
        setContent(response.data.content || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotal(response.data.pagination?.total || 0);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load pending content');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // ─── Quick-Approve Actions ───────────────────────────────────────────────

  const handleApproveInternal = async (item: PendingContentItem) => {
    if (!item.campaign) return;
    setActionLoading(item.id);
    try {
      await contentService.approveInternal(item.campaign.id, item.id);
      toast.success('Content approved internally');
      fetchContent();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveClient = async (item: PendingContentItem) => {
    if (!item.campaign) return;
    setActionLoading(item.id);
    try {
      await contentService.approveClient(item.campaign.id, item.id);
      toast.success('Content approved by client');
      fetchContent();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  if (!isInternalUser) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              You do not have permission to view this page.
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Content Approvals</h1>
            <p className="text-sm text-gray-500 mt-1">
              Review and approve content across all campaigns ({total} items)
            </p>
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          {(
            [
              { key: 'pending', label: 'Pending' },
              { key: 'internal_approved', label: 'Internal Approved' },
              { key: 'changes_requested', label: 'Changes Requested' },
              { key: 'all', label: 'All' },
            ] as { key: StatusFilter; label: string }[]
          ).map(({ key, label }) => (
            <Button
              key={key}
              variant={statusFilter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setStatusFilter(key); setPage(1); }}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Error state */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-3 text-sm text-red-600">{error}</CardContent>
          </Card>
        )}

        {/* Content table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : content.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <CheckCircle className="h-8 w-8 mb-2" />
                <p className="text-sm">No content items matching this filter</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Influencer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {content.map((item) => {
                    const config = STATUS_CONFIG[item.approvalStatus] || STATUS_CONFIG.pending;
                    const StatusIcon = config.icon;
                    const TypeIcon = TYPE_ICONS[item.type] || FileText;
                    const isActioning = actionLoading === item.id;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">
                              {item.campaign?.name || '—'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.campaign?.displayId}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{item.influencer?.handle || '—'}</p>
                            <p className="text-xs text-gray-500">{item.influencer?.displayId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm capitalize">
                            <TypeIcon className="h-3.5 w-3.5 text-gray-400" />
                            {item.type?.replace('_', ' ')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${config.color} text-xs`}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {item.approvalStatus === 'pending' && (isDirector || isCampaignManager) && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isActioning}
                                onClick={() => handleApproveInternal(item)}
                              >
                                {isActioning ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="mr-1 h-3 w-3" /> Approve
                                  </>
                                )}
                              </Button>
                            )}
                            {item.approvalStatus === 'internal_approved' && (isDirector || isCampaignManager) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-300 text-green-700 hover:bg-green-50"
                                disabled={isActioning}
                                onClick={() => handleApproveClient(item)}
                              >
                                {isActioning ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="mr-1 h-3 w-3" /> Client Approve
                                  </>
                                )}
                              </Button>
                            )}
                            {item.campaign && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => router.push(`/dashboard/campaigns/${item.campaign!.id}`)}
                              >
                                View
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
