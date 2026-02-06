import { Users, TrendingUp, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';
import type { AudienceMetrics } from '@/types/influencer.types';
import { formatNumber } from '@/lib/utils';

interface AudienceMetricsProps {
  metrics: AudienceMetrics;
  layout?: 'grid' | 'list';
  compact?: boolean;
}

export default function AudienceMetrics({ 
  metrics, 
  layout = 'grid',
  compact = false 
}: AudienceMetricsProps) {
  const stats = [
    {
      label: 'Followers',
      value: formatNumber(metrics.followers),
      icon: Users,
      color: 'text-blue-600',
    },
    {
      label: 'Engagement Rate',
      value: `${metrics.engagementRate.toFixed(2)}%`,
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      label: 'Avg Views',
      value: formatNumber(metrics.avgViews),
      icon: Eye,
      color: 'text-purple-600',
    },
    ...(metrics.avgLikes ? [{
      label: 'Avg Likes',
      value: formatNumber(metrics.avgLikes),
      icon: Heart,
      color: 'text-red-600',
    }] : []),
    ...(metrics.avgComments ? [{
      label: 'Avg Comments',
      value: formatNumber(metrics.avgComments),
      icon: MessageCircle,
      color: 'text-yellow-600',
    }] : []),
    ...(metrics.avgShares ? [{
      label: 'Avg Shares',
      value: formatNumber(metrics.avgShares),
      icon: Share2,
      color: 'text-indigo-600',
    }] : []),
  ];

  if (compact) {
    return (
      <div className="flex flex-wrap gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-sm font-medium text-gray-900">{stat.value}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={layout === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-4' : 'space-y-3'}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-gray-50 ${stat.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
