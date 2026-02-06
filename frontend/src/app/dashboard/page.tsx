'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import { Target, Handshake, Users, DollarSign } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

export default function DashboardPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => analyticsService.getDashboardSummary(),
    staleTime: 60000, // 1 minute
  });

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="mt-2 text-gray-600">Welcome back! Here's what's happening with your campaigns.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Campaigns"
            value={isLoading ? '...' : summary?.totalCounts.campaigns || 0}
            change="+12% from last month"
            trend="up"
            icon={Target}
            color="purple"
          />
          <StatCard
            title="Active Collaborations"
            value={isLoading ? '...' : summary?.activeCollaborations.active || 0}
            change="+8% from last week"
            trend="up"
            icon={Handshake}
            color="blue"
          />
          <StatCard
            title="Total Influencers"
            value={isLoading ? '...' : summary?.totalCounts.influencers || 0}
            change="+5% from last month"
            trend="up"
            icon={Users}
            color="green"
          />
          <StatCard
            title="Budget Utilized"
            value={isLoading ? '...' : formatCurrency(summary?.budgetOverview.spentBudget || 0)}
            change={`${summary?.budgetOverview.utilizationPercentage || 0}% of total`}
            trend="neutral"
            icon={DollarSign}
            color="orange"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Status</h2>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active</span>
                  <span className="font-semibold text-green-600">
                    {summary?.campaignBreakdown.active || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Draft</span>
                  <span className="font-semibold text-gray-600">
                    {summary?.campaignBreakdown.draft || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-semibold text-blue-600">
                    {summary?.campaignBreakdown.completed || 0}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
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
                    {formatNumber(summary?.performanceMetrics.totalReach || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Engagement</span>
                  <span className="font-semibold text-blue-600">
                    {formatNumber(summary?.performanceMetrics.totalEngagement || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg. Engagement Rate</span>
                  <span className="font-semibold text-green-600">
                    {(summary?.performanceMetrics.avgEngagementRate || 0).toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
