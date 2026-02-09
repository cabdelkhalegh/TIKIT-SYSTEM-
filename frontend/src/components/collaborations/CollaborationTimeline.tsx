import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface TimelineEvent {
  label: string;
  date?: string;
  completed: boolean;
}

interface CollaborationTimelineProps {
  invitedAt: string;
  acceptedAt?: string;
  completedAt?: string;
  status: string;
}

export default function CollaborationTimeline({
  invitedAt,
  acceptedAt,
  completedAt,
  status,
}: CollaborationTimelineProps) {
  const events: TimelineEvent[] = [
    {
      label: 'Invited',
      date: invitedAt,
      completed: true,
    },
    {
      label: 'Accepted',
      date: acceptedAt,
      completed: !!acceptedAt,
    },
    {
      label: 'Completed',
      date: completedAt,
      completed: !!completedAt,
    },
  ];

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.label} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            {event.completed ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : index === events.findIndex((e) => !e.completed) ? (
              <Clock className="h-6 w-6 text-blue-600" />
            ) : (
              <Circle className="h-6 w-6 text-gray-300" />
            )}
            {index < events.length - 1 && (
              <div
                className={`w-0.5 h-8 mt-1 ${
                  event.completed ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center justify-between">
              <h4
                className={`text-sm font-medium ${
                  event.completed ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {event.label}
              </h4>
              {event.date && (
                <span className="text-xs text-gray-500">
                  {formatDate(event.date)}
                </span>
              )}
            </div>
            {!event.date && !event.completed && (
              <span className="text-xs text-gray-400">Pending</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
