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
import CampaignPerformanceChart from '@/components/charts/CampaignPerformanceChart';
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
  Pause,
  Play,
} from 'lucide-react';

interface Campaign {
  campaignId: string;
  campaignName: string;
  campaignDescription?: string;
  clientId: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  totalBudget: number;
  allocatedBudget?: number;
  spentBudget: number;
  startDate: string;
  endDate: string;
  targetAudience?: any;
  platforms?: string[];
  createdAt?: string;
  updatedAt?: string;
  client?: {
    clientId: string;
    brandDisplayName?: string;
    legalCompanyName?: string;
  };
  campaignInfluencers?: Array<{
    influencerId: string;
    status: string;
    agreedBudget?: number;
    influencer: {
      influencerId: string;
      displayName?: string;
      fullName?: string;
    };
  }>;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const campaignId = params.id as string;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch campaign data
  const { data: campaign, isLoading, error } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const response = await apiClient.get(`/campaigns/${campaignId}`);
      return response.data.data as Campaign;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/campaigns/${campaignId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      router.push('/dashboard/campaigns');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
    setDeleteDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateBudgetUtilization = (spent: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((spent / total) * 100);
  };

  const getBudgetColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600';
    if (utilization >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getBudgetBarColor = (utilization: number) => {
    if (utilization >= 90) return 'bg-red-600';
    if (utilization >= 75) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded" />
              <div className="h-48 bg-gray-200 rounded" />
            </div>
            <div className="space-y-6">
              <div className="h-96 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <p>Failed to load campaign details. Please try again later.</p>
              </div>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/dashboard/campaigns')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Not found
  if (!campaign) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card className="border-gray-200">
            <CardContent className="pt-6 text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Campaign not found</h3>
              <p className="text-gray-600 mb-4">
                The campaign you&apos;re looking for doesn&apos;t exist or has been deleted.
              </p>
              <Button onClick={() => router.push('/dashboard/campaigns')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const budgetUtilization = calculateBudgetUtilization(campaign.spentBudget, campaign.totalBudget);
  const remainingBudget = campaign.totalBudget - campaign.spentBudget;
  const allocatedBudget = campaign.allocatedBudget || 0;
  const duration = calculateDuration(campaign.startDate, campaign.endDate);

  // Mock data for charts (in real app, this would come from API)
  const performanceData = [
    { date: 'Week 1', value: 1200, label: 'Engagement' },
    { date: 'Week 2', value: 1800, label: 'Engagement' },
    { date: 'Week 3', value: 2400, label: 'Engagement' },
    { date: 'Week 4', value: 3200, label: 'Engagement' },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex items-center text-sm text-gray-600">
            <button
              onClick={() => router.push('/dashboard')}
              className="hover:text-purple-600 transition-colors"
            >
              Dashboard
            </button>
            <ChevronRight className="h-4 w-4 mx-2" />
            <button
              onClick={() => router.push('/dashboard/campaigns')}
              className="hover:text-purple-600 transition-colors"
            >
              Campaigns
            </button>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-900 font-medium">{campaign.campaignName}</span>
          </nav>
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/campaigns')}
                className="mb-4 -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Button>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{campaign.campaignName}</h1>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    campaign.status
                  )}`}
                >
                  {getStatusIcon(campaign.status)}
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </span>
              </div>
              {campaign.campaignDescription && (
                <p className="text-gray-600 mt-2">{campaign.campaignDescription}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Client</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {campaign.client?.brandDisplayName || campaign.client?.legalCompanyName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Duration</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{duration} days</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Start Date</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">{formatDate(campaign.startDate)}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">End Date</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">{formatDate(campaign.endDate)}</p>
                    </div>
                  </div>
                  {campaign.platforms && campaign.platforms.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-600">Platforms</label>
                      <div className="flex gap-2 mt-2">
                        {campaign.platforms.map((platform) => (
                          <span
                            key={platform}
                            className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                          >
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Budget Section */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Overview</CardTitle>
                <CardDescription>Track campaign spending and allocation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Budget Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 mb-1">Total Budget</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(campaign.totalBudget)}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 mb-1">Allocated</p>
                      <p className="text-xl font-bold text-purple-900">
                        {formatCurrency(allocatedBudget)}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 mb-1">Spent</p>
                      <p className="text-xl font-bold text-blue-900">
                        {formatCurrency(campaign.spentBudget)}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 mb-1">Remaining</p>
                      <p className="text-xl font-bold text-green-900">
                        {formatCurrency(remainingBudget)}
                      </p>
                    </div>
                  </div>

                  {/* Budget Utilization */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Budget Utilization</span>
                      <span className={`text-sm font-bold ${getBudgetColor(budgetUtilization)}`}>
                        {budgetUtilization}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${getBudgetBarColor(
                          budgetUtilization
                        )}`}
                        style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                      />
                    </div>
                    {budgetUtilization >= 90 && (
                      <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Warning: Budget utilization is high
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Eye className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(Math.floor(Math.random() * 100000))}
                  </p>
                  <p className="text-sm text-gray-600">Total Reach</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Heart className="h-8 w-8 text-pink-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(Math.floor(Math.random() * 50000))}
                  </p>
                  <p className="text-sm text-gray-600">Total Engagement</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(Math.floor(Math.random() * 200000))}
                  </p>
                  <p className="text-sm text-gray-600">Impressions</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {campaign.campaignInfluencers?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Collaborations</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Performance</CardTitle>
                <CardDescription>Track engagement metrics over time</CardDescription>
              </CardHeader>
              <CardContent>
                <CampaignPerformanceChart data={performanceData} title="" />
              </CardContent>
            </Card>

            {/* Collaborations Table */}
            <Card>
              <CardHeader>
                <CardTitle>Influencer Collaborations</CardTitle>
                <CardDescription>
                  {campaign.campaignInfluencers?.length || 0} influencer(s) working on this campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                {campaign.campaignInfluencers && campaign.campaignInfluencers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                            Influencer
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                            Budget
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaign.campaignInfluencers.map((collab) => (
                          <tr
                            key={collab.influencerId}
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() =>
                              router.push(`/dashboard/influencers/${collab.influencerId}`)
                            }
                          >
                            <td className="py-3 px-4">
                              <p className="font-medium text-gray-900">
                                {collab.influencer.displayName || collab.influencer.fullName}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  collab.status
                                )}`}
                              >
                                {collab.status.charAt(0).toUpperCase() + collab.status.slice(1)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-900">
                              {collab.agreedBudget
                                ? formatCurrency(collab.agreedBudget)
                                : 'Not set'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      No collaborations yet
                    </h3>
                    <p className="text-sm text-gray-600">
                      Start collaborating with influencers to grow your campaign
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Timeline & Additional Info */}
          <div className="space-y-6">
            {/* Campaign Timeline/Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>Recent campaign activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaign.createdAt && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 bg-purple-600 rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Campaign Created</p>
                        <p className="text-xs text-gray-600">
                          {formatRelativeTime(campaign.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}
                  {campaign.status === 'active' && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-600 rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Campaign Started</p>
                        <p className="text-xs text-gray-600">
                          {formatRelativeTime(campaign.startDate)}
                        </p>
                      </div>
                    </div>
                  )}
                  {campaign.campaignInfluencers &&
                    campaign.campaignInfluencers.length > 0 && (
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-600 rounded-full" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            Influencer Collaborations Added
                          </p>
                          <p className="text-xs text-gray-600">
                            {campaign.campaignInfluencers.length} collaborator(s)
                          </p>
                        </div>
                      </div>
                    )}
                  {campaign.updatedAt && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 bg-gray-400 rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Last Updated</p>
                        <p className="text-xs text-gray-600">
                          {formatRelativeTime(campaign.updatedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Campaign ID</span>
                  <span className="text-sm font-mono text-gray-900">
                    {campaign.campaignId.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Status</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      campaign.status
                    )}`}
                  >
                    {getStatusIcon(campaign.status)}
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="text-sm font-medium text-gray-900">{duration} days</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Budget Used</span>
                  <span className="text-sm font-medium text-gray-900">{budgetUtilization}%</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Collaborators</span>
                  <span className="text-sm font-medium text-gray-900">
                    {campaign.campaignInfluencers?.length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Campaign</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{campaign.campaignName}&quot;? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Campaign'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
