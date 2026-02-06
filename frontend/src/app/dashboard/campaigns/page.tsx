'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Calendar, DollarSign, Filter as FilterIcon, ChevronDown } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CreateCampaignButton } from '@/components/campaigns/CampaignFormModal';
import { Pagination, SearchInput, FilterBar } from '@/components/ui/data-table';
import { useUrlState } from '@/hooks/useUrlState';

interface Campaign {
  campaignId: string;
  campaignName: string;
  clientId: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  totalBudget: number;
  spentBudget: number;
  startDate: string;
  endDate: string;
  targetAudience?: any;
  platforms?: string[];
  client?: {
    brandDisplayName: string;
  };
}

interface PaginatedResponse {
  data: Campaign[];
  total: number;
  page: number;
  pages: number;
}

export default function CampaignsPage() {
  const router = useRouter();
  const {
    updateUrlParams,
    getParam,
    getNumberParam,
    getArrayParam,
    clearAllParams,
  } = useUrlState();

  const page = getNumberParam('page', 1);
  const pageSize = getNumberParam('pageSize', 25);
  const searchQuery = getParam('search', '');
  const statusFilters = getArrayParam('status', []);
  const sortField = getParam('sortField', 'startDate');
  const sortDirection = getParam('sortDirection', 'desc') as 'asc' | 'desc';

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['campaigns', page, pageSize, searchQuery, statusFilters, sortField, sortDirection],
    queryFn: async () => {
      const response = await apiClient.get('/campaigns', {
        params: {
          page,
          limit: pageSize,
          search: searchQuery || undefined,
          status: statusFilters.length > 0 ? statusFilters.join(',') : undefined,
          sortField,
          sortDirection,
        },
      });
      
      const campaigns = response.data.data as Campaign[];
      
      let filtered = [...campaigns];
      if (searchQuery) {
        filtered = filtered.filter((c) => 
          c.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.client?.brandDisplayName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      if (statusFilters.length > 0) {
        filtered = filtered.filter((c) => statusFilters.includes(c.status));
      }
      
      filtered.sort((a, b) => {
        let aVal: any = a[sortField as keyof Campaign];
        let bVal: any = b[sortField as keyof Campaign];
        
        if (sortField === 'campaignName') {
          aVal = a.campaignName.toLowerCase();
          bVal = b.campaignName.toLowerCase();
        }
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      
      const total = filtered.length;
      const pages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const paginatedData = filtered.slice(startIndex, startIndex + pageSize);
      
      return {
        data: paginatedData,
        total,
        page,
        pages,
      } as PaginatedResponse;
    },
    placeholderData: (previousData) => previousData,
  });

  const campaigns = data?.data || [];
  const totalItems = data?.total || 0;
  const totalPages = data?.pages || 1;

  const handleSearch = (value: string) => {
    updateUrlParams({ search: value, page: 1 });
  };

  const handleStatusFilterChange = (status: string) => {
    const newFilters = statusFilters.includes(status)
      ? statusFilters.filter((s) => s !== status)
      : [...statusFilters, status];
    updateUrlParams({ status: newFilters.join(',') || null, page: 1 });
  };

  const handleClearFilters = () => {
    updateUrlParams({ status: null, search: null, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    updateUrlParams({ pageSize: newPageSize, page: 1 });
  };

  const activeFilterTags = useMemo(() => {
    const tags: Array<{ key: string; label: string; value: string }> = [];
    if (statusFilters.length > 0) {
      statusFilters.forEach((status) => {
        tags.push({
          key: `status-${status}`,
          label: 'Status',
          value: status.charAt(0).toUpperCase() + status.slice(1),
        });
      });
    }
    return tags;
  }, [statusFilters]);

  const removeFilter = (key: string) => {
    if (key.startsWith('status-')) {
      const status = key.replace('status-', '');
      handleStatusFilterChange(status);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
              <p className="mt-2 text-gray-600">
                Manage and track your influencer marketing campaigns
              </p>
            </div>
            <CreateCampaignButton />
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchInput
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search campaigns by name or client..."
              isLoading={isFetching}
            />
            <div className="flex gap-2 flex-wrap">
              {['active', 'draft', 'paused', 'completed', 'cancelled'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilters.includes(status) ? 'default' : 'outline'}
                  onClick={() => handleStatusFilterChange(status)}
                  size="sm"
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
          
          <FilterBar
            filters={activeFilterTags}
            onRemoveFilter={removeFilter}
            onClearAll={handleClearFilters}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800">
                Failed to load campaigns. Please try again later.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Campaigns Grid */}
        {!isLoading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns && campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <Card
                    key={campaign.campaignId}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/dashboard/campaigns/${campaign.campaignId}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">
                            {campaign.campaignName}
                          </CardTitle>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              campaign.status
                            )}`}
                          >
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </span>
                        </div>
                        <Target className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>
                            {formatDate(campaign.startDate)} -{' '}
                            {formatDate(campaign.endDate)}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 mr-2" />
                          <span>
                            {formatCurrency(campaign.spentBudget)} /{' '}
                            {formatCurrency(campaign.totalBudget)}
                          </span>
                        </div>
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Budget Progress</span>
                            <span>
                              {campaign.totalBudget > 0
                                ? Math.round(
                                    (campaign.spentBudget / campaign.totalBudget) * 100
                                  )
                                : 0}
                              %
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${
                                  campaign.totalBudget > 0
                                    ? Math.min(
                                        (campaign.spentBudget / campaign.totalBudget) * 100,
                                        100
                                      )
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full">
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Target className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No campaigns found
                      </h3>
                      <p className="text-gray-600 mb-4 text-center">
                        {searchQuery || statusFilters.length > 0
                          ? 'No campaigns match your filters. Try adjusting your search or filters.'
                          : 'Get started by creating your first campaign'}
                      </p>
                      {(searchQuery || statusFilters.length > 0) ? (
                        <Button onClick={handleClearFilters} variant="outline">
                          Clear Filters
                        </Button>
                      ) : (
                        <CreateCampaignButton />
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Pagination */}
            {campaigns.length > 0 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                isLoading={isFetching}
              />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
