import { Instagram, Youtube, Twitter, Facebook, Linkedin } from 'lucide-react';
import type { Platform } from '@/types/influencer.types';
import { cn } from '@/lib/utils';

interface PlatformBadgeProps {
  platform: Platform;
  className?: string;
  showLabel?: boolean;
}

const platformConfig = {
  instagram: {
    icon: Instagram,
    label: 'Instagram',
    color: 'bg-pink-100 text-pink-700',
  },
  tiktok: {
    icon: ({ className }: { className?: string }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ),
    label: 'TikTok',
    color: 'bg-gray-900 text-white',
  },
  youtube: {
    icon: Youtube,
    label: 'YouTube',
    color: 'bg-red-100 text-red-700',
  },
  twitter: {
    icon: Twitter,
    label: 'Twitter',
    color: 'bg-blue-100 text-blue-700',
  },
  facebook: {
    icon: Facebook,
    label: 'Facebook',
    color: 'bg-blue-100 text-blue-700',
  },
  linkedin: {
    icon: Linkedin,
    label: 'LinkedIn',
    color: 'bg-blue-100 text-blue-700',
  },
};

export default function PlatformBadge({ platform, className, showLabel = true }: PlatformBadgeProps) {
  const config = platformConfig[platform];
  const Icon = config.icon;

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      config.color,
      className
    )}>
      <Icon className="h-3.5 w-3.5" />
      {showLabel && config.label}
    </span>
  );
}
