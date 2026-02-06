import { Instagram, Youtube, Twitter, Facebook, Linkedin, ExternalLink } from 'lucide-react';
import type { SocialMediaHandles } from '@/types/influencer.types';
import { formatNumber } from '@/lib/utils';

interface SocialHandlesProps {
  handles: SocialMediaHandles;
  followers?: Record<string, number>;
  showFollowers?: boolean;
  layout?: 'horizontal' | 'vertical';
}

const platformConfig = {
  instagram: {
    icon: Instagram,
    label: 'Instagram',
    color: 'text-pink-600',
    baseUrl: 'https://instagram.com/',
  },
  tiktok: {
    icon: ({ className }: { className?: string }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ),
    label: 'TikTok',
    color: 'text-gray-900',
    baseUrl: 'https://tiktok.com/@',
  },
  youtube: {
    icon: Youtube,
    label: 'YouTube',
    color: 'text-red-600',
    baseUrl: 'https://youtube.com/@',
  },
  twitter: {
    icon: Twitter,
    label: 'Twitter',
    color: 'text-blue-500',
    baseUrl: 'https://twitter.com/',
  },
  facebook: {
    icon: Facebook,
    label: 'Facebook',
    color: 'text-blue-600',
    baseUrl: 'https://facebook.com/',
  },
  linkedin: {
    icon: Linkedin,
    label: 'LinkedIn',
    color: 'text-blue-700',
    baseUrl: 'https://linkedin.com/in/',
  },
};

export default function SocialHandles({ 
  handles, 
  followers,
  showFollowers = true,
  layout = 'vertical'
}: SocialHandlesProps) {
  const handleEntries = Object.entries(handles).filter(([_, handle]) => handle);

  if (handleEntries.length === 0) {
    return <p className="text-sm text-gray-500">No social media handles</p>;
  }

  return (
    <div className={layout === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-3'}>
      {handleEntries.map(([platform, handle]) => {
        const config = platformConfig[platform as keyof typeof platformConfig];
        if (!config) return null;

        const Icon = config.icon;
        const followerCount = followers?.[platform];

        return (
          <a
            key={platform}
            href={`${config.baseUrl}${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm hover:underline group"
          >
            <Icon className={`h-4 w-4 ${config.color}`} />
            <span className="text-gray-700 group-hover:text-gray-900">
              @{handle}
            </span>
            {showFollowers && followerCount && (
              <span className="text-gray-500">
                • {formatNumber(followerCount)}
              </span>
            )}
            <ExternalLink className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        );
      })}
    </div>
  );
}
