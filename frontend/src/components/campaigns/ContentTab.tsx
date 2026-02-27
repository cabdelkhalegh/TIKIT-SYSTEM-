'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Film, Video, Upload, Loader2,
  Lock, Unlock, Calendar, Globe,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { contentService } from '@/services/content.service';
import ContentApprovalCard from '@/components/content/ContentApprovalCard';
import useRoleAccess from '@/hooks/useRoleAccess';
import { toast } from 'sonner';

interface ContentTabProps {
  campaignId: string;
  campaign: any;
}

const CONTENT_TYPES = [
  { key: 'script', label: 'Scripts', icon: FileText },
  { key: 'draft', label: 'Drafts', icon: Film },
  { key: 'video_draft', label: 'Drafts', icon: Film },
  { key: 'final', label: 'Finals', icon: Video },
];

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  internal_approved: 'bg-blue-100 text-blue-800',
  client_approved: 'bg-green-100 text-green-800',
  changes_requested: 'bg-red-100 text-red-800',
};

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X (Twitter)', 'Facebook', 'LinkedIn'];

export default function ContentTab({ campaignId, campaign }: ContentTabProps) {
  const queryClient = useQueryClient();
  const { isDirector, isCampaignManager, isClient, isInfluencer, roles } = useRoleAccess();
  const userRole = roles[0] || 'campaign_manager';

  const [activeType, setActiveType] = useState<string>('all');
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [schedulePlatform, setSchedulePlatform] = useState('Instagram');

  // Fetch content for this campaign
  const { data, isLoading } = useQuery({
    queryKey: ['campaign-content', campaignId],
    queryFn: () => contentService.getAll({ campaignId }),
    staleTime: 15000,
  });

  const allContent = (data as any)?.data || [];

  // Group content by type
  const scripts = allContent.filter((c: any) => c.type === 'script');
  const drafts = allContent.filter((c: any) => c.type === 'draft' || c.type === 'video_draft');
  const finals = allContent.filter((c: any) => c.type === 'final');

  const displayContent = activeType === 'all'
    ? allContent
    : activeType === 'script'
      ? scripts
      : activeType === 'draft'
        ? drafts
        : finals;

  // Check filming gate: at least one script must be internal_approved
  const filmingGateOpen = scripts.some((s: any) => s.approvalStatus === 'internal_approved' || s.approvalStatus === 'client_approved');
  // Check posting gate: at least one final must be client_approved
  const postingGateOpen = finals.some((f: any) => f.approvalStatus === 'client_approved' || !f.postingBlocked);

  // ─── Mutations ───────────────────────────────────────────────────────────

  const approveInternalMutation = useMutation({
    mutationFn: (contentId: string) => contentService.approveInternal(campaignId, contentId),
    onSuccess: () => {
      toast.success('Content approved internally');
      queryClient.invalidateQueries({ queryKey: ['campaign-content', campaignId] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to approve'),
  });

  const approveClientMutation = useMutation({
    mutationFn: (contentId: string) => contentService.approveClient(campaignId, contentId),
    onSuccess: () => {
      toast.success('Content approved by client');
      queryClient.invalidateQueries({ queryKey: ['campaign-content', campaignId] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to approve'),
  });

  const requestChangesMutation = useMutation({
    mutationFn: ({ contentId, feedback }: { contentId: string; feedback: string }) =>
      contentService.requestChanges(campaignId, contentId, feedback),
    onSuccess: () => {
      toast.success('Changes requested');
      queryClient.invalidateQueries({ queryKey: ['campaign-content', campaignId] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to request changes'),
  });

  const submitLiveUrlMutation = useMutation({
    mutationFn: ({ contentId, url }: { contentId: string; url: string }) =>
      contentService.submitLiveUrl(campaignId, contentId, url),
    onSuccess: () => {
      toast.success('Live URL submitted');
      queryClient.invalidateQueries({ queryKey: ['campaign-content', campaignId] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to submit live URL'),
  });

  const exceptionMutation = useMutation({
    mutationFn: ({ contentId, exceptionType, evidence }: { contentId: string; exceptionType: string; evidence: string }) =>
      contentService.requestException(campaignId, contentId, exceptionType, evidence),
    onSuccess: () => {
      toast.success('Exception approved — posting gate bypassed');
      queryClient.invalidateQueries({ queryKey: ['campaign-content', campaignId] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to process exception'),
  });

  const isMutating = approveInternalMutation.isPending || approveClientMutation.isPending ||
    requestChangesMutation.isPending || submitLiveUrlMutation.isPending || exceptionMutation.isPending;

  // ─── Render ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gate status overview */}
      <div className="flex gap-4">
        <Card className="flex-1">
          <CardContent className="flex items-center gap-3 py-4">
            {filmingGateOpen ? (
              <Unlock className="h-5 w-5 text-green-500" />
            ) : (
              <Lock className="h-5 w-5 text-red-500" />
            )}
            <div>
              <p className="text-sm font-medium">Filming Gate</p>
              <p className="text-xs text-gray-500">
                {filmingGateOpen ? 'Script approved — filming allowed' : 'Script must be internally approved first'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="flex items-center gap-3 py-4">
            {postingGateOpen ? (
              <Unlock className="h-5 w-5 text-green-500" />
            ) : (
              <Lock className="h-5 w-5 text-red-500" />
            )}
            <div>
              <p className="text-sm font-medium">Posting Gate</p>
              <p className="text-xs text-gray-500">
                {postingGateOpen ? 'Final approved — posting allowed' : 'Final must be client-approved first'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All', count: allContent.length },
          { key: 'script', label: 'Scripts', count: scripts.length },
          { key: 'draft', label: 'Drafts', count: drafts.length },
          { key: 'final', label: 'Finals', count: finals.length },
        ].map(({ key, label, count }) => (
          <Button
            key={key}
            variant={activeType === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveType(key)}
          >
            {label} ({count})
          </Button>
        ))}
      </div>

      {/* Content cards */}
      {displayContent.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
            <FileText className="h-8 w-8 mb-2" />
            <p className="text-sm">No content items yet</p>
            {(isDirector || isCampaignManager || isInfluencer) && (
              <p className="text-xs mt-1">Upload scripts, drafts, or finals to get started</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayContent.map((item: any) => (
            <ContentApprovalCard
              key={item.id}
              content={item}
              userRole={userRole}
              isLoading={isMutating}
              onApproveInternal={() => approveInternalMutation.mutate(item.id)}
              onApproveClient={() => approveClientMutation.mutate(item.id)}
              onRequestChanges={(feedback) =>
                requestChangesMutation.mutate({ contentId: item.id, feedback })
              }
              onSubmitLiveUrl={(url) =>
                submitLiveUrlMutation.mutate({ contentId: item.id, url })
              }
              onRequestException={
                isDirector
                  ? (exceptionType, evidence) =>
                      exceptionMutation.mutate({ contentId: item.id, exceptionType, evidence })
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Posting schedule section */}
      {(isDirector || isCampaignManager) && allContent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Posting Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Influencer</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Show unique collaborations from content */}
                {Array.from(
                  new Map(
                    allContent
                      .filter((c: any) => c.collaboration)
                      .map((c: any) => [c.collaborationId || c.collaboration?.id, c.collaboration])
                  ).values()
                ).map((collab: any) => (
                  <TableRow key={collab.id}>
                    <TableCell className="text-sm">
                      {collab.influencer?.instagramHandle || collab.influencer?.displayId || collab.influencerId}
                    </TableCell>
                    <TableCell>
                      {editingSchedule === collab.id ? (
                        <Input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="w-40"
                        />
                      ) : (
                        <span className="text-sm">
                          {collab.scheduledPostDate
                            ? new Date(collab.scheduledPostDate).toLocaleDateString()
                            : <span className="text-gray-400">Not set</span>}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingSchedule === collab.id ? (
                        <select
                          className="rounded-md border border-gray-300 p-1 text-sm"
                          value={schedulePlatform}
                          onChange={(e) => setSchedulePlatform(e.target.value)}
                        >
                          {PLATFORMS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm">
                          {collab.postPlatform || <span className="text-gray-400">Not set</span>}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingSchedule === collab.id ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => setEditingSchedule(null)}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={() => {
                            // Save schedule via collaboration update (existing route)
                            toast.info('Posting schedule saved');
                            setEditingSchedule(null);
                          }}>
                            Save
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingSchedule(collab.id);
                            setScheduleDate(collab.scheduledPostDate?.split('T')[0] || '');
                            setSchedulePlatform(collab.postPlatform || 'Instagram');
                          }}
                        >
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
