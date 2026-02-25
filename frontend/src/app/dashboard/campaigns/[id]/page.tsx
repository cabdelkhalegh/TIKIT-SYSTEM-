'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Users,
  DollarSign,
  BarChart3,
  Building2,
  Target,
  Loader2,
  FileText,
  Sparkles,
  Upload,
  ChevronRight,
  Film,
  ClipboardList,
  Lock,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import CampaignHeader from '@/components/campaigns/CampaignHeader';
import CampaignTabs, { type CampaignTabId } from '@/components/campaigns/CampaignTabs';
import ApprovalGateCards from '@/components/campaigns/ApprovalGateCards';
import RiskBadge from '@/components/campaigns/RiskBadge';
import BudgetProgressCard from '@/components/campaigns/BudgetProgressCard';
import { campaignService } from '@/services/campaign.service';
import { briefService } from '@/services/brief.service';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const [activeTab, setActiveTab] = useState<CampaignTabId>('brief');
  const queryClient = useQueryClient();
  const { roles, isDirector, isCampaignManager } = useRoleAccess();
  const userRole = roles[0] || 'campaign_manager';

  // Fetch campaign data
  const { data: campaignData, isLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignService.getById(campaignId),
    enabled: !!campaignId,
  });

  // Fetch risk data
  const { data: riskData } = useQuery({
    queryKey: ['campaign-risk', campaignId],
    queryFn: () => campaignService.getRisk(campaignId),
    enabled: !!campaignId,
  });

  // Fetch briefs (for brief tab)
  const { data: briefsData } = useQuery({
    queryKey: ['campaign-briefs', campaignId],
    queryFn: () => briefService.getBriefs(campaignId),
    enabled: !!campaignId && activeTab === 'brief',
  });

  // Fetch influencers (for influencers tab)
  const { data: influencersData } = useQuery({
    queryKey: ['campaign-influencers', campaignId],
    queryFn: () => campaignService.getInfluencers(campaignId),
    enabled: !!campaignId && activeTab === 'influencers',
  });

  const campaign = campaignData?.data;
  const risk = riskData?.data;
  const briefs = briefsData?.data || [];
  const influencers = influencersData?.data || [];

  // Status transition mutation
  const statusMutation = useMutation({
    mutationFn: ({ targetStatus, overrideReason }: { targetStatus: string; overrideReason?: string }) =>
      campaignService.transitionStatus(campaignId, targetStatus, overrideReason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-risk', campaignId] });
      toast.success(`Campaign advanced to ${data.data.newStatus.replace(/_/g, ' ')}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to transition campaign status';
      toast.error(message);
    },
  });

  // Soft-delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => campaignService.softDelete(campaignId),
    onSuccess: () => {
      toast.success('Campaign deleted');
      router.push('/dashboard/campaigns');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to delete campaign';
      toast.error(message);
    },
  });

  const handleStatusChange = async (newStatus: string) => {
    statusMutation.mutate({ targetStatus: newStatus });
  };

  const handleDelete = async () => {
    deleteMutation.mutate();
  };

  const handleApprovalComplete = () => {
    // After approval gate is passed, try to advance status
    const nextStatusMap: Record<string, string> = {
      draft: 'in_review',
      in_review: 'pitching',
      pitching: 'live',
      live: 'reporting',
      reporting: 'closed',
    };
    const next = nextStatusMap[campaign?.status];
    if (next) {
      statusMutation.mutate({ targetStatus: next });
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

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* T029: Campaign Header */}
        <CampaignHeader
          campaign={campaign}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          userRole={userRole}
        />

        {/* T028: Approval Gate Card */}
        {!['closed', 'cancelled', 'paused'].includes(campaign.status) && (
          <div className="mb-6">
            <ApprovalGateCards
              campaign={campaign}
              onApprovalComplete={handleApprovalComplete}
              userRole={userRole}
            />
          </div>
        )}

        {/* T030: Campaign Tabs */}
        <CampaignTabs
          campaign={campaign}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tab Content */}
        {activeTab === 'brief' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Campaign Brief</h3>
              <Link href={`/dashboard/campaigns/${campaignId}/briefs`}>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-1.5" />
                  Manage Briefs
                </Button>
              </Link>
            </div>

            {briefs.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No briefs yet</h3>
                <p className="text-gray-600 mb-4">
                  Upload briefs and use AI to extract objectives, KPIs, target audience, and strategy.
                </p>
                <Link href={`/dashboard/campaigns/${campaignId}/briefs`}>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload First Brief
                  </Button>
                </Link>
              </Card>
            ) : (
              <Card className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500">v{briefs[0].version}</span>
                    {briefs[0].fileName && (
                      <span className="text-sm text-gray-700">{briefs[0].fileName}</span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      briefs[0].isReviewed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {briefs[0].isReviewed ? 'Reviewed' : 'Pending Review'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(briefs[0].createdAt)}</span>
                </div>
                <div className="mt-4 flex justify-end">
                  <Link href={`/dashboard/campaigns/${campaignId}/briefs`}>
                    <Button variant="link" size="sm" className="text-purple-600">
                      Manage All Briefs <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            )}

            {/* Campaign overview info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                  <p className="text-gray-700">
                    {campaign.campaignDescription || 'No description provided'}
                  </p>
                </Card>

                {campaign.client && (
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="h-5 w-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Client</h3>
                    </div>
                    <div>
                      <Link
                        href={`/dashboard/clients/${campaign.client.clientId}`}
                        className="text-purple-600 hover:text-purple-700 font-medium"
                      >
                        {campaign.client.brandDisplayName || campaign.client.legalCompanyName || campaign.client.brandName || campaign.client.companyLegalName}
                      </Link>
                      {campaign.client.displayId && (
                        <span className="ml-2 text-xs text-gray-500 font-mono">{campaign.client.displayId}</span>
                      )}
                    </div>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                <BudgetProgressCard
                  totalBudget={campaign.totalBudget || 0}
                  allocatedBudget={campaign.allocatedBudget || 0}
                  spentBudget={campaign.spentBudget || 0}
                />

                {risk && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
                    <RiskBadge
                      score={risk.riskScore}
                      level={risk.riskLevel}
                      showScore
                      showBreakdown
                      breakdown={risk.factors?.map((f: any) => ({
                        field: f.field,
                        points: f.points,
                        reason: f.field,
                      })) || []}
                    />
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'strategy' && (
          <Card className="p-12 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Strategy</h3>
            <p className="text-gray-600">Coming in next phase</p>
          </Card>
        )}

        {activeTab === 'influencers' && (
          <div>
            {influencers.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No influencers yet</h3>
                <p className="text-gray-600">Add influencers to this campaign to start collaborating</p>
              </Card>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Influencer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {influencers.map((collab: any) => (
                      <tr key={collab.id}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {collab.influencer?.displayName || collab.influencer?.fullName || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {collab.status || collab.collaborationStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {collab.aiMatchScore != null ? `${collab.aiMatchScore}%` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {collab.agreedCost ? formatCurrency(collab.agreedCost) : collab.agreedPayment ? formatCurrency(collab.agreedPayment) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'content' && (
          <Card className="p-12 text-center">
            <Film className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Content</h3>
            <p className="text-gray-600">Coming in next phase</p>
          </Card>
        )}

        {activeTab === 'kpis' && (
          <Card className="p-12 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">KPIs</h3>
            <p className="text-gray-600">Coming in next phase</p>
          </Card>
        )}

        {activeTab === 'reports' && (
          <Card className="p-12 text-center">
            <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reports</h3>
            <p className="text-gray-600">Coming in next phase</p>
          </Card>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BudgetProgressCard
                totalBudget={campaign.totalBudget || 0}
                allocatedBudget={campaign.allocatedBudget || 0}
                spentBudget={campaign.spentBudget || 0}
              />
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Invoices</h3>
                  <Link href={`/dashboard/campaigns/${campaignId}/invoices`}>
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </div>
                <p className="text-gray-600 text-sm">
                  Manage client and influencer invoices for this campaign.
                </p>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'closure' && (
          <Card className="p-12 text-center">
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Closure</h3>
            <p className="text-gray-600">Coming in next phase</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
