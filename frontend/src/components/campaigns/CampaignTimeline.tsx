import { Card } from '@/components/ui/card';
import { Calendar, CheckCircle2, Circle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { CampaignStatus } from '@/types/campaign.types';

interface CampaignTimelineProps {
  status: CampaignStatus;
  createdAt: string;
  startDate?: string;
  launchDate?: string;
  endDate?: string;
}

interface TimelineEvent {
  label: string;
  date?: string;
  completed: boolean;
  active: boolean;
}

export default function CampaignTimeline({
  status,
  createdAt,
  startDate,
  launchDate,
  endDate,
}: CampaignTimelineProps) {
  const events: TimelineEvent[] = [
    {
      label: 'Campaign Created',
      date: createdAt,
      completed: true,
      active: false,
    },
    {
      label: 'Start Date',
      date: startDate,
      completed: startDate ? new Date(startDate) <= new Date() : false,
      active: status === 'active' || status === 'paused',
    },
    {
      label: 'Launch Date',
      date: launchDate,
      completed: launchDate ? new Date(launchDate) <= new Date() : false,
      active: status === 'active',
    },
    {
      label: 'End Date',
      date: endDate,
      completed: status === 'completed' || status === 'cancelled',
      active: status === 'completed',
    },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Campaign Timeline</h3>
      </div>

      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              {event.completed ? (
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
              ) : (
                <Circle
                  className={`h-6 w-6 flex-shrink-0 ${
                    event.active ? 'text-purple-600' : 'text-gray-300'
                  }`}
                />
              )}
              {index < events.length - 1 && (
                <div
                  className={`w-0.5 h-12 ${
                    event.completed ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
            <div className="flex-1 pb-8">
              <div className="flex justify-between items-start">
                <div>
                  <p
                    className={`font-medium ${
                      event.active ? 'text-purple-600' : 'text-gray-900'
                    }`}
                  >
                    {event.label}
                  </p>
                  {event.date && (
                    <p className="text-sm text-gray-600 mt-1">{formatDate(event.date)}</p>
                  )}
                  {!event.date && !event.completed && (
                    <p className="text-sm text-gray-400 mt-1">Not scheduled</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Campaign Duration */}
      {startDate && endDate && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Campaign Duration</span>
            <span className="font-medium text-gray-900">
              {Math.ceil(
                (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              )}{' '}
              days
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
