'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { influencerService } from '@/services/influencer.service';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import QualityScoreIndicator from '@/components/influencers/QualityScoreIndicator';
import PlatformBadge from '@/components/influencers/PlatformBadge';
import { formatNumber, formatCurrency } from '@/lib/utils';

export default function CompareInfluencersPage() {
  const [influencerIds, setInfluencerIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: searchResults } = useQuery({
    queryKey: ['influencers', { search: searchTerm }],
    queryFn: () => influencerService.getAll({ search: searchTerm, perPage: 10 }),
    enabled: searchTerm.length > 2,
  });

  const compareMutation = useMutation({
    mutationFn: (ids: string[]) => influencerService.compareBulk({ influencerIds: ids }),
  });

  const handleAddInfluencer = (id: string) => {
    if (influencerIds.length < 4 && !influencerIds.includes(id)) {
      const newIds = [...influencerIds, id];
      setInfluencerIds(newIds);
      setSearchTerm('');
      compareMutation.mutate(newIds);
    }
  };

  const handleRemoveInfluencer = (id: string) => {
    const newIds = influencerIds.filter(i => i !== id);
    setInfluencerIds(newIds);
    if (newIds.length > 0) {
      compareMutation.mutate(newIds);
    } else {
      compareMutation.reset();
    }
  };

  const influencers = compareMutation.data?.data || [];

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/influencers" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Influencers
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Compare Influencers</h1>
          <p className="mt-1 text-gray-600">Compare up to 4 influencers side by side</p>
        </div>

        {/* Search to Add Influencers */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search influencers to add (max 4)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={influencerIds.length >= 4}
              />
              
              {searchResults && searchTerm.length > 2 && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {searchResults.data.map((influencer) => (
                    <button
                      key={influencer.id}
                      onClick={() => handleAddInfluencer(influencer.id)}
                      disabled={influencerIds.includes(influencer.id)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 disabled:opacity-50"
                    >
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {influencer.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{influencer.displayName || influencer.fullName}</p>
                        <p className="text-sm text-gray-600">
                          {formatNumber(influencer.audienceMetrics.followers)} followers
                        </p>
                      </div>
                      {influencerIds.includes(influencer.id) && (
                        <span className="text-xs text-green-600">Added</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Influencers */}
            {influencerIds.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {influencers.map((influencer) => (
                  <div
                    key={influencer.id}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-full"
                  >
                    <span className="text-sm font-medium">{influencer.displayName || influencer.fullName}</span>
                    <button
                      onClick={() => handleRemoveInfluencer(influencer.id)}
                      className="hover:bg-purple-200 rounded-full p-0.5"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Comparison Table */}
        {influencers.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                    Metric
                  </th>
                  {influencers.map((influencer) => (
                    <th key={influencer.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {influencer.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span>{influencer.displayName || influencer.fullName}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Platform */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    Primary Platform
                  </td>
                  {influencers.map((influencer) => (
                    <td key={influencer.id} className="px-6 py-4 whitespace-nowrap">
                      <PlatformBadge platform={influencer.primaryPlatform} />
                    </td>
                  ))}
                </tr>

                {/* Followers */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-gray-50">
                    Followers
                  </td>
                  {influencers.map((influencer) => (
                    <td key={influencer.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(influencer.audienceMetrics.followers)}
                    </td>
                  ))}
                </tr>

                {/* Engagement Rate */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    Engagement Rate
                  </td>
                  {influencers.map((influencer) => (
                    <td key={influencer.id} className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                      {influencer.audienceMetrics.engagementRate.toFixed(2)}%
                    </td>
                  ))}
                </tr>

                {/* Avg Views */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-gray-50">
                    Avg Views
                  </td>
                  {influencers.map((influencer) => (
                    <td key={influencer.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(influencer.audienceMetrics.avgViews)}
                    </td>
                  ))}
                </tr>

                {/* Quality Score */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    Quality Score
                  </td>
                  {influencers.map((influencer) => (
                    <td key={influencer.id} className="px-6 py-4 whitespace-nowrap">
                      <QualityScoreIndicator score={influencer.qualityScore} size="sm" showLabel={false} />
                    </td>
                  ))}
                </tr>

                {/* Rate per Post */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-gray-50">
                    Rate per Post
                  </td>
                  {influencers.map((influencer) => (
                    <td key={influencer.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {influencer.rates.perPost ? formatCurrency(influencer.rates.perPost) : 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Rate per Video */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    Rate per Video
                  </td>
                  {influencers.map((influencer) => (
                    <td key={influencer.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {influencer.rates.perVideo ? formatCurrency(influencer.rates.perVideo) : 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Location */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-gray-50">
                    Location
                  </td>
                  {influencers.map((influencer) => (
                    <td key={influencer.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {influencer.location || 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Verified */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    Verified
                  </td>
                  {influencers.map((influencer) => (
                    <td key={influencer.id} className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        influencer.verified ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {influencer.verified ? 'Yes' : 'No'}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Status */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-gray-50">
                    Status
                  </td>
                  {influencers.map((influencer) => (
                    <td key={influencer.id} className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        influencer.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : influencer.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {influencer.status}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Categories */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    Categories
                  </td>
                  {influencers.map((influencer) => (
                    <td key={influencer.id} className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {influencer.contentCategories.slice(0, 3).map((cat) => (
                          <span key={cat} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                            {cat}
                          </span>
                        ))}
                        {influencer.contentCategories.length > 3 && (
                          <span className="text-xs text-gray-500">+{influencer.contentCategories.length - 3}</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Actions */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-gray-50">
                    Actions
                  </td>
                  {influencers.map((influencer) => (
                    <td key={influencer.id} className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/dashboard/influencers/${influencer.id}`}
                        className="text-purple-600 hover:text-purple-900 text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {influencers.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No influencers selected</h3>
            <p className="text-gray-600">Search and add influencers to compare their metrics</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
