'use client';

import {
  CheckCircle2,
  Clock,
  Eye,
  UserCheck,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ContentItem } from '@/services/influencer-portal.service';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock; step: number }> = {
  pending: { label: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: Clock, step: 1 },
  internal_approved: { label: 'Internal Review', color: 'bg-purple-100 text-purple-800', icon: Eye, step: 2 },
  client_approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle2, step: 4 },
  changes_requested: { label: 'Changes Requested', color: 'bg-red-100 text-red-800', icon: AlertCircle, step: 0 },
};

const STEPS = [
  { label: 'Submitted', step: 1 },
  { label: 'Internal Review', step: 2 },
  { label: 'Client Review', step: 3 },
  { label: 'Approved', step: 4 },
];

const TYPE_LABEL: Record<string, string> = {
  script: 'Script',
  draft: 'Draft',
  video_draft: 'Video Draft',
  final: 'Final',
};

interface ContentStatusTrackerProps {
  content: ContentItem[];
}

function StatusFlow({ status }: { status: string }) {
  const config = STATUS_CONFIG[status];
  const isChangesRequested = status === 'changes_requested';

  // For client_approved, internal_approved maps to step 3 in progress
  const activeStep = status === 'internal_approved' ? 2
    : status === 'client_approved' ? 4
    : status === 'pending' ? 1
    : 0;

  return (
    <div className="mt-3">
      {isChangesRequested ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-800 font-medium">Changes Requested</span>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => {
            const isComplete = activeStep >= s.step;
            const isCurrent = activeStep === s.step;
            return (
              <div key={s.step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      isComplete
                        ? 'bg-purple-600 text-white'
                        : isCurrent
                        ? 'bg-purple-200 text-purple-800 ring-2 ring-purple-400'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isComplete ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.step}
                  </div>
                  <span className={`text-[10px] mt-1 text-center ${
                    isComplete || isCurrent ? 'text-purple-700 font-medium' : 'text-gray-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 ${
                    activeStep > s.step ? 'bg-purple-400' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ContentStatusTracker({ content }: ContentStatusTrackerProps) {
  if (content.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-600" />
            Content Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No content submitted yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-purple-600" />
          Content Status ({content.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {content.map((item) => {
          const config = STATUS_CONFIG[item.approvalStatus] || STATUS_CONFIG.pending;
          const StatusIcon = config.icon;

          return (
            <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {TYPE_LABEL[item.type] || item.type}
                    </span>
                    <span className="text-xs text-gray-400">v{item.version}</span>
                  </div>
                  {item.fileName && (
                    <p className="text-xs text-gray-500 mt-0.5">{item.fileName}</p>
                  )}
                </div>
                <Badge className={`text-[10px] ${config.color}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>

              {/* Visual Flow */}
              <StatusFlow status={item.approvalStatus} />

              {/* Feedback */}
              {item.approvalStatus === 'changes_requested' && (
                <>
                  {item.internalFeedback && (
                    <div className="mt-3 p-2 bg-amber-50 rounded text-xs">
                      <p className="font-medium text-amber-800 mb-0.5">Internal Feedback:</p>
                      <p className="text-amber-700">{item.internalFeedback}</p>
                    </div>
                  )}
                  {item.clientFeedback && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-xs">
                      <p className="font-medium text-red-800 mb-0.5">Client Feedback:</p>
                      <p className="text-red-700">{item.clientFeedback}</p>
                    </div>
                  )}
                </>
              )}

              <p className="text-[10px] text-gray-400 mt-2">
                Submitted {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
