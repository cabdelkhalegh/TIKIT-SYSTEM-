'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { ContentItem, Profile } from '@/types';

interface ApprovalControlsProps {
  contentItem: ContentItem;
  userProfile: Profile;
  onApprovalChange: () => void;
}

type ApprovalStage = 'internal' | 'client';
type ApprovalDecision = 'approved' | 'rejected';

export default function ApprovalControls({
  contentItem,
  userProfile,
  onApprovalChange,
}: ApprovalControlsProps) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState<'approve' | 'reject' | null>(null);

  const supabase = createClient();

  // Determine if user can approve at current stage
  const canApproveInternal = 
    (userProfile.role === 'director' || userProfile.role === 'reviewer') &&
    contentItem.status === 'pending_internal';

  const canApproveClient =
    (userProfile.role === 'director' || userProfile.role === 'client') &&
    contentItem.status === 'pending_client';

  const canApprove = canApproveInternal || canApproveClient;
  const currentStage: ApprovalStage = contentItem.status === 'pending_internal' ? 'internal' : 'client';

  if (!canApprove) {
    return null; // Don't show controls if user can't approve
  }

  const handleApproval = async (decision: ApprovalDecision) => {
    if (decision === 'rejected' && !notes.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Insert approval record
      const { error: approvalError } = await supabase
        .from('content_approvals')
        .insert({
          content_item_id: contentItem.id,
          stage: currentStage,
          decision,
          notes: notes.trim() || null,
          approved_by: userProfile.id,
        });

      if (approvalError) throw approvalError;

      // 2. Update content item status
      let newStatus: ContentItem['status'];
      
      if (currentStage === 'internal') {
        newStatus = decision === 'approved' ? 'pending_client' : 'internal_rejected';
      } else {
        newStatus = decision === 'approved' ? 'approved' : 'client_rejected';
      }

      const { error: updateError } = await supabase
        .from('content_items')
        .update({ status: newStatus })
        .eq('id', contentItem.id);

      if (updateError) throw updateError;

      // Success
      setNotes('');
      setShowConfirm(null);
      onApprovalChange();
    } catch (err: any) {
      console.error('Approval error:', err);
      setError(err.message || 'Failed to process approval');
    } finally {
      setLoading(false);
    }
  };

  const getStageLabel = () => {
    return currentStage === 'internal' ? 'Internal Review' : 'Client Review';
  };

  const getApproverLabel = () => {
    return currentStage === 'internal' ? 'Reviewer' : 'Client';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {getStageLabel()} - Pending Approval
        </h3>
        <p className="text-sm text-gray-600">
          As {getApproverLabel()}, you can approve or reject this content.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes {showConfirm === 'reject' && <span className="text-red-500">*</span>}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            showConfirm === 'reject'
              ? 'Please explain why you are rejecting this content...'
              : 'Optional notes or feedback...'
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          rows={4}
          disabled={loading}
        />
        {showConfirm === 'reject' && !notes.trim() && (
          <p className="mt-1 text-xs text-red-500">Rejection reason is required</p>
        )}
      </div>

      {!showConfirm && (
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirm('approve')}
            disabled={loading}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            ✓ Approve
          </button>
          <button
            onClick={() => setShowConfirm('reject')}
            disabled={loading}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            ✗ Reject
          </button>
        </div>
      )}

      {showConfirm && (
        <div className="space-y-3">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm font-medium text-yellow-800 mb-1">
              Confirm {showConfirm === 'approve' ? 'Approval' : 'Rejection'}
            </p>
            <p className="text-sm text-yellow-700">
              {showConfirm === 'approve'
                ? `This will ${currentStage === 'internal' ? 'send the content to client review' : 'mark the content as approved'}.`
                : 'This will reject the content and require resubmission.'}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleApproval(showConfirm === 'approve' ? 'approved' : 'rejected')}
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-md text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${
                showConfirm === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? 'Processing...' : `Confirm ${showConfirm === 'approve' ? 'Approval' : 'Rejection'}`}
            </button>
            <button
              onClick={() => {
                setShowConfirm(null);
                setError('');
              }}
              disabled={loading}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
