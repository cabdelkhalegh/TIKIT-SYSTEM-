'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Target,
  ClipboardCheck,
  Users,
  FileText,
  TrendingUp,
  Eye,
  MousePointerClick,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { clientPortalService } from '@/services/client-portal.service';

const STATUS_BADGE: Record<string, string> = {
  pitching: 'bg-yellow-100 text-yellow-800',
  live: 'bg-green-100 text-green-800',
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function ClientPortalDashboard() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['client-portal-dashboard'],
    queryFn: () => clientPortalService.getDashboard(),
    staleTime: 30_000,
  });

  const { data: campaignsData } = useQuery({
    queryKey: ['client-portal-campaigns'],
    queryFn: () => clientPortalService.getCampaigns(),
    staleTime: 30_000,
  });

  const stats = dashboardData?.data?.stats;
  const kpis = dashboardData?.data?.consolidatedKpis;
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your campaigns and approvals</p>
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
                <ClipboardCheck className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.pendingApprovals ?? 0}</p>
                <p className="text-xs text-gray-500">Pending Approvals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.contractedCreators ?? 0}</p>
                <p className="text-xs text-gray-500">Creators</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.reportsReady ?? 0}</p>
                <p className="text-xs text-gray-500">Reports Ready</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-100">
                <TrendingUp className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats?.totalReach ?? 0)}</p>
                <p className="text-xs text-gray-500">Total Reach</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Summary */}
      {kpis && (kpis.totalReach > 0 || kpis.totalImpressions > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              Consolidated KPIs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Reach</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatNumber(kpis.totalReach)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Impressions</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatNumber(kpis.totalImpressions)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Engagement</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatNumber(kpis.totalEngagement)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Clicks</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatNumber(kpis.totalClicks)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Campaigns</h2>
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No active campaigns assigned to you</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign) => (
              <Link key={campaign.id} href={`/client-portal/campaigns/${campaign.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-400 font-mono">{campaign.displayId}</p>
                        <h3 className="text-sm font-semibold text-gray-900 truncate mt-0.5">
                          {campaign.name}
                        </h3>
                      </div>
                      <Badge className={`ml-2 text-[10px] ${STATUS_BADGE[campaign.status] || 'bg-gray-100 text-gray-700'}`}>
                        {campaign.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {campaign.influencerCount} creators
                      </span>
                      {campaign.pendingApprovals > 0 && (
                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                          <ClipboardCheck className="h-3.5 w-3.5" />
                          {campaign.pendingApprovals} pending
                        </span>
                      )}
                    </div>

                    {/* KPI mini summary */}
                    {campaign.kpiSummary.totalReach > 0 && (
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatNumber(campaign.kpiSummary.totalReach)}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {formatNumber(campaign.kpiSummary.totalEngagement)}
                        </span>
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
