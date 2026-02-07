'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Download, TrendingUp, TrendingDown, Users, Target, Handshake, DollarSign, Eye, Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { analyticsService } from '@/services/analytics.service';
import type { DashboardSummary } from '@/services/analytics.service';

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
}

function TrendIndicator({ trend }: { trend: string }) {
  const isUp = trend === 'up';
  return (
    <span className={`inline-flex items-center text-xs font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
      {isUp ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
      {isUp ? 'Trending up' : 'Trending down'}
    </span>
  );
}

function SkeletonCard() {
  return (
    <Card className="p-6">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [isExporting, setIsExporting] = useState(false);

  const { data: summary, isLoading, error } = useQuery<DashboardSummary>({
    queryKey: ['analytics', 'dashboard-summary'],
    queryFn: () => analyticsService.getDashboardSummary(),
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await analyticsService.exportAnalytics();
      toast.success('Analytics exported successfully');
    } catch {
      toast.error('Failed to export analytics');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-2 text-gray-600">
              Overview of your platform performance and key metrics
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="mt-4 sm:mt-0 bg-purple-600 hover:bg-purple-700"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export Report
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-12 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load analytics</h3>
            <p className="text-gray-600 mb-4">There was an error loading the dashboard data.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </Card>
        )}

        {/* Data Display */}
        {summary && (
          <div className="space-y-6">
            {/* Total Counts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Campaigns</span>
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{summary.totalCounts.campaigns}</div>
                <TrendIndicator trend={summary.trends.campaigns} />
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Influencers</span>
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{summary.totalCounts.influencers}</div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Collaborations</span>
                  <Handshake className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{summary.totalCounts.collaborations}</div>
                <TrendIndicator trend={summary.trends.collaborations} />
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Clients</span>
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{summary.totalCounts.clients}</div>
              </Card>
            </div>

            {/* Campaign Breakdown & Budget Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Campaign Breakdown */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Breakdown</h2>
                <div className="space-y-4">
                  {Object.entries(summary.campaignBreakdown).map(([status, count]) => {
                    const total = Object.values(summary.campaignBreakdown).reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    const colorMap: Record<string, string> = {
                      draft: 'bg-gray-400',
                      active: 'bg-green-500',
                      paused: 'bg-yellow-500',
                      completed: 'bg-blue-500',
                      cancelled: 'bg-red-500',
                    };
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="capitalize text-gray-700">{status}</span>
                          <span className="font-medium text-gray-900">{count}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${colorMap[status] || 'bg-purple-500'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Budget Overview */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget Overview</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Budget</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(summary.budgetOverview.totalBudget)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Allocated</span>
                    <span className="font-medium text-gray-900">{formatCurrency(summary.budgetOverview.allocatedBudget)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Spent</span>
                    <span className="font-medium text-gray-900">{formatCurrency(summary.budgetOverview.spentBudget)}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Utilization</span>
                      <span className="font-medium text-gray-900">{summary.budgetOverview.utilizationPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-purple-600"
                        style={{ width: `${Math.min(summary.budgetOverview.utilizationPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  <TrendIndicator trend={summary.trends.budget} />
                </div>
              </Card>
            </div>

            {/* Performance Metrics & Platform Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="h-4 w-4 text-purple-600" />
                      <span className="text-xs text-gray-600">Total Reach</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">{formatNumber(summary.performanceMetrics.totalReach)}</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="h-4 w-4 text-blue-600" />
                      <span className="text-xs text-gray-600">Engagement</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">{formatNumber(summary.performanceMetrics.totalEngagement)}</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-gray-600">Impressions</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">{formatNumber(summary.performanceMetrics.totalImpressions)}</div>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                      <span className="text-xs text-gray-600">Avg. Engagement Rate</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">{summary.performanceMetrics.avgEngagementRate.toFixed(2)}%</div>
                  </div>
                </div>
              </Card>

              {/* Platform Distribution */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Distribution</h2>
                <div className="space-y-4">
                  {Object.entries(summary.platformDistribution).map(([platform, count]) => {
                    const total = Object.values(summary.platformDistribution).reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={platform}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="capitalize text-gray-700">{platform}</span>
                          <span className="font-medium text-gray-900">{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-purple-600"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              {summary.recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {summary.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 capitalize">{activity.type}</span>
                          {activity.user && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">{activity.user}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
