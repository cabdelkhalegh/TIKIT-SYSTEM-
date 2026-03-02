'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Target,
  FileCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { influencerPortalService } from '@/services/influencer-portal.service';

const STATUS_BADGE: Record<string, string> = {
  proposed: 'bg-gray-100 text-gray-700',
  approved: 'bg-blue-100 text-blue-800',
  contracted: 'bg-indigo-100 text-indigo-800',
  brief_accepted: 'bg-purple-100 text-purple-800',
  live: 'bg-green-100 text-green-800',
};

export default function InfluencerPortalDashboard() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['influencer-portal-dashboard'],
    queryFn: () => influencerPortalService.getDashboard(),
    staleTime: 30_000,
  });

  const { data: campaignsData } = useQuery({
    queryKey: ['influencer-portal-campaigns'],
    queryFn: () => influencerPortalService.getCampaigns(),
    staleTime: 30_000,
  });

  const stats = dashboardData?.data?.stats;
  const deadlines = dashboardData?.data?.upcomingDeadlines || [];
  const campaigns = campaignsData?.data?.campaigns || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Creator Dashboard</h1>
        <p className="text-gray-500 mt-1">Your campaigns, briefs, and content at a glance</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeCampaigns ?? 0}</p>
                <p className="text-xs text-gray-500">Active Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <FileCheck className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.briefsToAccept ?? 0}</p>
                <p className="text-xs text-gray-500">Briefs to Accept</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.pendingReview ?? 0}</p>
                <p className="text-xs text-gray-500">Content Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.approvedContent ?? 0}</p>
                <p className="text-xs text-gray-500">Approved Content</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${(stats?.urgentDeadlines ?? 0) > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <AlertTriangle className={`h-5 w-5 ${(stats?.urgentDeadlines ?? 0) > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.urgentDeadlines ?? 0}</p>
                <p className="text-xs text-gray-500">Urgent Deadlines</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines */}
      {deadlines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deadlines.map((d, i) => {
                const daysLeft = Math.ceil(
                  (new Date(d.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                const isUrgent = daysLeft <= 3;
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{d.campaignName}</p>
                      <p className="text-xs text-gray-500">
                        {d.type === 'brief_acceptance' ? 'Brief Acceptance' : 'Content Submission'}
                      </p>
                    </div>
                    <Badge className={isUrgent ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}>
                      {daysLeft <= 0 ? 'Overdue' : `${daysLeft}d left`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign Workflow Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Campaigns</h2>
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No campaigns assigned to you yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign) => (
              <Link key={campaign.id} href={`/influencer-portal/campaigns/${campaign.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-400 font-mono">{campaign.displayId}</p>
                        <h3 className="text-sm font-semibold text-gray-900 truncate mt-0.5">
                          {campaign.name}
                        </h3>
                      </div>
                      <Badge className={`ml-2 text-[10px] ${STATUS_BADGE[campaign.assignment.status] || 'bg-gray-100 text-gray-700'}`}>
                        {campaign.assignment.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    {/* Brief acceptance CTA */}
                    {!campaign.assignment.briefAccepted &&
                      (campaign.assignment.status === 'contracted' || campaign.assignment.status === 'approved') && (
                      <div className="flex items-center gap-1.5 mb-3 px-2 py-1.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 font-medium">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Brief needs acceptance
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {campaign.assignment.contentSubmitted > 0 && (
                        <span>{campaign.assignment.contentSubmitted} submitted</span>
                      )}
                      {campaign.assignment.contentApproved > 0 && (
                        <span className="text-green-600">{campaign.assignment.contentApproved} approved</span>
                      )}
                      {campaign.assignment.contentPending > 0 && (
                        <span className="text-amber-600">{campaign.assignment.contentPending} pending</span>
                      )}
                    </div>

                    {campaign.assignment.agreedCost && (
                      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                        Agreed: AED {campaign.assignment.agreedCost.toLocaleString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
