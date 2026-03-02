'use client';

import { useState } from 'react';
import { Users, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Influencer {
  id: string;
  handle: string;
  displayName: string;
  platform: string;
  followers: number | null;
  profileImageUrl: string | null;
  aiScore: number | null;
}

interface ShortlistApprovalCardProps {
  campaignId: string;
  influencers: Influencer[];
  onApprove: () => void;
  onReject: (reason: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-100 text-pink-800',
  tiktok: 'bg-gray-900 text-white',
  youtube: 'bg-red-100 text-red-800',
  twitter: 'bg-blue-100 text-blue-800',
  snapchat: 'bg-yellow-100 text-yellow-800',
};

function formatFollowers(count: number | null): string {
  if (!count) return '-';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export default function ShortlistApprovalCard({
  campaignId,
  influencers,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
}: ShortlistApprovalCardProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    onReject(rejectReason.trim());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-purple-600" />
          Influencer Shortlist
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Influencer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {influencers.map((inf) => (
            <div
              key={inf.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white"
            >
              {/* Avatar */}
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm flex-shrink-0">
                {inf.displayName?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {inf.handle || inf.displayName}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${PLATFORM_COLORS[inf.platform] || 'bg-gray-100 text-gray-700'}`}>
                    {inf.platform}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatFollowers(inf.followers)}
                  </span>
                  {inf.aiScore != null && (
                    <span className="text-xs text-purple-600 font-medium">
                      AI: {Math.round(inf.aiScore)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        {!showRejectForm ? (
          <div className="flex gap-3">
            <Button
              onClick={onApprove}
              disabled={isApproving || isRejecting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isApproving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Approving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Approve Shortlist
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRejectForm(true)}
              disabled={isApproving || isRejecting}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Request Changes
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please explain why you'd like changes to the shortlist..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={3}
            />
            <div className="flex gap-3">
              <Button
                onClick={handleReject}
                disabled={!rejectReason.trim() || isRejecting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isRejecting ? 'Submitting...' : 'Submit Rejection'}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                disabled={isRejecting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
