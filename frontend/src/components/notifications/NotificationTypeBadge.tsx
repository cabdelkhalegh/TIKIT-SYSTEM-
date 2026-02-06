import type { NotificationType } from '@/types/notification.types';

interface NotificationTypeBadgeProps {
  type: NotificationType;
}

const typeConfig = {
  campaign: {
    label: 'Campaign',
    className: 'bg-purple-100 text-purple-700',
  },
  collaboration: {
    label: 'Collaboration',
    className: 'bg-blue-100 text-blue-700',
  },
  payment: {
    label: 'Payment',
    className: 'bg-green-100 text-green-700',
  },
  system: {
    label: 'System',
    className: 'bg-gray-100 text-gray-700',
  },
  announcement: {
    label: 'Announcement',
    className: 'bg-orange-100 text-orange-700',
  },
};

export default function NotificationTypeBadge({ type }: NotificationTypeBadgeProps) {
  const config = typeConfig[type];

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
