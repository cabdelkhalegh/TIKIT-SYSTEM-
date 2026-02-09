import type { CollaborationStatus } from '@/types/collaboration.types';

interface CollaborationStatusBadgeProps {
  status: CollaborationStatus;
  className?: string;
}

export default function CollaborationStatusBadge({ status, className = '' }: CollaborationStatusBadgeProps) {
  const statusConfig: Record<
    CollaborationStatus,
    { label: string; className: string }
  > = {
    invited: {
      label: 'Invited',
      className: 'bg-gray-100 text-gray-700 border-gray-300',
    },
    accepted: {
      label: 'Accepted',
      className: 'bg-blue-100 text-blue-700 border-blue-300',
    },
    active: {
      label: 'Active',
      className: 'bg-green-100 text-green-700 border-green-300',
    },
    completed: {
      label: 'Completed',
      className: 'bg-purple-100 text-purple-700 border-purple-300',
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-red-100 text-red-700 border-red-300',
    },
    declined: {
      label: 'Declined',
      className: 'bg-orange-100 text-orange-700 border-orange-300',
    },
  };

  const config = statusConfig[status] || {
    label: status || 'Unknown',
    className: 'bg-gray-100 text-gray-700 border-gray-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
