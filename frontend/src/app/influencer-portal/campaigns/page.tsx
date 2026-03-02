'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { influencerPortalService } from '@/services/influencer-portal.service';

const STATUS_BADGE: Record<string, string> = {
  proposed: 'bg-gray-100 text-gray-700',
  approved: 'bg-blue-100 text-blue-800',
  contracted: 'bg-indigo-100 text-indigo-800',
  brief_accepted: 'bg-purple-100 text-purple-800',
  live: 'bg-green-100 text-green-800',
};

const CAMPAIGN_STATUS_BADGE: Record<string, string> = {
  proposed: 'bg-gray-100 text-gray-700',
  in_review: 'bg-yellow-100 text-yellow-800',
  pitching: 'bg-orange-100 text-orange-800',
  live: 'bg-green-100 text-green-800',
};

export default function InfluencerCampaignsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['influencer-portal-campaigns'],
    queryFn: () => influencerPortalService.getCampaigns(),
    staleTime: 30_000,
  });

  const campaigns = data?.data?.campaigns || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/influencer-portal">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Campaigns</h1>
          <p className="text-gray-500 mt-0.5 text-sm">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} assigned</p>
        </div>
      </div>

      {/* Campaign List */}
      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No campaigns assigned to you yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const needsBriefAcceptance = !campaign.assignment.briefAccepted &&
              (campaign.assignment.status === 'contracted' || campaign.assignment.status === 'approved');

            return (
              <Link key={campaign.id} href={`/influencer-portal/campaigns/${campaign.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer mb-4">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs text-gray-400 font-mono">{campaign.displayId}</p>
                          <Badge className={`text-[10px] ${CAMPAIGN_STATUS_BADGE[campaign.status] || 'bg-gray-100 text-gray-700'}`}>
                            {campaign.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">{campaign.name}</h3>

                        {campaign.startDate && campaign.endDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(campaign.startDate).toLocaleDateString()} — {new Date(campaign.endDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge className={`text-[10px] ${STATUS_BADGE[campaign.assignment.status] || 'bg-gray-100 text-gray-700'}`}>
                          {campaign.assignment.status.replace(/_/g, ' ')}
                        </Badge>
                        {campaign.assignment.agreedCost && (
                          <span className="text-xs text-gray-500">
                            AED {campaign.assignment.agreedCost.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Urgent: Brief Acceptance CTA */}
                    {needsBriefAcceptance && (
                      <div className="flex items-center gap-1.5 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800 font-medium">
                        <AlertTriangle className="h-4 w-4" />
                        Brief needs acceptance — tap to review and accept
                      </div>
                    )}

                    {/* Content Stats */}
                    <div className="flex items-center gap-5 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {campaign.assignment.contentPending} pending
                      </span>
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {campaign.assignment.contentApproved} approved
                      </span>
                      <span>
                        {campaign.assignment.contentSubmitted} total submitted
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
