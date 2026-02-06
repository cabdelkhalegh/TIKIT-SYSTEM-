'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate, formatNumber, formatRelativeTime } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Eye,
  Heart,
  Target,
  Edit,
  Trash2,
  Download,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Upload,
  MessageSquare,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Share2,
  MessageCircle,
  PlayCircle,
  PauseCircle,
  Award,
  Activity,
  File,
  Plus,
  Send,
} from 'lucide-react';

interface Deliverable {
  deliverableId: string;
  type: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  attachments?: string[];
}

interface PaymentTransaction {
  transactionId: string;
  amount: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed';
  paidAt?: string;
  notes?: string;
}

interface PerformanceMetrics {
  reach?: number;
  impressions?: number;
  engagement?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  clicks?: number;
  conversions?: number;
  roi?: number;
}

interface ActivityEvent {
  eventId: string;
  type: 'invited' | 'accepted' | 'started' | 'deliverable_submitted' | 'deliverable_approved' | 'deliverable_rejected' | 'payment_processed' | 'completed' | 'cancelled' | 'note_added';
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  metadata?: any;
}

interface Note {
  noteId: string;
  content: string;
  createdAt: string;
  userId: string;
  userName: string;
}

interface Collaboration {
  collaborationId: string;
  campaignId: string;
  influencerId: string;
  role?: string;
  status: 'invited' | 'accepted' | 'active' | 'completed' | 'declined' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'failed';
  agreedAmount: number;
  paidAmount?: number;
  paymentMethod?: string;
  invitedAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  declinedAt?: string;
  cancelledAt?: string;
  deliverables: Deliverable[];
  performanceMetrics?: PerformanceMetrics;
  paymentTransactions?: PaymentTransaction[];
  activityTimeline?: ActivityEvent[];
  notes?: Note[];
  attachments?: Array<{
    fileId: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
    uploadedBy: string;
  }>;
  campaign: {
    campaignId: string;
    campaignName: string;
    status: string;
    startDate: string;
    endDate: string;
    client?: {
      brandDisplayName?: string;
      legalCompanyName?: string;
    };
  };
  influencer: {
    influencerId: string;
    fullName: string;
    username?: string;
    email?: string;
    profileImage?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  invited: { color: 'bg-blue-100 text-blue-800', icon: Clock },
  accepted: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  active: { color: 'bg-purple-100 text-purple-800', icon: PlayCircle },
  completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  declined: { color: 'bg-red-100 text-red-800', icon: XCircle },
  cancelled: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
};

const paymentStatusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  partial: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
};

const deliverableStatusConfig = {
  pending: { color: 'bg-gray-100 text-gray-800', icon: Clock },
  in_progress: { color: 'bg-blue-100 text-blue-800', icon: Activity },
  submitted: { color: 'bg-purple-100 text-purple-800', icon: Upload },
  approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
};

const activityIcons: Record<string, typeof Clock> = {
  invited: Send,
  accepted: CheckCircle,
  started: PlayCircle,
  deliverable_submitted: Upload,
  deliverable_approved: CheckCircle2,
  deliverable_rejected: XCircle,
  payment_processed: CreditCard,
  completed: Award,
  cancelled: AlertCircle,
  note_added: MessageSquare,
};

// Helper functions
const formatStatus = (status: string): string => {
  return status.replace('_', ' ').toUpperCase();
};

const isDeliverableOverdue = (deliverable: Deliverable): boolean => {
  return new Date(deliverable.dueDate) < new Date() && deliverable.status !== 'approved';
};

export default function CollaborationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const collaborationId = params.id as string;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deliverableDialogOpen, setDeliverableDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch collaboration data
  const { data: collaboration, isLoading, error } = useQuery({
    queryKey: ['collaboration', collaborationId],
    queryFn: async () => {
      const response = await apiClient.get(`/collaborations/${collaborationId}`);
      return response.data.data as Collaboration;
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiClient.patch(`/collaborations/${collaborationId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', collaborationId] });
      queryClient.invalidateQueries({ queryKey: ['collaborations'] });
      setStatusDialogOpen(false);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/collaborations/${collaborationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborations'] });
      router.push('/dashboard/collaborations');
    },
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiClient.post(`/collaborations/${collaborationId}/notes`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', collaborationId] });
      setNoteDialogOpen(false);
      setNoteContent('');
    },
  });

  // Approve/Reject deliverable mutation
  const updateDeliverableMutation = useMutation({
    mutationFn: async ({ deliverableId, status, reason }: { deliverableId: string; status: string; reason?: string }) => {
      await apiClient.patch(`/collaborations/${collaborationId}/deliverables/${deliverableId}`, { status, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', collaborationId] });
      setSelectedDeliverable(null);
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded" />
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !collaboration) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Collaboration Not Found
                </h3>
                <p className="text-gray-600 mb-4">
                  The collaboration you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
                </p>
                <Button onClick={() => router.push('/dashboard/collaborations')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Collaborations
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const completedDeliverables = collaboration.deliverables.filter(d => d.status === 'approved').length;
  const totalDeliverables = collaboration.deliverables.length;
  const deliverablesProgress = totalDeliverables > 0 ? (completedDeliverables / totalDeliverables) * 100 : 0;
  const paymentProgress = collaboration.agreedAmount > 0 ? ((collaboration.paidAmount || 0) / collaboration.agreedAmount) * 100 : 0;

  const StatusIcon = statusConfig[collaboration.status]?.icon || Clock;
  const PaymentStatusIcon = paymentStatusConfig[collaboration.paymentStatus]?.icon || Clock;

  // Calculate days remaining
  let daysRemaining = null;
  if (collaboration.status === 'active' && collaboration.campaign.endDate) {
    const endDate = new Date(collaboration.campaign.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Get next milestone
  const getNextMilestone = () => {
    const pendingDeliverables = collaboration.deliverables
      .filter(d => d.status === 'pending' || d.status === 'in_progress')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    
    if (pendingDeliverables.length > 0) {
      return `${pendingDeliverables[0].type} due ${formatRelativeTime(pendingDeliverables[0].dueDate)}`;
    }
    return 'All deliverables completed';
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header Section */}
        <div className="mb-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="hover:text-gray-900"
            >
              Dashboard
            </button>
            <ChevronRight className="h-4 w-4" />
            <button
              onClick={() => router.push('/dashboard/collaborations')}
              className="hover:text-gray-900"
            >
              Collaborations
            </button>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900">
              {collaboration.campaign.campaignName} × {collaboration.influencer.fullName}
            </span>
          </div>

          {/* Title and Actions */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard/collaborations')}
                  className="p-1 h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold text-gray-900">
                  {collaboration.campaign.campaignName} × {collaboration.influencer.fullName}
                </h1>
              </div>
              <div className="flex items-center gap-3 ml-11">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig[collaboration.status].color}`}>
                  <StatusIcon className="h-4 w-4" />
                  {formatStatus(collaboration.status)}
                </span>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${paymentStatusConfig[collaboration.paymentStatus].color}`}>
                  <PaymentStatusIcon className="h-4 w-4" />
                  Payment: {formatStatus(collaboration.paymentStatus)}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedStatus(collaboration.status);
                  setStatusDialogOpen(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Update Status
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>Collaboration details and timeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Campaign</label>
                    <button
                      onClick={() => router.push(`/dashboard/campaigns/${collaboration.campaign.campaignId}`)}
                      className="mt-1 text-lg font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                    >
                      {collaboration.campaign.campaignName}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    {collaboration.campaign.client && (
                      <p className="text-sm text-gray-600">
                        {collaboration.campaign.client.brandDisplayName || collaboration.campaign.client.legalCompanyName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Influencer</label>
                    <button
                      onClick={() => router.push(`/dashboard/influencers/${collaboration.influencer.influencerId}`)}
                      className="mt-1 text-lg font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                    >
                      {collaboration.influencer.fullName}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    {collaboration.influencer.username && (
                      <p className="text-sm text-gray-600">@{collaboration.influencer.username}</p>
                    )}
                  </div>
                  {collaboration.role && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Role</label>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{collaboration.role}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Agreement Date</label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {formatDate(collaboration.acceptedAt || collaboration.invitedAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Start Date</label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {collaboration.startedAt ? formatDate(collaboration.startedAt) : formatDate(collaboration.campaign.startDate)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">End Date</label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {collaboration.completedAt ? formatDate(collaboration.completedAt) : formatDate(collaboration.campaign.endDate)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Agreed Amount</label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {formatCurrency(collaboration.agreedAmount)}
                    </p>
                  </div>
                  {collaboration.paymentMethod && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Payment Method</label>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {collaboration.paymentMethod}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Deliverables Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Deliverables</CardTitle>
                    <CardDescription>
                      {completedDeliverables} of {totalDeliverables} completed
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setDeliverableDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Deliverable
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                      <span className="text-sm font-medium text-gray-900">{Math.round(deliverablesProgress)}%</span>
                    </div>
                    <Progress value={deliverablesProgress} className="h-2" />
                  </div>

                  {/* Deliverables List */}
                  {collaboration.deliverables.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>No deliverables yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {collaboration.deliverables.map((deliverable) => {
                        const DeliverableIcon = deliverableStatusConfig[deliverable.status]?.icon || Clock;
                        const isOverdue = isDeliverableOverdue(deliverable);
                        
                        return (
                          <div
                            key={deliverable.deliverableId}
                            className="border rounded-lg p-4 hover:border-purple-300 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <DeliverableIcon className="h-5 w-5 text-gray-600" />
                                  <h4 className="font-semibold text-gray-900">{deliverable.type}</h4>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${deliverableStatusConfig[deliverable.status].color}`}>
                                    {formatStatus(deliverable.status)}
                                  </span>
                                  {isOverdue && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Overdue
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{deliverable.description}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Due: {formatDate(deliverable.dueDate)}
                                  </span>
                                  {deliverable.submittedAt && (
                                    <span className="flex items-center gap-1">
                                      <Upload className="h-3 w-3" />
                                      Submitted: {formatDate(deliverable.submittedAt)}
                                    </span>
                                  )}
                                </div>
                                {deliverable.status === 'rejected' && deliverable.rejectionReason && (
                                  <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                                    <strong>Rejection reason:</strong> {deliverable.rejectionReason}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {deliverable.status === 'submitted' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateDeliverableMutation.mutate({
                                        deliverableId: deliverable.deliverableId,
                                        status: 'approved'
                                      })}
                                      className="text-green-600 hover:text-green-700"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setSelectedDeliverable(deliverable)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Tracking */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Payment Tracking</CardTitle>
                    <CardDescription>Payment details and history</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setPaymentDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Agreed Amount</label>
                      <p className="mt-1 text-2xl font-bold text-gray-900">
                        {formatCurrency(collaboration.agreedAmount)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Paid Amount</label>
                      <p className="mt-1 text-2xl font-bold text-green-600">
                        {formatCurrency(collaboration.paidAmount || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Payment Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Payment Progress</span>
                      <span className="text-sm font-medium text-gray-900">{Math.round(paymentProgress)}%</span>
                    </div>
                    <Progress value={paymentProgress} className="h-2" />
                  </div>

                  {/* Payment Transactions */}
                  {collaboration.paymentTransactions && collaboration.paymentTransactions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Payment History</h4>
                      <div className="space-y-2">
                        {collaboration.paymentTransactions.map((transaction) => (
                          <div
                            key={transaction.transactionId}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-5 w-5 text-gray-600" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {formatCurrency(transaction.amount)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {transaction.paymentMethod} • {transaction.paidAt ? formatDate(transaction.paidAt) : 'Pending'}
                                </p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                              transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {transaction.status.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics (if completed) */}
            {collaboration.status === 'completed' && collaboration.performanceMetrics && (
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Campaign performance results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {collaboration.performanceMetrics.reach && (
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">
                          {formatNumber(collaboration.performanceMetrics.reach)}
                        </p>
                        <p className="text-sm text-gray-600">Reach</p>
                      </div>
                    )}
                    {collaboration.performanceMetrics.impressions && (
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Eye className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">
                          {formatNumber(collaboration.performanceMetrics.impressions)}
                        </p>
                        <p className="text-sm text-gray-600">Impressions</p>
                      </div>
                    )}
                    {collaboration.performanceMetrics.engagement && (
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">
                          {formatNumber(collaboration.performanceMetrics.engagement)}
                        </p>
                        <p className="text-sm text-gray-600">Engagement</p>
                      </div>
                    )}
                    {collaboration.performanceMetrics.likes && (
                      <div className="text-center p-4 bg-pink-50 rounded-lg">
                        <Heart className="h-6 w-6 text-pink-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">
                          {formatNumber(collaboration.performanceMetrics.likes)}
                        </p>
                        <p className="text-sm text-gray-600">Likes</p>
                      </div>
                    )}
                    {collaboration.performanceMetrics.comments && (
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <MessageCircle className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">
                          {formatNumber(collaboration.performanceMetrics.comments)}
                        </p>
                        <p className="text-sm text-gray-600">Comments</p>
                      </div>
                    )}
                    {collaboration.performanceMetrics.shares && (
                      <div className="text-center p-4 bg-indigo-50 rounded-lg">
                        <Share2 className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">
                          {formatNumber(collaboration.performanceMetrics.shares)}
                        </p>
                        <p className="text-sm text-gray-600">Shares</p>
                      </div>
                    )}
                    {collaboration.performanceMetrics.roi && (
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <Target className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">
                          {collaboration.performanceMetrics.roi}%
                        </p>
                        <p className="text-sm text-gray-600">ROI</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>Chronological event history</CardDescription>
              </CardHeader>
              <CardContent>
                {collaboration.activityTimeline && collaboration.activityTimeline.length > 0 ? (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                    <div className="space-y-6">
                      {collaboration.activityTimeline.map((event, index) => {
                        const EventIcon = activityIcons[event.type] || Clock;
                        return (
                          <div key={event.eventId} className="relative flex gap-4">
                            <div className="relative z-10 flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <EventIcon className="h-4 w-4 text-purple-600" />
                              </div>
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="font-medium text-gray-900">{event.description}</p>
                              <p className="text-sm text-gray-500">{formatDate(event.timestamp)}</p>
                              {event.userName && (
                                <p className="text-sm text-gray-500">by {event.userName}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No activity recorded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Files & Assets */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Files & Assets</CardTitle>
                    <CardDescription>Uploaded files and content</CardDescription>
                  </div>
                  <Button size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {collaboration.attachments && collaboration.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {collaboration.attachments.map((file) => (
                      <div
                        key={file.fileId}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <File className="h-5 w-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">{file.fileName}</p>
                            <p className="text-sm text-gray-500">
                              Uploaded {formatDate(file.uploadedAt)} by {file.uploadedBy}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <File className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No files uploaded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Communication Log */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Communication Log</CardTitle>
                    <CardDescription>Notes and messages</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setNoteDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {collaboration.notes && collaboration.notes.length > 0 ? (
                  <div className="space-y-4">
                    {collaboration.notes.map((note) => (
                      <div key={note.noteId} className="border-l-4 border-purple-500 pl-4 py-2">
                        <p className="text-gray-900 mb-1">{note.content}</p>
                        <p className="text-sm text-gray-500">
                          {note.userName} • {formatDate(note.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No notes yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Collaboration ID</label>
                  <p className="mt-1 font-mono text-sm text-gray-900">{collaboration.collaborationId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig[collaboration.status].color}`}>
                      <StatusIcon className="h-4 w-4" />
                      {formatStatus(collaboration.status)}
                    </span>
                  </p>
                </div>
                {daysRemaining !== null && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Days Remaining</label>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {daysRemaining > 0 ? daysRemaining : 0}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Completion</label>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {Math.round(deliverablesProgress)}%
                  </p>
                  <Progress value={deliverablesProgress} className="mt-2 h-2" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Next Milestone</label>
                  <p className="mt-1 text-sm text-gray-900">{getNextMilestone()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatRelativeTime(collaboration.updatedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/campaigns/${collaboration.campaign.campaignId}`)}
                >
                  <Target className="h-4 w-4 mr-2" />
                  View Campaign
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/influencers/${collaboration.influencer.influencerId}`)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  View Influencer
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setNoteDialogOpen(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setPaymentDialogOpen(true)}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Collaboration</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this collaboration? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Status Dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Status</DialogTitle>
              <DialogDescription>
                Change the collaboration status
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invited">Invited</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => updateStatusMutation.mutate(selectedStatus)}
                disabled={updateStatusMutation.isPending || !selectedStatus}
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Note Dialog */}
        <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
              <DialogDescription>
                Add a note or comment to this collaboration
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter your note..."
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => addNoteMutation.mutate(noteContent)}
                disabled={addNoteMutation.isPending || !noteContent.trim()}
              >
                {addNoteMutation.isPending ? 'Adding...' : 'Add Note'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Deliverable Dialog */}
        {selectedDeliverable && (
          <Dialog open={!!selectedDeliverable} onOpenChange={() => setSelectedDeliverable(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Deliverable</DialogTitle>
                <DialogDescription>
                  Provide a reason for rejecting this deliverable
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea
                  placeholder="Enter rejection reason..."
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setSelectedDeliverable(null);
                  setRejectionReason('');
                }}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    updateDeliverableMutation.mutate({
                      deliverableId: selectedDeliverable.deliverableId,
                      status: 'rejected',
                      reason: rejectionReason
                    });
                    setRejectionReason('');
                  }}
                  disabled={updateDeliverableMutation.isPending}
                >
                  {updateDeliverableMutation.isPending ? 'Rejecting...' : 'Reject'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
