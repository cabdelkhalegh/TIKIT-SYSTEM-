import { cn } from '@/lib/utils';

type CampaignStatusV2 =
  | 'draft' | 'in_review' | 'pitching' | 'live'
  | 'reporting' | 'closed' | 'paused' | 'cancelled'
  | 'active' | 'completed';

interface CampaignStatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<
  CampaignStatusV2,
  { label: string; className: string }
> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  in_review: {
    label: 'In Review',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  pitching: {
    label: 'Pitching',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  live: {
    label: 'Live',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  reporting: {
    label: 'Reporting',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  closed: {
    label: 'Closed',
    className: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  paused: {
    label: 'Paused',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  active: {
    label: 'Active',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  completed: {
    label: 'Completed',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
};

export default function CampaignStatusBadge({ status, className }: CampaignStatusBadgeProps) {
  const config = statusConfig[status as CampaignStatusV2] || statusConfig.draft;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
