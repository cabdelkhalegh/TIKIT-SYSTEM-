'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  Users,
  FileText,
  Film,
  BarChart3,
  CheckCircle,
  XCircle,
  Eye,
  TrendingUp,
  MousePointerClick,
  ClipboardCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ShortlistApprovalCard from '@/components/client-portal/ShortlistApprovalCard';
import { clientPortalService } from '@/services/client-portal.service';
import type { ClientCampaignInfluencer } from '@/services/client-portal.service';

const STATUS_BADGE: Record<string, string> = {
  pitching: 'bg-yellow-100 text-yellow-800',
  live: 'bg-green-100 text-green-800',
  reporting: 'bg-blue-100 text-blue-800',
  closed: 'bg-gray-100 text-gray-700',
};

const CONTENT_STATUS_BADGE: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  internal_approved: 'bg-blue-100 text-blue-800',
  client_approved: 'bg-green-100 text-green-800',
  changes_requested: 'bg-amber-100 text-amber-800',
};

const CONTENT_TYPE_BADGE: Record<string, string> = {
  script: 'bg-purple-100 text-purple-800',
  video_draft: 'bg-indigo-100 text-indigo-800',
  final: 'bg-green-100 text-green-800',
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatDate(d: string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ClientPortalCampaignPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const queryClient = useQueryClient();
  const [contentFeedback, setContentFeedback] = useState<Record<string, string>>({});

  const { data: campaignData, isLoading } = useQuery({
    queryKey: ['client-portal-campaign', campaignId],
    queryFn: () => clientPortalService.getCampaign(campaignId),
    enabled: !!campaignId,
  });

  const { data: reportData } = useQuery({
    queryKey: ['client-portal-report', campaignId],
    queryFn: () => clientPortalService.getReport(campaignId),
    enabled: !!campaignId,
  });

  const campaign = campaignData?.data;
  const report = reportData?.data;

  // Mutations
  const approveShortlist = useMutation({
    mutationFn: () => clientPortalService.approveShortlist(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-portal-campaign', campaignId] });
      toast.success('Shortlist approved! Campaign advancing to live.');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to approve shortlist'),
  });

  const rejectShortlist = useMutation({
    mutationFn: (reason: string) => clientPortalService.rejectShortlist(campaignId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-portal-campaign', campaignId] });
      toast.success('Shortlist rejected. Campaign Manager has been notified.');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to reject shortlist'),
  });

  const approveContent = useMutation({
    mutationFn: (contentId: string) => clientPortalService.approveContent(campaignId, contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-portal-campaign', campaignId] });
      toast.success('Content approved');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to approve content'),
  });

  const requestChanges = useMutation({
    mutationFn: ({ contentId, feedback }: { contentId: string; feedback: string }) =>
      clientPortalService.requestContentChanges(campaignId, contentId, feedback),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['client-portal-campaign', campaignId] });
      setContentFeedback((prev) => { const n = { ...prev }; delete n[vars.contentId]; return n; });
      toast.success('Changes requested');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to request changes'),
  });

  const approveReport = useMutation({
    mutationFn: () => clientPortalService.approveReport(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-portal-campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['client-portal-report', campaignId] });
      toast.success('Report approved');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to approve report'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-medium">Campaign not found or access denied</p>
        <Link href="/client-portal" className="text-sm text-red-600 underline mt-2 inline-block">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const showShortlistApproval = campaign.status === 'pitching' &&
    (!campaign.shortlistApproval || campaign.shortlistApproval.status === 'pending');

  // Collect all content items across influencers for review
  const allContent = campaign.influencers.flatMap((inf) =>
    inf.content.map((c) => ({ ...c, influencerHandle: inf.handle || inf.displayName }))
  );
  const reviewableContent = allContent.filter(
    (c) => c.approvalStatus === 'internal_approved' || c.approvalStatus === 'pending'
  );

  return (
    <div className="space-y-6">
      {/* Back link + Campaign header */}
      <div>
        <Link href="/client-portal" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400 font-mono">{campaign.displayId}</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{campaign.name}</h1>
          </div>
          <Badge className={`text-sm px-3 py-1 ${STATUS_BADGE[campaign.status] || 'bg-gray-100 text-gray-700'}`}>
            {campaign.status.replace(/_/g, ' ')}
          </Badge>
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {campaign.influencers.length} creators
          </span>
        </div>
      </div>

      {/* KPI Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-600" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Reach</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {formatNumber(campaign.kpiSummary.totalReach)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Impressions</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {formatNumber(campaign.kpiSummary.totalImpressions)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Engagement</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {formatNumber(campaign.kpiSummary.totalEngagement)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Clicks</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {formatNumber(campaign.kpiSummary.totalClicks)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shortlist Approval (pitching status) */}
      {showShortlistApproval && campaign.influencers.length > 0 && (
        <ShortlistApprovalCard
          campaignId={campaignId}
          influencers={campaign.influencers}
          onApprove={() => approveShortlist.mutate()}
          onReject={(reason) => rejectShortlist.mutate(reason)}
          isApproving={approveShortlist.isPending}
          isRejecting={rejectShortlist.isPending}
        />
      )}

      {/* Influencer Shortlist Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-600" />
            Influencers ({campaign.influencers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {campaign.influencers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No influencers assigned yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-2 font-medium text-gray-500">Creator</th>
                    <th className="pb-2 font-medium text-gray-500">Platform</th>
                    <th className="pb-2 font-medium text-gray-500 text-right">Followers</th>
                    <th className="pb-2 font-medium text-gray-500 text-right">AI Score</th>
                    <th className="pb-2 font-medium text-gray-500 text-right">Reach</th>
                    <th className="pb-2 font-medium text-gray-500 text-right">Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {campaign.influencers.map((inf) => (
                    <tr key={inf.id} className="border-b border-gray-100">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                            {inf.displayName?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-gray-900">{inf.handle || inf.displayName}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="text-xs">{inf.platform}</Badge>
                      </td>
                      <td className="py-3 text-right text-gray-600">{formatNumber(inf.followers || 0)}</td>
                      <td className="py-3 text-right">
                        {inf.aiScore != null ? (
                          <span className="text-purple-600 font-medium">{Math.round(inf.aiScore)}%</span>
                        ) : '-'}
                      </td>
                      <td className="py-3 text-right text-gray-600">{formatNumber(inf.kpis.reach)}</td>
                      <td className="py-3 text-right text-gray-600">{formatNumber(inf.kpis.engagement)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Review Section */}
      {allContent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Film className="h-4 w-4 text-purple-600" />
              Content ({allContent.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allContent.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] ${CONTENT_TYPE_BADGE[item.type] || 'bg-gray-100 text-gray-700'}`}>
                        {item.type.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-sm text-gray-600">by {item.influencerHandle}</span>
                    </div>
                    <Badge className={`text-[10px] ${CONTENT_STATUS_BADGE[item.approvalStatus] || 'bg-gray-100 text-gray-700'}`}>
                      {item.approvalStatus.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  {item.fileName && (
                    <p className="text-xs text-gray-500 mb-2">{item.fileName}</p>
                  )}

                  {item.fileUrl && (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-600 hover:underline mb-2 inline-block"
                    >
                      Preview content
                    </a>
                  )}

                  {/* Actions for reviewable content */}
                  {item.approvalStatus === 'internal_approved' && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          onClick={() => approveContent.mutate(item.id)}
                          disabled={approveContent.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs"
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Approve
                        </Button>
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={contentFeedback[item.id] || ''}
                            onChange={(e) => setContentFeedback((p) => ({ ...p, [item.id]: e.target.value }))}
                            placeholder="Feedback for changes..."
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const fb = contentFeedback[item.id]?.trim();
                              if (!fb) { toast.error('Please provide feedback'); return; }
                              requestChanges.mutate({ contentId: item.id, feedback: fb });
                            }}
                            disabled={requestChanges.isPending}
                            className="border-amber-300 text-amber-700 hover:bg-amber-50 text-xs"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Request Changes
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Section */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-purple-600" />
              Campaign Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={report.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {report.status.replace(/_/g, ' ')}
                </Badge>
                {report.shareableUrl && (
                  <a href={report.shareableUrl} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-purple-600 hover:underline">
                    View full report
                  </a>
                )}
              </div>

              {report.highlights && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Highlights</p>
                  <p className="text-sm text-gray-700">{report.highlights}</p>
                </div>
              )}

              {report.aiNarrative && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Summary</p>
                  <p className="text-sm text-gray-700">{report.aiNarrative}</p>
                </div>
              )}

              {report.status === 'pending_approval' && (
                <div className="pt-3 border-t border-gray-100">
                  <Button
                    onClick={() => approveReport.mutate()}
                    disabled={approveReport.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {approveReport.isPending ? 'Approving...' : 'Approve Report'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
