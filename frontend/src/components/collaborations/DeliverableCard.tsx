import { CheckCircle, XCircle, Clock, Upload } from 'lucide-react';
import type { Deliverable, DeliverableStatus } from '@/types/collaboration.types';
import { formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface DeliverableCardProps {
  deliverable: Deliverable;
  onSubmit?: (deliverableId: string) => void;
  onApprove?: (deliverableId: string) => void;
  onReject?: (deliverableId: string) => void;
  showActions?: boolean;
}

export default function DeliverableCard({
  deliverable,
  onSubmit,
  onApprove,
  onReject,
  showActions = false,
}: DeliverableCardProps) {
  const statusConfig: Record<
    DeliverableStatus,
    { icon: React.ReactNode; className: string; label: string }
  > = {
    pending: {
      icon: <Clock className="h-4 w-4" />,
      className: 'bg-gray-100 text-gray-700 border-gray-300',
      label: 'Pending',
    },
    submitted: {
      icon: <Upload className="h-4 w-4" />,
      className: 'bg-blue-100 text-blue-700 border-blue-300',
      label: 'Submitted',
    },
    approved: {
      icon: <CheckCircle className="h-4 w-4" />,
      className: 'bg-green-100 text-green-700 border-green-300',
      label: 'Approved',
    },
    rejected: {
      icon: <XCircle className="h-4 w-4" />,
      className: 'bg-red-100 text-red-700 border-red-300',
      label: 'Rejected',
    },
  };

  const config = statusConfig[deliverable.status];

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{deliverable.name}</h4>
          {deliverable.description && (
            <p className="text-sm text-gray-600 mt-1">{deliverable.description}</p>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
        >
          {config.icon}
          {config.label}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        {deliverable.dueDate && (
          <div className="flex items-center justify-between">
            <span>Due Date:</span>
            <span className="font-medium">{formatDate(deliverable.dueDate)}</span>
          </div>
        )}
        {deliverable.submittedAt && (
          <div className="flex items-center justify-between">
            <span>Submitted:</span>
            <span className="font-medium">{formatDate(deliverable.submittedAt)}</span>
          </div>
        )}
        {deliverable.reviewedAt && (
          <div className="flex items-center justify-between">
            <span>Reviewed:</span>
            <span className="font-medium">{formatDate(deliverable.reviewedAt)}</span>
          </div>
        )}
      </div>

      {deliverable.feedback && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
          <span className="font-medium text-gray-700">Feedback:</span>
          <p className="text-gray-600 mt-1">{deliverable.feedback}</p>
        </div>
      )}

      {deliverable.fileUrl && (
        <div className="mt-3">
          <a
            href={deliverable.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            View File
          </a>
        </div>
      )}

      {showActions && (
        <div className="mt-4 flex gap-2">
          {deliverable.status === 'pending' && onSubmit && (
            <button
              onClick={() => onSubmit(deliverable.id)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Submit
            </button>
          )}
          {deliverable.status === 'submitted' && onApprove && onReject && (
            <>
              <button
                onClick={() => onApprove(deliverable.id)}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => onReject(deliverable.id)}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Reject
              </button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
