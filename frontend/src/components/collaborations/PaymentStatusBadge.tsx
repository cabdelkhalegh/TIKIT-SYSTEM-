import type { PaymentStatus } from '@/types/collaboration.types';

interface PaymentStatusBadgeProps {
  status?: PaymentStatus | string;
  className?: string;
}

export default function PaymentStatusBadge({ status, className = '' }: PaymentStatusBadgeProps) {
  const statusConfig: Record<
    PaymentStatus,
    { label: string; className: string }
  > = {
    pending: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    },
    processing: {
      label: 'Processing',
      className: 'bg-blue-100 text-blue-700 border-blue-300',
    },
    paid: {
      label: 'Paid',
      className: 'bg-green-100 text-green-700 border-green-300',
    },
  };

  const normalizedStatus = (status || 'pending') as PaymentStatus;
  const config = statusConfig[normalizedStatus] || {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
