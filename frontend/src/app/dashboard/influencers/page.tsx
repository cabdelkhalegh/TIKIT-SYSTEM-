'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Users, Instagram } from 'lucide-react';
import Link from 'next/link';
import { influencerService } from '@/services/influencer.service';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import InfluencerCard from '@/components/influencers/InfluencerCard';
import InstagramDiscoveryDialog from '@/components/influencers/InstagramDiscoveryDialog';
import type { Platform, InfluencerStatus, ContentCategory } from '@/types/influencer.types';

const platforms: Platform[] = ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'linkedin'];

type ProfileStatusFilter = '' | 'complete' | 'stub';

export default function InfluencersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<InfluencerStatus | ''>('');
  const [profileStatusFilter, setProfileStatusFilter] = useState<ProfileStatusFilter>('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['influencers', { page, search, platform: selectedPlatform, status: selectedStatus, verified: verifiedOnly }],
    queryFn: () => influencerService.getAll({ 
      page, 
      perPage: 12, 
      search,
      platform: selectedPlatform || undefined,
      status: selectedStatus || undefined,
      verified: verifiedOnly || undefined,
    }),
    staleTime: 30000,
  });

  const influencers = data?.data || [];

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Influencers</h1>
            <p className="mt-1 text-gray-600">Discover and manage influencer partnerships</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowDiscovery(true)}>
              <Instagram className="h-4 w-4 mr-2" />
              Discover
            </Button>
            <Link href="/dashboard/influencers/search">
              <Button variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Advanced Search
              </Button>
            </Link>
            <Link href="/dashboard/influencers/new">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Influencer
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search influencers by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value as Platform | '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Platforms</option>
                    {platforms.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as InfluencerStatus | '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Status
                  </label>
                  <select
                    value={profileStatusFilter}
                    onChange={(e) => setProfileStatusFilter(e.target.value as ProfileStatusFilter)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Profiles</option>
                    <option value="complete">Complete</option>
                    <option value="stub">Stub</option>
                  </select>
                </div>

                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Verified Only</span>
                  </label>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedPlatform('');
                      setSelectedStatus('');
                      setProfileStatusFilter('');
                      setVerifiedOnly(false);
                      setSearch('');
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }, (_, i) => i).map((i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Failed to load influencers. Please try again.</p>
          </div>
        )}

        {/* Influencers Grid */}
        {!isLoading && !error && (
          <>
            {influencers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No influencers found</h3>
                <p className="text-gray-600 mb-6">
                  {search || selectedPlatform || selectedStatus || verifiedOnly
                    ? 'Try adjusting your filters'
                    : 'Get started by adding your first influencer'}
                </p>
                <Link href="/dashboard/influencers/new">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Influencer
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {influencers
                  .filter((influencer: any) => {
                    if (!profileStatusFilter) return true;
                    return influencer.profileStatus === profileStatusFilter;
                  })
                  .map((influencer: any) => (
                  <div key={influencer.id} className="relative">
                    {/* Display ID + Profile Status badges */}
                    <div className="absolute top-2 left-2 z-10 flex gap-1">
                      {influencer.displayId && (
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-mono px-1.5 py-0.5 rounded">
                          {influencer.displayId}
                        </span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        influencer.profileStatus === 'complete'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {influencer.profileStatus === 'complete' ? 'Complete' : 'Stub'}
                      </span>
                    </div>
                    <InfluencerCard influencer={influencer} />
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= data.pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        {/* Instagram Discovery Dialog */}
        <InstagramDiscoveryDialog
          isOpen={showDiscovery}
          onClose={() => setShowDiscovery(false)}
          onSelect={() => setShowDiscovery(false)}
        />
      </div>
    </DashboardLayout>
  );
}
