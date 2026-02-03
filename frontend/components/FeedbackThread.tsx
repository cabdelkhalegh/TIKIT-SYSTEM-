'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { ContentFeedback, Profile } from '@/types';

interface FeedbackThreadProps {
  contentItemId: string;
  contentVersionId?: string;
  userProfile: Profile;
}

interface FeedbackWithAuthor extends ContentFeedback {
  author: Profile;
  replies?: FeedbackWithAuthor[];
}

export default function FeedbackThread({
  contentItemId,
  contentVersionId,
  userProfile,
}: FeedbackThreadProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [error, setError] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchFeedbacks();
  }, [contentItemId, contentVersionId]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      
      // Fetch feedbacks with author information
      const { data, error } = await supabase
        .from('content_feedback')
        .select(`
          *,
          author:created_by (
            id,
            email,
            role,
            role_approved
          )
        `)
        .eq('content_item_id', contentItemId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize into threads
      const feedbackMap = new Map<string, FeedbackWithAuthor>();
      const rootFeedbacks: FeedbackWithAuthor[] = [];

      // First pass: create all feedback objects
      data?.forEach((fb: any) => {
        const feedback: FeedbackWithAuthor = {
          ...fb,
          author: fb.author,
          replies: [],
        };
        feedbackMap.set(fb.id, feedback);
      });

      // Second pass: organize into threads
      data?.forEach((fb: any) => {
        const feedback = feedbackMap.get(fb.id)!;
        if (fb.parent_feedback_id) {
          const parent = feedbackMap.get(fb.parent_feedback_id);
          if (parent) {
            parent.replies!.push(feedback);
          }
        } else {
          rootFeedbacks.push(feedback);
        }
      });

      setFeedbacks(rootFeedbacks);
    } catch (err: any) {
      console.error('Error fetching feedbacks:', err);
      setError('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { error } = await supabase
        .from('content_feedback')
        .insert({
          content_item_id: contentItemId,
          content_version_id: contentVersionId || null,
          comment: newComment.trim(),
          parent_feedback_id: replyTo,
          created_by: userProfile.id,
        });

      if (error) throw error;

      setNewComment('');
      setReplyTo(null);
      await fetchFeedbacks();
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setError(err.message || 'Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleResolve = async (feedbackId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('content_feedback')
        .update({
          is_resolved: !currentStatus,
          resolved_at: !currentStatus ? new Date().toISOString() : null,
          resolved_by: !currentStatus ? userProfile.id : null,
        })
        .eq('id', feedbackId);

      if (error) throw error;
      await fetchFeedbacks();
    } catch (err: any) {
      console.error('Error toggling resolve:', err);
      setError('Failed to update resolve status');
    }
  };

  const canResolve = 
    userProfile.role === 'director' ||
    userProfile.role === 'campaign_manager' ||
    userProfile.role === 'reviewer';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderFeedback = (feedback: FeedbackWithAuthor, isReply = false) => (
    <div key={feedback.id} className={`${isReply ? 'ml-8 mt-3' : 'mb-4'}`}>
      <div className={`p-4 rounded-lg ${feedback.is_resolved ? 'bg-gray-50 border border-gray-200' : 'bg-white border border-gray-200'}`}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-700">
                {feedback.author?.email?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <div className="font-medium text-sm text-gray-900">
                {feedback.author?.email || 'Unknown User'}
                <span className="ml-2 text-xs text-gray-500 capitalize">
                  ({feedback.author?.role?.replace('_', ' ') || 'unknown'})
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(feedback.created_at)}
              </div>
            </div>
          </div>

          {feedback.is_resolved && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
              ✓ Resolved
            </span>
          )}
        </div>

        <p className="text-gray-700 text-sm whitespace-pre-wrap mb-3">
          {feedback.comment}
        </p>

        <div className="flex gap-3 text-sm">
          <button
            onClick={() => setReplyTo(feedback.id)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Reply
          </button>

          {canResolve && !isReply && (
            <button
              onClick={() => handleToggleResolve(feedback.id, feedback.is_resolved)}
              className={`font-medium ${
                feedback.is_resolved
                  ? 'text-gray-600 hover:text-gray-700'
                  : 'text-green-600 hover:text-green-700'
              }`}
            >
              {feedback.is_resolved ? 'Unresolve' : 'Mark Resolved'}
            </button>
          )}
        </div>

        {replyTo === feedback.id && (
          <form onSubmit={handleSubmit} className="mt-3 border-t pt-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your reply..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              rows={3}
              disabled={submitting}
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              >
                {submitting ? 'Posting...' : 'Post Reply'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyTo(null);
                  setNewComment('');
                  setError('');
                }}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {feedback.replies && feedback.replies.length > 0 && (
        <div className="mt-2">
          {feedback.replies.map((reply) => renderFeedback(reply, true))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback & Comments</h3>
        <p className="text-gray-500">Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Feedback & Comments
        {feedbacks.length > 0 && (
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({feedbacks.length} {feedbacks.length === 1 ? 'thread' : 'threads'})
          </span>
        )}
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* New comment form (when not replying) */}
      {!replyTo && (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment or feedback..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            rows={3}
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      )}

      {/* Feedback threads */}
      {feedbacks.length === 0 ? (
        <p className="text-gray-500 text-sm italic">
          No feedback yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => renderFeedback(feedback))}
        </div>
      )}
    </div>
  );
}
