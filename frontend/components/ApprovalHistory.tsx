'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { ContentApproval, Profile } from '@/types';

interface ApprovalHistoryProps {
  contentItemId: string;
}

interface ApprovalWithApprover extends ContentApproval {
  approver: Profile;
}

export default function ApprovalHistory({ contentItemId }: ApprovalHistoryProps) {
  const [approvals, setApprovals] = useState<ApprovalWithApprover[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchApprovalHistory();
  }, [contentItemId]);

  const fetchApprovalHistory = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('content_approvals')
        .select(`
          *,
          approver:approved_by (
            id,
            email,
            role
          )
        `)
        .eq('content_item_id', contentItemId)
        .order('approved_at', { ascending: false });

      if (error) throw error;

      setApprovals(data || []);
    } catch (err: any) {
      console.error('Error fetching approval history:', err);
      setError('Failed to load approval history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStageLabel = (stage: string | null) => {
    if (!stage) return 'Unknown';
    return stage === 'internal' ? 'Internal Review' : 'Client Review';
  };

  const getDecisionColor = (decision: string | null) => {
    if (!decision) return 'bg-gray-100 text-gray-800 border-gray-200';
    return decision === 'approved'
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getDecisionIcon = (decision: string | null) => {
    if (!decision) return '?';
    return decision === 'approved' ? '✓' : '✗';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval History</h3>
        <p className="text-gray-500">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval History</h3>
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (approvals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval History</h3>
        <p className="text-gray-500 text-sm italic">No approval actions yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Approval History
        <span className="ml-2 text-sm font-normal text-gray-500">
          ({approvals.length} {approvals.length === 1 ? 'action' : 'actions'})
        </span>
      </h3>

      <div className="space-y-4">
        {approvals.map((approval, index) => (
          <div
            key={approval.id}
            className="relative pl-8 pb-4 border-l-2 border-gray-200 last:border-l-0 last:pb-0"
          >
            {/* Timeline dot */}
            <div
              className={`absolute left-0 top-1 -ml-2 w-4 h-4 rounded-full border-2 border-white ${
                approval.decision === 'approved'
                  ? 'bg-green-500'
                  : 'bg-red-500'
              }`}
            />

            {/* Content */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getDecisionColor(
                        approval.decision
                      )}`}
                    >
                      {getDecisionIcon(approval.decision)}{' '}
                      {approval.decision === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                    <span className="text-xs font-medium text-gray-600">
                      {getStageLabel(approval.stage)}
                    </span>
                  </div>

                  <div className="text-sm text-gray-700">
                    <span className="font-medium">
                      {approval.approver?.email || 'Unknown User'}
                    </span>
                    <span className="text-gray-500 capitalize ml-1">
                      ({approval.approver?.role?.replace('_', ' ') || 'unknown'})
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(approval.approved_at)}
                  </div>
                </div>
              </div>

              {approval.notes && (
                <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {approval.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
