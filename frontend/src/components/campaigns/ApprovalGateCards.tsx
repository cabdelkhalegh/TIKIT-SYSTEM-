'use client';

import { CheckCircle, Clock, AlertTriangle, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface GateRequirement {
  label: string;
  met: boolean;
}

interface ApprovalGateCardsProps {
  campaign: any;
  onApprovalComplete: () => void;
  userRole: string;
}

const GATE_DEFINITIONS: Record<string, {
  title: string;
  targetStatus: string;
  requirements: (campaign: any) => GateRequirement[];
}> = {
  draft: {
    title: 'Brief Reviewed',
    targetStatus: 'in_review',
    requirements: () => [
      { label: 'Brief must be created', met: false },
      { label: 'Brief must be marked as reviewed', met: false },
    ],
  },
  in_review: {
    title: 'Budget Approval',
    targetStatus: 'pitching',
    requirements: () => [
      { label: 'Director must approve campaign budget', met: false },
    ],
  },
  pitching: {
    title: 'Shortlist Approval',
    targetStatus: 'live',
    requirements: () => [
      { label: 'Client must approve influencer shortlist', met: false },
    ],
  },
  live: {
    title: 'Live Posts',
    targetStatus: 'reporting',
    requirements: () => [
      { label: 'All influencers must have live post URLs', met: false },
    ],
  },
  reporting: {
    title: 'Report Approval',
    targetStatus: 'closed',
    requirements: () => [
      { label: 'Report must be client-approved', met: false },
      { label: 'All invoices must be settled', met: false },
    ],
  },
};

export default function ApprovalGateCards({
  campaign,
  onApprovalComplete,
  userRole,
}: ApprovalGateCardsProps) {
  const gate = GATE_DEFINITIONS[campaign.status];

  if (!gate) {
    return null;
  }

  const requirements = gate.requirements(campaign);
  const allMet = requirements.every((r) => r.met);
  const isDirector = userRole === 'director' || userRole === 'admin';

  return (
    <Card className="p-5 border-l-4 border-l-amber-400">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {allMet ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Clock className="h-5 w-5 text-amber-600" />
            )}
            <h4 className="font-semibold text-gray-900">
              Gate: {gate.title}
            </h4>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Required to advance to <span className="font-medium">{gate.targetStatus.replace('_', ' ')}</span>
          </p>

          <div className="space-y-2">
            {requirements.map((req, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                {req.met ? (
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : (
                  <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
                <span className={req.met ? 'text-green-700' : 'text-gray-600'}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 ml-4">
          <Button
            size="sm"
            disabled={!allMet}
            onClick={onApprovalComplete}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            Approve
          </Button>
          {isDirector && !allMet && (
            <Button
              size="sm"
              variant="outline"
              onClick={onApprovalComplete}
              className="text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Override
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
