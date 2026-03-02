'use client';

// T116-T119: Enhanced dashboard — role-aware stats, recent campaigns, upcoming deadlines, activity feed
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { analyticsService } from '@/services/analytics.service';
import { campaignService } from '@/services/campaign.service';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import {
  Target, Handshake, Users, DollarSign, Eye, ClipboardCheck,
  FileText, Clock, Calendar, Activity,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  in_review: 'bg-blue-100 text-blue-800',
  pitching: 'bg-purple-100 text-purple-800',
  live: 'bg-green-100 text-green-800',
  reporting: 'bg-amber-100 text-amber-800',
  closed: 'bg-slate-100 text-slate-800',
  paused: 'bg-orange-100 text-orange-800',
};

export default function DashboardPage() {
  const {
    isDirector, isCampaignManager, isFinance, isReviewer,
  } = useRoleAccess();

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => analyticsService.getDashboardSummary(),
    staleTime: 60000,
  });

  // Recent campaigns (last 5)
  const { data: campaignsData } = useQuery({
    queryKey: ['recent-campaigns'],
    queryFn: () => campaignService.getAll({ perPage: 5, sortBy: 'updatedAt', sortOrder: 'desc' }),
    staleTime: 30000,
  });

  const recentCampaigns = campaignsData?.data || [];

  // ─── Role-aware stat cards ────────────────────────────────────────────────
  function getStatCards() {
    const cards = [];

    if (isDirector) {
      cards.push(
        { title: 'Total Campaigns', value: summary?.totalCounts?.campaigns || 0, icon: Target, color: 'purple' as const },
        { title: 'Active Collaborations', value: summary?.activeCollaborations?.active || 0, icon: Handshake, color: 'blue' as const },
        { title: 'Total Influencers', value: summary?.totalCounts?.influencers || 0, icon: Users, color: 'green' as const },
        { title: 'Budget Utilized', value: formatCurrency(summary?.budgetOverview?.spentBudget || 0), icon: DollarSign, color: 'orange' as const },
      );
    } else if (isCampaignManager) {
      cards.push(
        { title: 'Active Campaigns', value: summary?.campaignBreakdown?.active || 0, icon: Target, color: 'purple' as const },
        { title: 'Total Influencers', value: summary?.totalCounts?.influencers || 0, icon: Users, color: 'blue' as const },
        { title: 'Pending Approvals', value: summary?.activeCollaborations?.pending || 0, icon: ClipboardCheck, color: 'orange' as const },
        { title: 'Completed This Month', value: summary?.campaignBreakdown?.completed || 0, icon: FileText, color: 'green' as const },
      );
    } else if (isFinance) {
      cards.push(
        { title: 'Budget Utilized', value: formatCurrency(summary?.budgetOverview?.spentBudget || 0), icon: DollarSign, color: 'purple' as const },
        { title: 'Total Budget', value: formatCurrency(summary?.budgetOverview?.totalBudget || 0), icon: DollarSign, color: 'blue' as const },
        { title: 'Active Campaigns', value: summary?.campaignBreakdown?.active || 0, icon: Target, color: 'green' as const },
        { title: 'Utilization', value: `${summary?.budgetOverview?.utilizationPercentage || 0}%`, icon: Eye, color: 'orange' as const },
      );
    } else if (isReviewer) {
      cards.push(
        { title: 'Pending Reviews', value: summary?.activeCollaborations?.pending || 0, icon: ClipboardCheck, color: 'purple' as const },
        { title: 'Active Campaigns', value: summary?.campaignBreakdown?.active || 0, icon: Target, color: 'blue' as const },
        { title: 'Total Influencers', value: summary?.totalCounts?.influencers || 0, icon: Users, color: 'green' as const },
        { title: 'Total Reach', value: formatNumber(summary?.performanceMetrics?.totalReach || 0), icon: Eye, color: 'orange' as const },
      );
    } else {
      cards.push(
        { title: 'Total Campaigns', value: summary?.totalCounts?.campaigns || 0, icon: Target, color: 'purple' as const },
        { title: 'Collaborations', value: summary?.activeCollaborations?.active || 0, icon: Handshake, color: 'blue' as const },
        { title: 'Influencers', value: summary?.totalCounts?.influencers || 0, icon: Users, color: 'green' as const },
        { title: 'Total Reach', value: formatNumber(summary?.performanceMetrics?.totalReach || 0), icon: Eye, color: 'orange' as const },
      );
    }

    return cards;
  }

  const statCards = getStatCards();

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="mt-2 text-gray-600">
            Welcome back! Here&apos;s what&apos;s happening with your campaigns.
          </p>
        </div>

        {/* T116: Role-aware Stat Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {statCards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={isLoading ? '...' : card.value}
              icon={card.icon}
              color={card.color}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* T117: Recent Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recent Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentCampaigns.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No campaigns yet</p>
              ) : (
                <div className="space-y-3">
                  {recentCampaigns.slice(0, 5).map((campaign: any) => (
                    <Link
                      key={campaign.campaignId || campaign.id}
                      href={`/dashboard/campaigns/${campaign.campaignId || campaign.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {campaign.campaignName || campaign.title || 'Untitled'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {campaign.displayId || ''}
                        </p>
                      </div>
                      <Badge className={STATUS_COLORS[campaign.status] || 'bg-gray-100 text-gray-800'}>
                        {(campaign.status || 'draft').replace(/_/g, ' ')}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* T118: Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                  <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800">Pending Approvals</p>
                    <p className="text-amber-600 text-xs">
                      {summary?.activeCollaborations?.pending || 0} items awaiting review
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800">Active Campaigns</p>
                    <p className="text-blue-600 text-xs">
                      {summary?.campaignBreakdown?.active || 0} campaigns in progress
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <Clock className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-purple-800">Draft Campaigns</p>
                    <p className="text-purple-600 text-xs">
                      {summary?.campaignBreakdown?.draft || 0} campaigns in draft
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Reach</span>
                    <span className="font-semibold text-purple-600">
                      {formatNumber(summary?.performanceMetrics?.totalReach || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Engagement</span>
                    <span className="font-semibold text-blue-600">
                      {formatNumber(summary?.performanceMetrics?.totalEngagement || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Avg. Engagement Rate</span>
                    <span className="font-semibold text-green-600">
                      {(summary?.performanceMetrics?.avgEngagementRate || 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* T119: Activity Feed Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Coming with audit logs</p>
                <p className="text-xs text-gray-400 mt-1">
                  Recent actions will appear here once audit logging is enabled
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
