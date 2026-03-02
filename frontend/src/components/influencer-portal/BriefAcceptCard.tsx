'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { influencerPortalService } from '@/services/influencer-portal.service';

interface BriefAcceptCardProps {
  campaignId: string;
  brief: {
    objectives: string | null;
    deliverables: string | null;
    keyMessages: string | null;
    targetAudience: string | null;
  } | null;
  assignment: {
    id: string;
    status: string;
    briefAccepted: boolean;
    briefAcceptedAt: string | null;
    agreedDeliverables: string | null;
  };
  endDate: string | null;
}

export default function BriefAcceptCard({ campaignId, brief, assignment, endDate }: BriefAcceptCardProps) {
  const queryClient = useQueryClient();
  const [accepted, setAccepted] = useState(assignment.briefAccepted);

  const acceptMutation = useMutation({
    mutationFn: () => influencerPortalService.acceptBrief(campaignId),
    onSuccess: () => {
      setAccepted(true);
      queryClient.invalidateQueries({ queryKey: ['influencer-portal'] });
    },
  });

  const canAccept = !accepted &&
    (assignment.status === 'contracted' || assignment.status === 'approved');

  const daysUntilDeadline = endDate
    ? Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-purple-600" />
            Campaign Brief
          </CardTitle>
          {accepted ? (
            <Badge className="bg-green-100 text-green-800">Accepted</Badge>
          ) : canAccept ? (
            <Badge className="bg-amber-100 text-amber-800">Needs Acceptance</Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-700">{assignment.status.replace(/_/g, ' ')}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {brief ? (
          <>
            {brief.objectives && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Objectives</p>
                <p className="text-sm text-gray-900">{brief.objectives}</p>
              </div>
            )}
            {brief.deliverables && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Deliverables</p>
                <p className="text-sm text-gray-900">{brief.deliverables}</p>
              </div>
            )}
            {brief.keyMessages && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Key Messages</p>
                <p className="text-sm text-gray-900">{brief.keyMessages}</p>
              </div>
            )}
            {brief.targetAudience && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Target Audience</p>
                <p className="text-sm text-gray-900">{brief.targetAudience}</p>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500">Brief details not yet available.</p>
        )}

        {assignment.agreedDeliverables && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Your Deliverables</p>
            <p className="text-sm text-gray-900">{assignment.agreedDeliverables}</p>
          </div>
        )}

        {daysUntilDeadline !== null && daysUntilDeadline > 0 && (
          <div className="text-xs text-gray-500">
            Campaign deadline: {daysUntilDeadline} day{daysUntilDeadline !== 1 ? 's' : ''} remaining
          </div>
        )}

        {/* Accept Button */}
        {canAccept && (
          <Button
            onClick={() => acceptMutation.mutate()}
            disabled={acceptMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {acceptMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Accepting...</>
            ) : (
              <><CheckCircle2 className="h-4 w-4 mr-2" /> Accept Brief</>
            )}
          </Button>
        )}

        {acceptMutation.isError && (
          <p className="text-sm text-red-600">
            {(acceptMutation.error as any)?.response?.data?.error || 'Failed to accept brief'}
          </p>
        )}

        {accepted && assignment.briefAcceptedAt && (
          <p className="text-xs text-green-600">
            Accepted on {new Date(assignment.briefAcceptedAt).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
