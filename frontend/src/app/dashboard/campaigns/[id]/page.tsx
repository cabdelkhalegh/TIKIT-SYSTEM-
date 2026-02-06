'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Edit,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Building2,
  Calendar,
  Target,
  Globe,
  Loader2,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import CampaignStatusBadge from '@/components/campaigns/CampaignStatusBadge';
import BudgetProgressCard from '@/components/campaigns/BudgetProgressCard';
import CampaignTimeline from '@/components/campaigns/CampaignTimeline';
import { campaignService } from '@/services/campaign.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Campaign, CampaignStatus } from '@/types/campaign.types';

type TabType = 'overview' | 'influencers' | 'budget' | 'analytics';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const queryClient = useQueryClient();

  const { data: campaignData, isLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignService.getById(campaignId),
    enabled: !!campaignId,
  });

  const { data: influencersData } = useQuery({
    queryKey: ['campaign-influencers', campaignId],
    queryFn: () => campaignService.getInfluencers(campaignId),
    enabled: !!campaignId && activeTab === 'influencers',
  });

  const campaign = campaignData?.data;
  const influencers = influencersData?.data || [];

  // Status transition mutations
  const activateMutation = useMutation({
    mutationFn: () => campaignService.activate(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      toast.success('Campaign activated successfully');
    },
    onError: () => {
      toast.error('Failed to activate campaign');
    },
  });

  const pauseMutation = useMutation({
    mutationFn: () => campaignService.pause(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      toast.success('Campaign paused successfully');
    },
    onError: () => {
      toast.error('Failed to pause campaign');
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => campaignService.resume(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      toast.success('Campaign resumed successfully');
    },
    onError: () => {
      toast.error('Failed to resume campaign');
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => campaignService.complete(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      toast.success('Campaign completed successfully');
    },
    onError: () => {
      toast.error('Failed to complete campaign');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => campaignService.cancel(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      toast.success('Campaign cancelled');
    },
    onError: () => {
      toast.error('Failed to cancel campaign');
    },
  });

  const getStatusActions = (status: CampaignStatus) => {
    switch (status) {
      case 'draft':
        return [
          { label: 'Activate', icon: Play, action: activateMutation, color: 'green' },
          { label: 'Cancel', icon: XCircle, action: cancelMutation, color: 'red' },
        ];
      case 'active':
        return [
          { label: 'Pause', icon: Pause, action: pauseMutation, color: 'yellow' },
          { label: 'Complete', icon: CheckCircle, action: completeMutation, color: 'blue' },
          { label: 'Cancel', icon: XCircle, action: cancelMutation, color: 'red' },
        ];
      case 'paused':
        return [
          { label: 'Resume', icon: Play, action: resumeMutation, color: 'green' },
          { label: 'Complete', icon: CheckCircle, action: completeMutation, color: 'blue' },
          { label: 'Cancel', icon: XCircle, action: cancelMutation, color: 'red' },
        ];
      default:
        return [];
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!campaign) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Campaign not found</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: TrendingUp },
    { id: 'influencers' as TabType, label: 'Influencers', icon: Users },
    { id: 'budget' as TabType, label: 'Budget', icon: DollarSign },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
  ];

  const statusActions = getStatusActions(campaign.status as CampaignStatus);

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => router.push('/dashboard/campaigns')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{campaign.campaignName}</h1>
            <CampaignStatusBadge status={campaign.status as CampaignStatus} />
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={`/dashboard/campaigns/${campaignId}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Campaign
              </Button>
            </Link>

            {statusActions.map(({ label, icon: Icon, action, color }) => (
              <Button
                key={label}
                variant="outline"
                onClick={() => action.mutate()}
                disabled={action.isPending}
                className={
                  color === 'green'
                    ? 'border-green-600 text-green-600 hover:bg-green-50'
                    : color === 'yellow'
                    ? 'border-yellow-600 text-yellow-600 hover:bg-yellow-50'
                    : color === 'blue'
                    ? 'border-blue-600 text-blue-600 hover:bg-blue-50'
                    : 'border-red-600 text-red-600 hover:bg-red-50'
                }
              >
                {action.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4 mr-2" />
                )}
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                <p className="text-gray-700">
                  {campaign.campaignDescription || 'No description provided'}
                </p>
              </Card>

              {/* Objectives */}
              {campaign.campaignObjectives && campaign.campaignObjectives.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Campaign Objectives</h3>
                  </div>
                  <ul className="space-y-2">
                    {campaign.campaignObjectives.map((objective, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Target Audience */}
              {campaign.targetAudience && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Target Audience</h3>
                  </div>
                  <div className="space-y-3">
                    {campaign.targetAudience.demographics && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Demographics</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {campaign.targetAudience.demographics.ageRange && (
                            <div>
                              <span className="text-gray-600">Age Range:</span>{' '}
                              <span className="text-gray-900">
                                {campaign.targetAudience.demographics.ageRange}
                              </span>
                            </div>
                          )}
                          {campaign.targetAudience.demographics.gender && (
                            <div>
                              <span className="text-gray-600">Gender:</span>{' '}
                              <span className="text-gray-900">
                                {campaign.targetAudience.demographics.gender}
                              </span>
                            </div>
                          )}
                        </div>
                        {campaign.targetAudience.demographics.locations &&
                          campaign.targetAudience.demographics.locations.length > 0 && (
                            <div className="mt-2">
                              <span className="text-gray-600 text-sm">Locations:</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {campaign.targetAudience.demographics.locations.map((loc, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                                  >
                                    {loc}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                    {campaign.targetAudience.interests &&
                      campaign.targetAudience.interests.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Interests</h4>
                          <div className="flex flex-wrap gap-2">
                            {campaign.targetAudience.interests.map((interest, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </Card>
              )}

              {/* Platforms */}
              {campaign.targetPlatforms && campaign.targetPlatforms.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Target Platforms</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {campaign.targetPlatforms.map((platform, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium"
                      >
                        {platform}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Client Info */}
              {campaign.client && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Client</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Link
                        href={`/dashboard/clients/${campaign.client.clientId}`}
                        className="text-purple-600 hover:text-purple-700 font-medium"
                      >
                        {campaign.client.brandName || campaign.client.companyLegalName}
                      </Link>
                    </div>
                    {campaign.client.industry && (
                      <div className="text-sm text-gray-600">
                        Industry: {campaign.client.industry}
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Budget */}
              <BudgetProgressCard
                totalBudget={campaign.totalBudget || 0}
                allocatedBudget={campaign.allocatedBudget || 0}
                spentBudget={campaign.spentBudget || 0}
              />

              {/* Timeline */}
              <CampaignTimeline
                status={campaign.status as CampaignStatus}
                createdAt={campaign.createdAt}
                startDate={campaign.startDate}
                launchDate={campaign.launchDate}
                endDate={campaign.endDate}
              />

              {/* KPIs */}
              {campaign.performanceKPIs && Object.keys(campaign.performanceKPIs).length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Target KPIs</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(campaign.performanceKPIs).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {typeof value === 'number' && value < 100
                            ? `${value}%`
                            : value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'influencers' && (
          <div>
            {influencers.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No influencers yet
                </h3>
                <p className="text-gray-600">
                  Add influencers to this campaign to start collaborating
                </p>
              </Card>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Influencer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Payment
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {influencers.map((collab) => (
                      <tr key={collab.id}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {collab.influencer?.profileName || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{collab.role || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {collab.collaborationStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {collab.agreedPayment ? formatCurrency(collab.agreedPayment) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BudgetProgressCard
              totalBudget={campaign.totalBudget || 0}
              allocatedBudget={campaign.allocatedBudget || 0}
              spentBudget={campaign.spentBudget || 0}
            />
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Breakdown</h3>
              <div className="space-y-4">
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-gray-600">Total Budget</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(campaign.totalBudget || 0)}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-gray-600">Allocated</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(campaign.allocatedBudget || 0)}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-gray-600">Spent</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(campaign.spentBudget || 0)}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-gray-900 font-medium">Remaining</span>
                  <span className="font-bold text-lg text-gray-900">
                    {formatCurrency((campaign.totalBudget || 0) - (campaign.spentBudget || 0))}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'analytics' && (
          <Card className="p-12 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Coming Soon</h3>
            <p className="text-gray-600">
              Campaign analytics and performance metrics will be available here
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
