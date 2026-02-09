'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  XCircle,
  Play,
  Flag,
  Ban,
  BarChart3,
  FileText,
  DollarSign,
  MessageSquare,
} from 'lucide-react';
import { collaborationService } from '@/services/collaboration.service';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import CollaborationStatusBadge from '@/components/collaborations/CollaborationStatusBadge';
import PaymentStatusBadge from '@/components/collaborations/PaymentStatusBadge';
import CollaborationTimeline from '@/components/collaborations/CollaborationTimeline';
import DeliverableManager from '@/components/collaborations/DeliverableManager';
import PaymentTracker from '@/components/collaborations/PaymentTracker';
import NotesSection from '@/components/collaborations/NotesSection';
import { formatCurrency, formatDate, safeJsonParse } from '@/lib/utils';
import { toast } from 'sonner';
import type { PaymentStatus, CollaborationStatus } from '@/types/collaboration.types';

export default function CollaborationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<'overview' | 'deliverables' | 'payment' | 'analytics' | 'notes'>('overview');

  const { data, isLoading, error } = useQuery({
    queryKey: ['collaboration', id],
    queryFn: () => collaborationService.getById(id),
    enabled: !!id,
  });

  const collaboration = data?.data;

  const { data: analyticsData } = useQuery({
    queryKey: ['collaboration-analytics', id],
    queryFn: () => collaborationService.getAnalytics(id),
    enabled: !!id && activeTab === 'analytics',
  });

  const { data: notesData, refetch: refetchNotes } = useQuery({
    queryKey: ['collaboration-notes', id],
    queryFn: () => collaborationService.getNotes(id),
    enabled: !!id && activeTab === 'notes',
  });

  const acceptMutation = useMutation({
    mutationFn: () => collaborationService.accept(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', id] });
      toast.success('Collaboration accepted');
    },
    onError: () => toast.error('Failed to accept collaboration'),
  });

  const declineMutation = useMutation({
    mutationFn: () => collaborationService.decline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', id] });
      toast.success('Collaboration declined');
    },
    onError: () => toast.error('Failed to decline collaboration'),
  });

  const startMutation = useMutation({
    mutationFn: () => collaborationService.start(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', id] });
      toast.success('Collaboration started');
    },
    onError: () => toast.error('Failed to start collaboration'),
  });

  const completeMutation = useMutation({
    mutationFn: () => collaborationService.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', id] });
      toast.success('Collaboration completed');
    },
    onError: () => toast.error('Failed to complete collaboration'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => collaborationService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', id] });
      toast.success('Collaboration cancelled');
    },
    onError: () => toast.error('Failed to cancel collaboration'),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: (status: PaymentStatus) => collaborationService.updatePayment(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', id] });
      toast.success('Payment status updated');
    },
    onError: () => toast.error('Failed to update payment status'),
  });

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => collaborationService.addNote(id, { content }),
    onSuccess: () => {
      refetchNotes();
      toast.success('Note added');
    },
    onError: () => toast.error('Failed to add note'),
  });

  const handleSubmitDeliverable = async (deliverableId: string, data: { fileUrl?: string; notes?: string }) => {
    await collaborationService.submitDeliverable(id, { deliverableId, ...data });
    queryClient.invalidateQueries({ queryKey: ['collaboration', id] });
  };

  const handleApproveDeliverable = async (deliverableId: string, feedback?: string) => {
    await collaborationService.approveDeliverable(id, deliverableId, feedback);
    queryClient.invalidateQueries({ queryKey: ['collaboration', id] });
  };

  const handleRejectDeliverable = async (deliverableId: string, feedback?: string) => {
    await collaborationService.rejectDeliverable(id, deliverableId, feedback);
    queryClient.invalidateQueries({ queryKey: ['collaboration', id] });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading collaboration...</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !collaboration) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card className="p-8 text-center">
            <p className="text-red-600">Error loading collaboration</p>
            <Button onClick={() => router.back()} className="mt-4" variant="outline">
              Go Back
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: FileText },
    { id: 'deliverables' as const, label: 'Deliverables', icon: CheckCircle },
    { id: 'payment' as const, label: 'Payment', icon: DollarSign },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'notes' as const, label: 'Notes', icon: MessageSquare },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Link href="/dashboard/collaborations" className="hover:text-gray-900">
              Collaborations
            </Link>
            <span>/</span>
            <span className="text-gray-900">{collaboration.campaign?.campaignName || 'Detail'}</span>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {collaboration.campaign?.campaignName} × {collaboration.influencer?.displayName || collaboration.influencer?.fullName}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <CollaborationStatusBadge status={collaboration.collaborationStatus as CollaborationStatus} />
                <PaymentStatusBadge status={collaboration.paymentStatus} />
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/collaborations/${id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-2">
          {collaboration.collaborationStatus === 'invited' && (
            <>
              <Button
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept
              </Button>
              <Button
                onClick={() => declineMutation.mutate()}
                disabled={declineMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline
              </Button>
            </>
          )}
          {collaboration.collaborationStatus === 'accepted' && (
            <Button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          )}
          {collaboration.collaborationStatus === 'active' && (
            <Button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Flag className="h-4 w-4 mr-2" />
              Complete
            </Button>
          )}
          {['invited', 'accepted', 'active'].includes(collaboration.collaborationStatus) && (
            <Button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              variant="outline"
              className="text-red-600 hover:text-red-700 border-red-300"
            >
              <Ban className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-4 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Campaign Info */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Campaign:</span>
                      <Link
                        href={`/dashboard/campaigns/${collaboration.campaignId}`}
                        className="font-medium text-purple-600 hover:text-purple-700"
                      >
                        {collaboration.campaign?.campaignName}
                      </Link>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Client ID:</span>
                      <span className="font-medium text-gray-900">
                        {collaboration.campaign?.clientId}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Influencer Info */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Influencer Information</h3>
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-2xl font-medium text-purple-700">
                        {(collaboration.influencer?.displayName || collaboration.influencer?.fullName || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <Link
                          href={`/dashboard/influencers/${collaboration.influencerId}`}
                          className="font-medium text-purple-600 hover:text-purple-700"
                        >
                          {collaboration.influencer?.displayName || collaboration.influencer?.fullName}
                        </Link>
                      </div>
                      {collaboration.influencer?.displayName && collaboration.influencer?.fullName && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Full Name:</span>
                          <span className="font-medium text-gray-900">
                            {collaboration.influencer.fullName}
                          </span>
                        </div>
                      )}
                      {collaboration.influencer?.primaryPlatform && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Platform:</span>
                          <span className="font-medium text-gray-900">
                            {collaboration.influencer.primaryPlatform}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Collaboration Details */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Collaboration Details</h3>
                  <div className="space-y-3">
                    {collaboration.role && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Role:</span>
                        <span className="font-medium text-gray-900">{collaboration.role}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Agreed Payment:</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(collaboration.agreedPayment || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deliverables:</span>
                      <span className="font-medium text-gray-900">
                        {safeJsonParse<any[]>(collaboration.agreedDeliverables, []).length}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Timeline */}
              <div>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                  <CollaborationTimeline
                    invitedAt={collaboration.invitedAt}
                    acceptedAt={collaboration.acceptedAt}
                    completedAt={collaboration.completedAt}
                    status={collaboration.collaborationStatus}
                  />
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'deliverables' && (
            <DeliverableManager
              collaborationId={id}
              deliverables={safeJsonParse<any[]>(collaboration.agreedDeliverables, [])}
              canSubmit={collaboration.collaborationStatus === 'active'}
              canReview={collaboration.collaborationStatus === 'active'}
              onSubmit={handleSubmitDeliverable}
              onApprove={handleApproveDeliverable}
              onReject={handleRejectDeliverable}
            />
          )}

          {activeTab === 'payment' && (
            <PaymentTracker
              agreedAmount={collaboration.agreedPayment}
              paymentStatus={collaboration.paymentStatus}
              onUpdateStatus={async (status) => {
                await updatePaymentMutation.mutateAsync(status);
              }}
              canUpdateStatus={true}
            />
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Reach</h3>
                <div className="text-3xl font-bold text-gray-900">
                  {analyticsData?.data.performanceMetrics?.reach?.toLocaleString() || 0}
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Impressions</h3>
                <div className="text-3xl font-bold text-gray-900">
                  {analyticsData?.data.performanceMetrics?.impressions?.toLocaleString() || 0}
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Engagement</h3>
                <div className="text-3xl font-bold text-gray-900">
                  {analyticsData?.data.performanceMetrics?.engagement?.toLocaleString() || 0}
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Deliverables</h3>
                <div className="text-3xl font-bold text-gray-900">
                  {analyticsData?.data.totalDeliverables || 0}
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Completed</h3>
                <div className="text-3xl font-bold text-green-600">
                  {analyticsData?.data.completedDeliverables || 0}
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Pending</h3>
                <div className="text-3xl font-bold text-yellow-600">
                  {analyticsData?.data.pendingDeliverables || 0}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'notes' && (
            <NotesSection
              notes={notesData?.data || []}
              onAddNote={async (content) => {
                await addNoteMutation.mutateAsync(content);
              }}
              canAddNote={true}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
