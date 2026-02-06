'use client';

import { useState } from 'react';
import { Upload, CheckCircle, XCircle } from 'lucide-react';
import type { Deliverable } from '@/types/collaboration.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DeliverableCard from './DeliverableCard';
import { toast } from 'sonner';

interface DeliverableManagerProps {
  collaborationId: string;
  deliverables: Deliverable[];
  canSubmit?: boolean;
  canReview?: boolean;
  onSubmit?: (deliverableId: string, data: { fileUrl?: string; notes?: string }) => Promise<void>;
  onApprove?: (deliverableId: string, feedback?: string) => Promise<void>;
  onReject?: (deliverableId: string, feedback?: string) => Promise<void>;
}

export default function DeliverableManager({
  collaborationId,
  deliverables,
  canSubmit = false,
  canReview = false,
  onSubmit,
  onApprove,
  onReject,
}: DeliverableManagerProps) {
  const [selectedDeliverable, setSelectedDeliverable] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (deliverableId: string) => {
    if (!onSubmit) return;

    if (!fileUrl.trim()) {
      toast.error('Please provide a file URL');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(deliverableId, { fileUrl, notes });
      toast.success('Deliverable submitted successfully');
      setSelectedDeliverable(null);
      setFileUrl('');
      setNotes('');
    } catch (error) {
      toast.error('Failed to submit deliverable');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (deliverableId: string) => {
    if (!onApprove) return;

    setIsSubmitting(true);
    try {
      await onApprove(deliverableId, feedback);
      toast.success('Deliverable approved');
      setSelectedDeliverable(null);
      setFeedback('');
    } catch (error) {
      toast.error('Failed to approve deliverable');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (deliverableId: string) => {
    if (!onReject) return;

    if (!feedback.trim()) {
      toast.error('Please provide feedback for rejection');
      return;
    }

    setIsSubmitting(true);
    try {
      await onReject(deliverableId, feedback);
      toast.success('Deliverable rejected');
      setSelectedDeliverable(null);
      setFeedback('');
    } catch (error) {
      toast.error('Failed to reject deliverable');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = {
    total: deliverables.length,
    pending: deliverables.filter((d) => d.status === 'pending').length,
    submitted: deliverables.filter((d) => d.status === 'submitted').length,
    approved: deliverables.filter((d) => d.status === 'approved').length,
    rejected: deliverables.filter((d) => d.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
          <div className="text-sm text-gray-600">Submitted</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          <div className="text-sm text-gray-600">Approved</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          <div className="text-sm text-gray-600">Rejected</div>
        </Card>
      </div>

      {/* Deliverables List */}
      <div className="space-y-4">
        {deliverables.length === 0 ? (
          <Card className="p-8 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Deliverables</h3>
            <p className="text-gray-600">No deliverables have been defined for this collaboration.</p>
          </Card>
        ) : (
          deliverables.map((deliverable) => (
            <div key={deliverable.id}>
              <DeliverableCard deliverable={deliverable} />
              
              {/* Submit Form */}
              {canSubmit && deliverable.status === 'pending' && selectedDeliverable === deliverable.id && (
                <Card className="p-4 mt-2 bg-blue-50 border-blue-200">
                  <h4 className="font-medium text-gray-900 mb-3">Submit Deliverable</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="fileUrl">File URL *</Label>
                      <Input
                        id="fileUrl"
                        value={fileUrl}
                        onChange={(e) => setFileUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={3}
                        placeholder="Add any notes about the deliverable..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSubmit(deliverable.id)}
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Submit
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedDeliverable(null);
                          setFileUrl('');
                          setNotes('');
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Review Form */}
              {canReview && deliverable.status === 'submitted' && selectedDeliverable === deliverable.id && (
                <Card className="p-4 mt-2 bg-yellow-50 border-yellow-200">
                  <h4 className="font-medium text-gray-900 mb-3">Review Deliverable</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="feedback">Feedback</Label>
                      <textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={3}
                        placeholder="Provide feedback..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(deliverable.id)}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReject(deliverable.id)}
                        disabled={isSubmitting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedDeliverable(null);
                          setFeedback('');
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Action Buttons */}
              {canSubmit && deliverable.status === 'pending' && selectedDeliverable !== deliverable.id && (
                <div className="mt-2">
                  <Button
                    onClick={() => setSelectedDeliverable(deliverable.id)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Deliverable
                  </Button>
                </div>
              )}

              {canReview && deliverable.status === 'submitted' && selectedDeliverable !== deliverable.id && (
                <div className="mt-2">
                  <Button
                    onClick={() => setSelectedDeliverable(deliverable.id)}
                    size="sm"
                    variant="outline"
                  >
                    Review Deliverable
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
