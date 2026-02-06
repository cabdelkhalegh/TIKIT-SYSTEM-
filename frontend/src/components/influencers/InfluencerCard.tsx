import { CheckCircle, MapPin } from 'lucide-react';
import Link from 'next/link';
import type { Influencer } from '@/types/influencer.types';
import { formatNumber } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import PlatformBadge from './PlatformBadge';
import QualityScoreIndicator from './QualityScoreIndicator';

interface InfluencerCardProps {
  influencer: Influencer;
}

export default function InfluencerCard({ influencer }: InfluencerCardProps) {
  const initials = influencer.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const primaryHandle = influencer.socialMediaHandles[influencer.primaryPlatform];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/dashboard/influencers/${influencer.id}`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar */}
            <div className="flex-shrink-0 h-16 w-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {initials}
            </div>
            
            {/* Name and Platform */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {influencer.displayName || influencer.fullName}
                </h3>
                {influencer.verified && (
                  <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                )}
              </div>
              <PlatformBadge platform={influencer.primaryPlatform} />
              {primaryHandle && (
                <p className="text-sm text-gray-600 mt-1">@{primaryHandle}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          {influencer.bio && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {influencer.bio}
            </p>
          )}

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-4">
            {influencer.contentCategories.slice(0, 3).map((category) => (
              <span
                key={category}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700"
              >
                {category}
              </span>
            ))}
            {influencer.contentCategories.length > 3 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                +{influencer.contentCategories.length - 3} more
              </span>
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Followers</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatNumber(influencer.audienceMetrics.followers)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Engagement</p>
              <p className="text-lg font-semibold text-green-600">
                {influencer.audienceMetrics.engagementRate.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Quality Score */}
          <div className="mb-4">
            <QualityScoreIndicator score={influencer.qualityScore} size="sm" />
          </div>

          {/* Location */}
          {influencer.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{influencer.location}</span>
            </div>
          )}

          {/* Status Badge */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                influencer.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : influencer.status === 'paused'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {influencer.status}
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
