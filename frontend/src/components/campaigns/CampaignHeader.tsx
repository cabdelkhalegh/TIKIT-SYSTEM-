'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft, Edit, Trash2, ChevronRight, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import CampaignStatusBadge from './CampaignStatusBadge';
import RiskBadge from './RiskBadge';
import { getNextForwardStatus } from '@/lib/campaign-helpers';

interface CampaignHeaderProps {
  campaign: any;
  onStatusChange: (newStatus: string) => void;
  onDelete: () => void;
  userRole: string;
}

const PHASE_LABELS: Record<string, string> = {
  brief_intake: 'Brief Intake',
  ai_structuring: 'AI Structuring',
  budget_review: 'Budget Review',
  influencer_matching: 'Influencer Matching',
  client_pitching: 'Client Pitching',
  content_production: 'Content Production',
  performance_tracking: 'Performance Tracking',
  report_generation: 'Report Generation',
  closure: 'Closure',
};

export default function CampaignHeader({
  campaign,
  onStatusChange,
  onDelete,
  userRole,
}: CampaignHeaderProps) {
  const router = useRouter();
  const [transitioning, setTransitioning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const nextStatus = getNextForwardStatus(campaign.status);
  const canEdit = ['director', 'campaign_manager', 'admin'].includes(userRole);
  const canDelete =
    campaign.status === 'draft' &&
    ['director', 'campaign_manager', 'admin'].includes(userRole);

  const handleAdvance = async () => {
    if (!nextStatus) return;
    setTransitioning(true);
    try {
      await onStatusChange(nextStatus);
    } finally {
      setTransitioning(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  const nextLabel = nextStatus
    ? nextStatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  return (
    <div className="mb-6">
      {/* Top row: back + name + badges */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => router.push('/dashboard/campaigns')}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <h1 className="text-2xl font-bold text-gray-900">{campaign.campaignName}</h1>

        {/* Display ID badge */}
        {campaign.displayId && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-gray-100 text-gray-700 border border-gray-200">
            {campaign.displayId}
          </span>
        )}

        <CampaignStatusBadge status={campaign.status} />

        {/* Phase indicator */}
        {campaign.phase && PHASE_LABELS[campaign.phase] && (
          <span className="text-xs text-gray-500">
            Phase: {PHASE_LABELS[campaign.phase]}
          </span>
        )}

        {/* Risk badge */}
        <RiskBadge
          score={campaign.riskScore || 0}
          level={campaign.riskLevel || 'low'}
          showScore
        />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <Link href={`/dashboard/campaigns/${campaign.campaignId}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
          </Link>
        )}

        {nextStatus && (
          <Button
            size="sm"
            onClick={handleAdvance}
            disabled={transitioning}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {transitioning ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-1.5" />
            )}
            Advance to {nextLabel}
          </Button>
        )}

        {campaign.status === 'live' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange('paused')}
            className="border-yellow-600 text-yellow-600 hover:bg-yellow-50"
          >
            Pause
          </Button>
        )}

        {campaign.status === 'paused' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange('live')}
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            Resume
          </Button>
        )}

        {canDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-1.5" />
            )}
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
