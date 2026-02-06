'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { influencerService } from '@/services/influencer.service';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InfluencerCard from '@/components/influencers/InfluencerCard';
import type { Platform, ContentCategory, AdvancedSearchParams } from '@/types/influencer.types';

const platforms: Platform[] = ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'linkedin'];
const categories: ContentCategory[] = [
  'lifestyle', 'beauty', 'fitness', 'tech', 'fashion', 'food',
  'travel', 'gaming', 'business', 'education', 'entertainment',
  'health', 'parenting', 'sports'
];

export default function AdvancedSearchPage() {
  const [searchParams, setSearchParams] = useState<AdvancedSearchParams>({});
  const [selectedCategories, setSelectedCategories] = useState<ContentCategory[]>([]);

  const searchMutation = useMutation({
    mutationFn: (params: AdvancedSearchParams) => influencerService.advancedSearch(params),
  });

  const handleSearch = () => {
    const params: AdvancedSearchParams = {
      ...searchParams,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    };
    searchMutation.mutate(params);
  };

  const toggleCategory = (category: ContentCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const influencers = searchMutation.data?.data || [];

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/influencers" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Influencers
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Search</h1>
          <p className="mt-1 text-gray-600">Find influencers with specific criteria</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="space-y-6">
            {/* Platform Selection */}
            <div>
              <Label>Platform</Label>
              <select
                value={searchParams.platform || ''}
                onChange={(e) => setSearchParams({ ...searchParams, platform: e.target.value as Platform || undefined })}
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

            {/* Content Categories */}
            <div>
              <Label>Content Categories</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {categories.map((category) => (
                  <label
                    key={category}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Follower Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minFollowers">Min Followers</Label>
                <Input
                  id="minFollowers"
                  type="number"
                  placeholder="10000"
                  value={searchParams.minFollowers || ''}
                  onChange={(e) => setSearchParams({ 
                    ...searchParams, 
                    minFollowers: e.target.value ? Number(e.target.value) : undefined 
                  })}
                />
              </div>
              <div>
                <Label htmlFor="maxFollowers">Max Followers</Label>
                <Input
                  id="maxFollowers"
                  type="number"
                  placeholder="1000000"
                  value={searchParams.maxFollowers || ''}
                  onChange={(e) => setSearchParams({ 
                    ...searchParams, 
                    maxFollowers: e.target.value ? Number(e.target.value) : undefined 
                  })}
                />
              </div>
            </div>

            {/* Engagement Rate Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minEngagementRate">Min Engagement Rate (%)</Label>
                <Input
                  id="minEngagementRate"
                  type="number"
                  step="0.1"
                  placeholder="2.0"
                  value={searchParams.minEngagementRate || ''}
                  onChange={(e) => setSearchParams({ 
                    ...searchParams, 
                    minEngagementRate: e.target.value ? Number(e.target.value) : undefined 
                  })}
                />
              </div>
              <div>
                <Label htmlFor="maxEngagementRate">Max Engagement Rate (%)</Label>
                <Input
                  id="maxEngagementRate"
                  type="number"
                  step="0.1"
                  placeholder="10.0"
                  value={searchParams.maxEngagementRate || ''}
                  onChange={(e) => setSearchParams({ 
                    ...searchParams, 
                    maxEngagementRate: e.target.value ? Number(e.target.value) : undefined 
                  })}
                />
              </div>
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minPrice">Min Price per Post ($)</Label>
                <Input
                  id="minPrice"
                  type="number"
                  placeholder="500"
                  value={searchParams.minPrice || ''}
                  onChange={(e) => setSearchParams({ 
                    ...searchParams, 
                    minPrice: e.target.value ? Number(e.target.value) : undefined 
                  })}
                />
              </div>
              <div>
                <Label htmlFor="maxPrice">Max Price per Post ($)</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  placeholder="5000"
                  value={searchParams.maxPrice || ''}
                  onChange={(e) => setSearchParams({ 
                    ...searchParams, 
                    maxPrice: e.target.value ? Number(e.target.value) : undefined 
                  })}
                />
              </div>
            </div>

            {/* Location and Quality Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Los Angeles, CA"
                  value={searchParams.location || ''}
                  onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value || undefined })}
                />
              </div>
              <div>
                <Label htmlFor="minQualityScore">Min Quality Score</Label>
                <Input
                  id="minQualityScore"
                  type="number"
                  placeholder="70"
                  min="0"
                  max="100"
                  value={searchParams.minQualityScore || ''}
                  onChange={(e) => setSearchParams({ 
                    ...searchParams, 
                    minQualityScore: e.target.value ? Number(e.target.value) : undefined 
                  })}
                />
              </div>
            </div>

            {/* Verified Only */}
            <div className="flex items-center gap-2">
              <input
                id="verified"
                type="checkbox"
                checked={searchParams.verified || false}
                onChange={(e) => setSearchParams({ ...searchParams, verified: e.target.checked || undefined })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <Label htmlFor="verified" className="mb-0">Verified influencers only</Label>
            </div>

            {/* Search Button */}
            <div className="flex gap-4">
              <Button
                onClick={handleSearch}
                disabled={searchMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 flex-1"
              >
                <Search className="h-4 w-4 mr-2" />
                {searchMutation.isPending ? 'Searching...' : 'Search Influencers'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchParams({});
                  setSelectedCategories([]);
                  searchMutation.reset();
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        {searchMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Search failed. Please try again.</p>
          </div>
        )}

        {searchMutation.isSuccess && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Search Results ({searchMutation.data.total} found)
              </h2>
            </div>

            {influencers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No influencers found</h3>
                <p className="text-gray-600">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {influencers.map((influencer) => (
                  <InfluencerCard key={influencer.id} influencer={influencer} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
