'use client';

// T107: ReportsTab — create report, display KPI summary + AI narrative, approval flow, export controls
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList, Plus, Loader2, FileText, Download, Link2, Copy,
  CheckCircle, Clock, Send, Eye, BarChart3, Heart, MousePointerClick,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { reportService, type ReportItem } from '@/services/report.service';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { toast } from 'sonner';

interface ReportsTabProps {
  campaignId: string;
  campaign: any;
}

function formatNumber(n: number | null | undefined): string {
  if (n == null) return '-';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  pending_approval: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
  exported: { label: 'Exported', color: 'bg-blue-100 text-blue-800' },
};

export default function ReportsTab({ campaignId, campaign }: ReportsTabProps) {
  const queryClient = useQueryClient();
  const { isDirector, isCampaignManager, isClient } = useRoleAccess();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // ─── Queries ──────────────────────────────────────────────────────────────
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['campaign-reports', campaignId],
    queryFn: () => reportService.getReports(campaignId),
    staleTime: 15000,
  });

  const reports: ReportItem[] = reportsData?.data || [];
  const activeReport = selectedReport
    ? reports.find((r) => r.id === selectedReport) || null
    : reports[0] || null;

  // ─── Mutations ────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () => reportService.createReport(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-reports', campaignId] });
      toast.success('Report created with AI narrative');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create report');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ reportId, status }: { reportId: string; status: string }) =>
      reportService.transitionStatus(campaignId, reportId, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-reports', campaignId] });
      toast.success(`Report status updated to ${data.data.newStatus.replace(/_/g, ' ')}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update status');
    },
  });

  const handleExportPdf = async (reportId: string) => {
    try {
      const result = await reportService.exportPdf(campaignId, reportId);
      // Download as JSON (frontend renders)
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report data exported');
    } catch {
      toast.error('Failed to export PDF data');
    }
  };

  const handleExportCsv = async (reportId: string) => {
    try {
      const csv = await reportService.exportCsv(campaignId, reportId);
      const blob = new Blob([typeof csv === 'string' ? csv : JSON.stringify(csv)], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}-kpis.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  const handleShareLink = async (reportId: string) => {
    try {
      const result = await reportService.getShareLink(campaignId, reportId);
      await navigator.clipboard.writeText(result.data.shareableUrl);
      toast.success('Share link copied to clipboard');
    } catch {
      toast.error('Failed to generate share link');
    }
  };

  // ─── Status action buttons ────────────────────────────────────────────────
  function getNextAction(report: ReportItem) {
    if (report.status === 'draft' && isCampaignManager) {
      return { label: 'Submit for Approval', status: 'pending_approval', icon: Send };
    }
    if (report.status === 'pending_approval' && (isClient || isDirector)) {
      return { label: 'Approve Report', status: 'approved', icon: CheckCircle };
    }
    if (report.status === 'approved' && (isCampaignManager || isDirector)) {
      return { label: 'Mark Exported', status: 'exported', icon: Download };
    }
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Campaign Reports</h3>
        {(isDirector || isCampaignManager) && campaign.status !== 'closed' && (
          <Button
            size="sm"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-1.5" />
            )}
            Create Report
          </Button>
        )}
      </div>

      {reports.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Yet</h3>
          <p className="text-gray-600 mb-4">
            Create a report to aggregate KPIs and generate an AI narrative summary.
          </p>
        </Card>
      ) : (
        <>
          {/* Report selector if multiple */}
          {reports.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {reports.map((r) => (
                <Button
                  key={r.id}
                  variant={activeReport?.id === r.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedReport(r.id)}
                >
                  Report {new Date(r.createdAt).toLocaleDateString()}
                  <Badge className={`ml-2 ${STATUS_BADGES[r.status]?.color || ''}`}>
                    {STATUS_BADGES[r.status]?.label || r.status}
                  </Badge>
                </Button>
              ))}
            </div>
          )}

          {activeReport && (
            <>
              {/* Status + Actions Bar */}
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">Status:</span>
                    <Badge className={STATUS_BADGES[activeReport.status]?.color || ''}>
                      {STATUS_BADGES[activeReport.status]?.label || activeReport.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {(() => {
                      const action = getNextAction(activeReport);
                      if (!action) return null;
                      const Icon = action.icon;
                      return (
                        <Button
                          size="sm"
                          onClick={() =>
                            statusMutation.mutate({
                              reportId: activeReport.id,
                              status: action.status,
                            })
                          }
                          disabled={statusMutation.isPending}
                        >
                          {statusMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          ) : (
                            <Icon className="h-4 w-4 mr-1.5" />
                          )}
                          {action.label}
                        </Button>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* KPI Summary Table */}
              {activeReport.kpiSummary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Total Reach</p>
                          <p className="text-2xl font-bold">
                            {formatNumber(activeReport.kpiSummary.totalReach)}
                          </p>
                        </div>
                        <Eye className="h-8 w-8 text-blue-600 opacity-30" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Total Impressions</p>
                          <p className="text-2xl font-bold">
                            {formatNumber(activeReport.kpiSummary.totalImpressions)}
                          </p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-purple-600 opacity-30" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Total Engagement</p>
                          <p className="text-2xl font-bold">
                            {formatNumber(activeReport.kpiSummary.totalEngagement)}
                          </p>
                        </div>
                        <Heart className="h-8 w-8 text-pink-600 opacity-30" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Avg Engagement Rate</p>
                          <p className="text-2xl font-bold">
                            {activeReport.kpiSummary.averageEngagementRate}%
                          </p>
                        </div>
                        <MousePointerClick className="h-8 w-8 text-green-600 opacity-30" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Per-influencer KPI table */}
              {activeReport.kpiSummary?.byInfluencer &&
                activeReport.kpiSummary.byInfluencer.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Per-Influencer Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Influencer</TableHead>
                            <TableHead className="text-right">Reach</TableHead>
                            <TableHead className="text-right">Impressions</TableHead>
                            <TableHead className="text-right">Engagement</TableHead>
                            <TableHead className="text-right">Clicks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activeReport.kpiSummary.byInfluencer.map((inf, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">
                                {inf.handle || `Influencer ${idx + 1}`}
                              </TableCell>
                              <TableCell className="text-right">{formatNumber(inf.reach)}</TableCell>
                              <TableCell className="text-right">{formatNumber(inf.impressions)}</TableCell>
                              <TableCell className="text-right">{formatNumber(inf.engagement)}</TableCell>
                              <TableCell className="text-right">{formatNumber(inf.clicks)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

              {/* Highlights */}
              {activeReport.highlights && activeReport.highlights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Highlights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {activeReport.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* AI Narrative */}
              {activeReport.aiNarrative && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">AI Narrative Summary</CardTitle>
                      {(isDirector || isCampaignManager) && activeReport.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => createMutation.mutate()}
                          disabled={createMutation.isPending}
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1" />
                          Regenerate
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                      {activeReport.aiNarrative}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {activeReport.recommendations && activeReport.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {activeReport.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Export Controls */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">Export:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportPdf(activeReport.id)}
                    >
                      <FileText className="h-4 w-4 mr-1.5" />
                      PDF Data
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportCsv(activeReport.id)}
                    >
                      <Download className="h-4 w-4 mr-1.5" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShareLink(activeReport.id)}
                    >
                      <Copy className="h-4 w-4 mr-1.5" />
                      Copy Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
