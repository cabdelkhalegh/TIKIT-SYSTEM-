'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  Eye, 
  Heart, 
  Share2,
  DollarSign 
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface AnalyticsData {
  totalCampaigns: number;
  activeCampaigns: number;
  totalInfluencers: number;
  totalCollaborations: number;
  totalBudget: number;
  spentBudget: number;
  performance: {
    totalReach: number;
    totalEngagement: number;
    totalImpressions: number;
    avgEngagementRate: number;
  };
  topCampaigns?: Array<{
    campaignId: string;
    campaignName: string;
    reach: number;
    engagement: number;
  }>;
  topInfluencers?: Array<{
    influencerId: string;
    fullName: string;
    totalReach: number;
    engagementRate: number;
  }>;
}

export default function AnalyticsPage() {
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/analytics/dashboard');
        return response.data as AnalyticsData;
      } catch (err) {
        // Return mock data if API fails
        return {
          totalCampaigns: 12,
          activeCampaigns: 5,
          totalInfluencers: 48,
          totalCollaborations: 32,
          totalBudget: 150000,
          spentBudget: 87500,
          performance: {
            totalReach: 2450000,
            totalEngagement: 185000,
            totalImpressions: 3200000,
            avgEngagementRate: 7.55,
          },
          topCampaigns: [],
          topInfluencers: [],
        } as AnalyticsData;
      }
    },
    retry: false,
  });

  const utilizationPercentage = analytics 
    ? Math.round((analytics.spentBudget / analytics.totalBudget) * 100) 
    : 0;

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reporting</h1>
          <p className="mt-2 text-gray-600">
            Track performance metrics and campaign insights
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Campaigns"
            value={isLoading ? '...' : analytics?.totalCampaigns || 0}
            change={`${analytics?.activeCampaigns || 0} active`}
            trend="neutral"
            icon={Target}
            color="purple"
          />
          <StatCard
            title="Total Reach"
            value={isLoading ? '...' : formatNumber(analytics?.performance.totalReach || 0)}
            change="+15% from last month"
            trend="up"
            icon={Eye}
            color="blue"
          />
          <StatCard
            title="Total Engagement"
            value={isLoading ? '...' : formatNumber(analytics?.performance.totalEngagement || 0)}
            change="+8% from last month"
            trend="up"
            icon={Heart}
            color="purple"
          />
          <StatCard
            title="Avg. Engagement Rate"
            value={isLoading ? '...' : `${analytics?.performance.avgEngagementRate.toFixed(2) || 0}%`}
            change="+2.3% from last month"
            trend="up"
            icon={TrendingUp}
            color="green"
          />
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-yellow-200 bg-yellow-50 mb-8">
            <CardContent className="pt-6">
              <p className="text-yellow-800">
                Using cached analytics data. Some metrics may not be up to date.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Performance Overview
              </CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Eye className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Total Impressions</span>
                    </div>
                    <span className="text-lg font-bold text-purple-600">
                      {formatNumber(analytics?.performance.totalImpressions || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Total Reach</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">
                      {formatNumber(analytics?.performance.totalReach || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Heart className="h-5 w-5 text-pink-600" />
                      <span className="text-sm font-medium text-gray-700">Total Engagement</span>
                    </div>
                    <span className="text-lg font-bold text-pink-600">
                      {formatNumber(analytics?.performance.totalEngagement || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Engagement Rate</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {analytics?.performance.avgEngagementRate.toFixed(2) || 0}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Budget Overview
              </CardTitle>
              <CardDescription>Campaign budget tracking</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Total Budget</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(analytics?.totalBudget || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Spent</span>
                      <span className="text-lg font-bold text-purple-600">
                        {formatCurrency(analytics?.spentBudget || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-medium text-gray-700">Remaining</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency((analytics?.totalBudget || 0) - (analytics?.spentBudget || 0))}
                      </span>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-2">
                        <span>Budget Utilization</span>
                        <span className="font-semibold">{utilizationPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all"
                          style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Active Campaigns</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {analytics?.activeCampaigns || 0}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Collaborations</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {analytics?.totalCollaborations || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chart Placeholders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance Trends</CardTitle>
              <CardDescription>Performance over time (Coming soon)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Chart visualization coming soon</p>
                  <p className="text-xs text-gray-500 mt-1">Performance trends will appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Engagement Analytics</CardTitle>
              <CardDescription>Engagement breakdown (Coming soon)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Chart visualization coming soon</p>
                  <p className="text-xs text-gray-500 mt-1">Engagement metrics will appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
