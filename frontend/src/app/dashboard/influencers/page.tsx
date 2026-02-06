'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Instagram, Youtube, TrendingUp, MapPin } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { CreateInfluencerButton } from '@/components/influencers';
import { Pagination, SearchInput, FilterBar } from '@/components/ui/data-table';
import { useUrlState } from '@/hooks/useUrlState';

interface Influencer {
  influencerId: string;
  fullName: string;
  niche: string;
  location?: string;
  platforms: {
    platform: string;
    handle: string;
    followersCount: number;
    engagementRate: number;
  }[];
}

interface PaginatedResponse {
  data: Influencer[];
  total: number;
  page: number;
  pages: number;
}

const platformIcons: Record<string, typeof Instagram> = {
  instagram: Instagram,
  youtube: Youtube,
  tiktok: TrendingUp,
};

export default function InfluencersPage() {
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
  const nicheFilters = getArrayParam('niche', []);
  const sortField = getParam('sortField', 'fullName');
  const sortDirection = getParam('sortDirection', 'asc') as 'asc' | 'desc';

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['influencers', page, pageSize, searchQuery, nicheFilters, sortField, sortDirection],
    queryFn: async () => {
      const response = await apiClient.get('/influencers');
      const influencers = response.data.data as Influencer[];
      
      let filtered = [...influencers];
      if (searchQuery) {
        filtered = filtered.filter((i) => 
          i.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.niche.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      if (nicheFilters.length > 0) {
        filtered = filtered.filter((i) => nicheFilters.includes(i.niche));
      }
      
      filtered.sort((a, b) => {
        let aVal: any;
        let bVal: any;
        
        if (sortField === 'fullName') {
          aVal = a.fullName.toLowerCase();
          bVal = b.fullName.toLowerCase();
        } else if (sortField === 'followers') {
          aVal = getTotalFollowers(a.platforms);
          bVal = getTotalFollowers(b.platforms);
        } else if (sortField === 'engagement') {
          aVal = getAvgEngagement(a.platforms);
          bVal = getAvgEngagement(b.platforms);
        } else {
          aVal = a[sortField as keyof Influencer];
          bVal = b[sortField as keyof Influencer];
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

  const influencers = data?.data || [];
  const totalItems = data?.total || 0;
  const totalPages = data?.pages || 1;

  const handleSearch = (value: string) => {
    updateUrlParams({ search: value, page: 1 });
  };

  const handleNicheFilterChange = (niche: string) => {
    const newFilters = nicheFilters.includes(niche)
      ? nicheFilters.filter((n) => n !== niche)
      : [...nicheFilters, niche];
    updateUrlParams({ niche: newFilters.join(',') || null, page: 1 });
  };

  const handleClearFilters = () => {
    updateUrlParams({ niche: null, search: null, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    updateUrlParams({ pageSize: newPageSize, page: 1 });
  };

  const activeFilterTags = useMemo(() => {
    const tags: Array<{ key: string; label: string; value: string }> = [];
    if (nicheFilters.length > 0) {
      nicheFilters.forEach((niche) => {
        tags.push({
          key: `niche-${niche}`,
          label: 'Niche',
          value: niche.charAt(0).toUpperCase() + niche.slice(1),
        });
      });
    }
    return tags;
  }, [nicheFilters]);

  const removeFilter = (key: string) => {
    if (key.startsWith('niche-')) {
      const niche = key.replace('niche-', '');
      handleNicheFilterChange(niche);
    }
  };

  const { data: allInfluencersData } = useQuery({
    queryKey: ['influencers-all'],
    queryFn: async () => {
      const response = await apiClient.get('/influencers');
      return response.data.data as Influencer[];
    },
  });

  const availableNiches = useMemo(() => {
    if (!allInfluencersData) return [];
    return Array.from(new Set(allInfluencersData.map(i => i.niche)));
  }, [allInfluencersData]);

  const getTotalFollowers = (platforms: Influencer['platforms']) => {
    return platforms.reduce((sum, p) => sum + p.followersCount, 0);
  };

  const getAvgEngagement = (platforms: Influencer['platforms']) => {
    if (platforms.length === 0) return 0;
    const sum = platforms.reduce((total, p) => total + p.engagementRate, 0);
    return sum / platforms.length;
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Influencer Discovery</h1>
              <p className="mt-2 text-gray-600">
                Browse and connect with influencers for your campaigns
              </p>
            </div>
            <CreateInfluencerButton />
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchInput
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search influencers by name or niche..."
              isLoading={isFetching}
            />
            <div className="flex gap-2 flex-wrap">
              {availableNiches.slice(0, 5).map((niche) => (
                <Button
                  key={niche}
                  variant={nicheFilters.includes(niche) ? 'default' : 'outline'}
                  onClick={() => handleNicheFilterChange(niche)}
                  size="sm"
                  className="capitalize whitespace-nowrap"
                >
                  {niche}
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
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
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
                Failed to load influencers. Please try again later.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Influencers Grid */}
        {!isLoading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {influencers && influencers.length > 0 ? (
                influencers.map((influencer) => (
                  <Card
                    key={influencer.influencerId}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/dashboard/influencers/${influencer.influencerId}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                          {influencer.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">
                            {influencer.fullName}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {influencer.niche}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {influencer.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{influencer.location}</span>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {influencer.platforms.map((platform) => {
                            const Icon = platformIcons[platform.platform.toLowerCase()] || Users;
                            return (
                              <div
                                key={platform.platform}
                                className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md"
                                title={`${platform.platform}: ${platform.handle}`}
                              >
                                <Icon className="h-4 w-4 text-gray-700" />
                                <span className="text-xs text-gray-700">
                                  {formatNumber(platform.followersCount)}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                          <div>
                            <p className="text-xs text-gray-600">Total Followers</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {formatNumber(getTotalFollowers(influencer.platforms))}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Avg. Engagement</p>
                            <p className="text-lg font-semibold text-purple-600">
                              {getAvgEngagement(influencer.platforms).toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/influencers/${influencer.influencerId}`);
                          }}
                        >
                          View Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full">
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No influencers found
                      </h3>
                      <p className="text-gray-600 mb-4 text-center">
                        {searchQuery || nicheFilters.length > 0
                          ? 'No influencers match your filters. Try adjusting your search or filters.'
                          : 'Get started by adding influencers to your network'}
                      </p>
                      {(searchQuery || nicheFilters.length > 0) ? (
                        <Button onClick={handleClearFilters} variant="outline">
                          Clear Filters
                        </Button>
                      ) : (
                        <CreateInfluencerButton />
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {influencers.length > 0 && (
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
