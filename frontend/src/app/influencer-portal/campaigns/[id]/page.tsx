'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  Send,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import BriefAcceptCard from '@/components/influencer-portal/BriefAcceptCard';
import ContentSubmissionForm from '@/components/influencer-portal/ContentSubmissionForm';
import ContentStatusTracker from '@/components/influencer-portal/ContentStatusTracker';
import { influencerPortalService } from '@/services/influencer-portal.service';

const STATUS_BADGE: Record<string, string> = {
  proposed: 'bg-gray-100 text-gray-700',
  in_review: 'bg-yellow-100 text-yellow-800',
  pitching: 'bg-orange-100 text-orange-800',
  live: 'bg-green-100 text-green-800',
  reporting: 'bg-blue-100 text-blue-800',
};

const PAYMENT_STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
};

export default function InfluencerCampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const queryClient = useQueryClient();
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'timeline' | 'rate'>('timeline');
  const [requestedValue, setRequestedValue] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['influencer-portal-campaign', campaignId],
    queryFn: () => influencerPortalService.getCampaign(campaignId),
    staleTime: 30_000,
  });

  const adjustmentMutation = useMutation({
    mutationFn: () => influencerPortalService.requestDeliverableAdjustment(campaignId, {
      adjustmentType,
      requestedValue,
      reason: adjustmentReason,
    }),
    onSuccess: () => {
      setShowAdjustment(false);
      setRequestedValue('');
      setAdjustmentReason('');
      queryClient.invalidateQueries({ queryKey: ['influencer-portal'] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  const campaign = data?.data;
  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Campaign not found or you don't have access.</p>
        <Link href="/influencer-portal/campaigns">
          <Button variant="outline" className="mt-4">Back to Campaigns</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/influencer-portal/campaigns">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-400 font-mono">{campaign.displayId}</p>
              <Badge className={`text-[10px] ${STATUS_BADGE[campaign.status] || 'bg-gray-100 text-gray-700'}`}>
                {campaign.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-0.5">{campaign.name}</h1>
            {campaign.startDate && campaign.endDate && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(campaign.startDate).toLocaleDateString()} — {new Date(campaign.endDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Brief Section */}
      <BriefAcceptCard
        campaignId={campaignId}
        brief={campaign.brief}
        assignment={campaign.assignment}
        endDate={campaign.endDate}
      />

      {/* Content Submission */}
      <ContentSubmissionForm
        campaignId={campaignId}
        briefAccepted={campaign.assignment.briefAccepted}
      />

      {/* Content Status Tracker */}
      <ContentStatusTracker content={campaign.content} />

      {/* Payment Info */}
      {campaign.payments && campaign.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              Payment Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {campaign.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {payment.invoiceType?.replace(/_/g, ' ') || 'Invoice'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {payment.amount && (
                      <span className="text-sm font-medium text-gray-900">
                        AED {payment.amount.toLocaleString()}
                      </span>
                    )}
                    <Badge className={`text-[10px] ${PAYMENT_STATUS_BADGE[payment.status] || 'bg-gray-100 text-gray-700'}`}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            {campaign.assignment.agreedCost && (
              <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
                <span className="text-gray-500">Agreed Fee:</span>{' '}
                <span className="font-semibold text-gray-900">
                  AED {campaign.assignment.agreedCost.toLocaleString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Deliverable Adjustment Request */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600" />
              Deliverable Adjustment
            </CardTitle>
            {!showAdjustment && (
              <Button variant="outline" size="sm" onClick={() => setShowAdjustment(true)}>
                Request Adjustment
              </Button>
            )}
          </div>
        </CardHeader>
        {showAdjustment && (
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">
                Adjustment Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAdjustmentType('timeline')}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    adjustmentType === 'timeline'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                  }`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setAdjustmentType('rate')}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    adjustmentType === 'rate'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                  }`}
                >
                  Rate
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">
                Requested Value
              </label>
              <input
                type="text"
                value={requestedValue}
                onChange={(e) => setRequestedValue(e.target.value)}
                placeholder={adjustmentType === 'timeline' ? 'e.g., 2026-03-15' : 'e.g., 6000'}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">
                Reason
              </label>
              <textarea
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Explain why you need this adjustment..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => adjustmentMutation.mutate()}
                disabled={!requestedValue || !adjustmentReason || adjustmentMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {adjustmentMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> Submit Request</>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowAdjustment(false)}>
                Cancel
              </Button>
            </div>

            {adjustmentMutation.isError && (
              <p className="text-sm text-red-600">
                {(adjustmentMutation.error as any)?.response?.data?.error || 'Failed to submit request'}
              </p>
            )}

            {adjustmentMutation.isSuccess && (
              <p className="text-sm text-green-600">Adjustment request submitted successfully!</p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
