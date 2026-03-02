'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Users,
  BarChart3,
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
import FinanceTab from '@/components/campaigns/FinanceTab';
import BriefTab from '@/components/campaigns/BriefTab';
import StrategyTab from '@/components/campaigns/StrategyTab';
import InfluencersTab from '@/components/campaigns/InfluencersTab';
import ContentTab from '@/components/campaigns/ContentTab';
import KPIsTab from '@/components/campaigns/KPIsTab';
import ReportsTab from '@/components/campaigns/ReportsTab';
import ClosureTab from '@/components/campaigns/ClosureTab';
import { campaignService } from '@/services/campaign.service';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { formatCurrency } from '@/lib/utils';

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

  const campaign = campaignData?.data;
  const risk = riskData?.data;

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

        {/* Tab Content — T042: BriefTab and StrategyTab wired in */}
        {activeTab === 'brief' && (
          <BriefTab campaignId={campaignId} campaign={campaign} />
        )}

        {activeTab === 'strategy' && (
          <StrategyTab campaignId={campaignId} campaign={campaign} />
        )}

        {activeTab === 'influencers' && (
          <InfluencersTab campaignId={campaignId} campaign={campaign} />
        )}

        {activeTab === 'content' && (
          <ContentTab campaignId={campaignId} campaign={campaign} />
        )}

        {activeTab === 'kpis' && (
          <KPIsTab campaignId={campaignId} campaign={campaign} />
        )}

        {activeTab === 'reports' && (
          <ReportsTab campaignId={campaignId} campaign={campaign} />
        )}

        {activeTab === 'finance' && (
          <FinanceTab campaignId={campaignId} campaign={campaign} />
        )}

        {activeTab === 'closure' && (
          <ClosureTab campaignId={campaignId} campaign={campaign} />
        )}
      </div>
    </DashboardLayout>
  );
}
