'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { campaignService } from '@/services/campaign.service';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CampaignStatusBadge from '@/components/campaigns/CampaignStatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Campaign, CampaignStatus } from '@/types/campaign.types';

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function CampaignsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['campaigns', { page, status: statusFilter }],
    queryFn: () =>
      campaignService.getAll({
        page,
        perPage: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
    staleTime: 30000,
  });

  const campaigns = data?.data || [];
  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.campaignName.toLowerCase().includes(search.toLowerCase())
  );

  const getBudgetPercentage = (campaign: Campaign) => {
    if (!campaign.totalBudget || campaign.totalBudget === 0) return 0;
    return ((campaign.spentBudget || 0) / campaign.totalBudget) * 100;
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
            <p className="mt-1 text-gray-600">Manage your marketing campaigns</p>
          </div>
          <Link href="/dashboard/campaigns/new">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === filter.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Failed to load campaigns. Please try again.</p>
          </div>
        )}

        {/* Campaigns List */}
        {!isLoading && !error && (
          <>
            {filteredCampaigns.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {search || statusFilter !== 'all'
                    ? 'No campaigns found'
                    : 'No campaigns yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {search || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first campaign'}
                </p>
                {!search && statusFilter === 'all' && (
                  <Link href="/dashboard/campaigns/new">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      New Campaign
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Campaign
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Budget
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timeline
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Influencers
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCampaigns.map((campaign) => {
                      const budgetPercentage = getBudgetPercentage(campaign);
                      return (
                        <tr key={campaign.campaignId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-purple-600" />
                              </div>
                              <div className="ml-4">
                                <Link
                                  href={`/dashboard/campaigns/${campaign.campaignId}`}
                                  className="text-sm font-medium text-gray-900 hover:text-purple-600"
                                >
                                  {campaign.campaignName}
                                </Link>
                                {campaign.campaignDescription && (
                                  <div className="text-sm text-gray-500 line-clamp-1">
                                    {campaign.campaignDescription}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {campaign.client?.brandName || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <CampaignStatusBadge status={campaign.status as CampaignStatus} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                  {formatCurrency(campaign.spentBudget || 0)}
                                </span>
                                <span className="text-gray-900 font-medium">
                                  {formatCurrency(campaign.totalBudget || 0)}
                                </span>
                              </div>
                              <div className="w-32">
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      budgetPercentage >= 90
                                        ? 'bg-red-500'
                                        : budgetPercentage >= 75
                                        ? 'bg-yellow-500'
                                        : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              {campaign.startDate && campaign.endDate ? (
                                <>
                                  <div className="text-gray-900">
                                    {formatDate(campaign.startDate)}
                                  </div>
                                  <div className="text-gray-500">
                                    to {formatDate(campaign.endDate)}
                                  </div>
                                </>
                              ) : (
                                <span className="text-gray-400">Not scheduled</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <Users className="h-4 w-4 mr-1 text-gray-400" />
                              {campaign._count?.campaignInfluencers || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              href={`/dashboard/campaigns/${campaign.campaignId}`}
                              className="text-purple-600 hover:text-purple-900 mr-4"
                            >
                              View
                            </Link>
                            <Link
                              href={`/dashboard/campaigns/${campaign.campaignId}/edit`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {data.pagination.page} of {data.pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= data.pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
