import { formatDistanceToNow } from 'date-fns';
import { Bell, Target, Handshake, DollarSign, Settings, Megaphone } from 'lucide-react';
import type { Notification } from '@/types/notification.types';
import NotificationTypeBadge from './NotificationTypeBadge';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  compact?: boolean;
}

const typeIcons = {
  campaign: Target,
  collaboration: Handshake,
  payment: DollarSign,
  system: Settings,
  announcement: Megaphone,
};

export default function NotificationItem({ notification, onClick, compact = false }: NotificationItemProps) {
  const Icon = typeIcons[notification.type];

  return (
    <div
      onClick={onClick}
      className={`flex gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
        !notification.read ? 'bg-purple-50/50' : ''
      } ${compact ? 'py-3' : ''}`}
    >
      <div className={`flex-shrink-0 ${!notification.read ? 'text-purple-600' : 'text-gray-400'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium text-gray-900 ${!notification.read ? 'font-semibold' : ''}`}>
              {notification.title}
            </p>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {notification.message}
            </p>
          </div>
          {!notification.read && (
            <div className="flex-shrink-0">
              <div className="h-2 w-2 bg-purple-600 rounded-full"></div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <NotificationTypeBadge type={notification.type} />
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}
