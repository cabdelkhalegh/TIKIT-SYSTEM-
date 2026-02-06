'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Users, Instagram, Youtube, TrendingUp, MapPin, Filter } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { CreateInfluencerButton } from '@/components/influencers';

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

const platformIcons: Record<string, typeof Instagram> = {
  instagram: Instagram,
  youtube: Youtube,
  tiktok: TrendingUp,
};

export default function InfluencersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [nicheFilter, setNicheFilter] = useState<string>('all');

  const { data: influencers, isLoading, error } = useQuery({
    queryKey: ['influencers'],
    queryFn: async () => {
      const response = await apiClient.get('/influencers');
      return response.data.data as Influencer[];
    },
  });

  const niches = ['all', ...Array.from(new Set(influencers?.map(i => i.niche) || []))];

  const filteredInfluencers = influencers?.filter((influencer) => {
    const matchesSearch = influencer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          influencer.niche.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNiche = nicheFilter === 'all' || influencer.niche === nicheFilter;
    return matchesSearch && matchesNiche;
  });

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

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search influencers by name or niche..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {niches.slice(0, 5).map((niche) => (
              <Button
                key={niche}
                variant={nicheFilter === niche ? 'default' : 'outline'}
                onClick={() => setNicheFilter(niche)}
                size="sm"
                className="whitespace-nowrap"
              >
                {niche === 'all' ? 'All' : niche.charAt(0).toUpperCase() + niche.slice(1)}
              </Button>
            ))}
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInfluencers && filteredInfluencers.length > 0 ? (
              filteredInfluencers.map((influencer) => (
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
                      {/* Location */}
                      {influencer.location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{influencer.location}</span>
                        </div>
                      )}

                      {/* Platform Icons */}
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

                      {/* Stats */}
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
                      {searchTerm || nicheFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Get started by adding influencers to your network'}
                    </p>
                    <CreateInfluencerButton />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
