/**
 * Report Data Aggregation Service
 * 
 * Aggregates campaign data for report generation including:
 * - Campaign information
 * - KPI metrics
 * - Deliverables status
 * - Approval workflow metrics
 * - Timeline data
 */

import { createClient } from '@/lib/supabase';
import type { Campaign, Client, Profile, KPI, ContentItem, ContentApproval } from '@/types';
import {
  formatCurrency,
  formatPercentage,
  formatNumber,
  formatDateRange,
  calculateROI,
  calculateEngagementRate,
  calculateDuration,
  safeDivide
} from '@/utils/reportHelpers';

export interface AggregatedCampaignData {
  campaign: {
    code: string;
    name: string;
    client: string;
    clientCompany: string;
    duration: string;
    durationDays: number;
    budget: string | null;
    budgetAmount: number | null;
    currency: string;
    status: string;
    startDate: string;
    endDate: string | null;
    campaignManager: string | null;
    reviewer: string | null;
  };
  
  kpis: {
    totalReach: number;
    totalInteractions: number;
    avgEngagementRate: number;
    costPerEngagement: number | null;
    roi: number | null;
    hasData: boolean;
    warning?: string;
  };
  
  deliverables: {
    total: number;
    completed: number;
    approved: number;
    pending: number;
    rejected: number;
    completionRate: number;
    approvalRate: number;
  };
  
  approvals: {
    totalApprovals: number;
    internalApprovals: number;
    clientApprovals: number;
    rejectionCount: number;
  };
  
  timeline: {
    startDate: string;
    endDate: string | null;
    duration: string;
    durationDays: number;
  };
}

/**
 * Main aggregation function - collects all campaign data
 */
export async function aggregateCampaignData(campaignId: string): Promise<AggregatedCampaignData | null> {
  try {
    const [
      campaignInfo,
      kpisData,
      deliverablesData,
      approvalsData,
      timelineData
    ] = await Promise.all([
      aggregateCampaignInfo(campaignId),
      aggregateKPIs(campaignId),
      aggregateDeliverables(campaignId),
      aggregateApprovals(campaignId),
      aggregateTimeline(campaignId)
    ]);

    if (!campaignInfo) {
      return null;
    }

    return {
      campaign: campaignInfo,
      kpis: kpisData,
      deliverables: deliverablesData,
      approvals: approvalsData,
      timeline: timelineData
    };
  } catch (error) {
    console.error('Error aggregating campaign data:', error);
    return null;
  }
}

/**
 * Aggregate campaign information with client and team details
 */
async function aggregateCampaignInfo(campaignId: string) {
  const supabase = createClient();
  
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      client:clients(*),
      campaign_manager:profiles!campaigns_campaign_manager_id_fkey(*),
      reviewer:profiles!campaigns_reviewer_id_fkey(*)
    `)
    .eq('id', campaignId)
    .single();

  if (error || !campaign) {
    console.error('Error fetching campaign:', error);
    return null;
  }

  const durationDays = campaign.end_date 
    ? calculateDuration(campaign.start_date, campaign.end_date)
    : calculateDuration(campaign.start_date, new Date().toISOString());

  return {
    code: campaign.code,
    name: campaign.name,
    client: campaign.client?.name || 'Unknown Client',
    clientCompany: campaign.client?.company || '',
    duration: `${durationDays} days`,
    durationDays,
    budget: campaign.budget ? formatCurrency(campaign.budget, campaign.currency) : null,
    budgetAmount: campaign.budget,
    currency: campaign.currency || 'USD',
    status: campaign.status,
    startDate: campaign.start_date,
    endDate: campaign.end_date,
    campaignManager: campaign.campaign_manager?.full_name || null,
    reviewer: campaign.reviewer?.full_name || null
  };
}

/**
 * Aggregate KPI metrics from all content items
 */
async function aggregateKPIs(campaignId: string) {
  const supabase = createClient();
  
  // Get campaign budget first
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('budget')
    .eq('id', campaignId)
    .single();

  // Get all KPIs for content items in this campaign
  const { data: kpis, error } = await supabase
    .from('kpis')
    .select(`
      *,
      content_item:content_items!inner(campaign_id)
    `)
    .eq('content_item.campaign_id', campaignId);

  if (error) {
    console.error('Error fetching KPIs:', error);
  }

  if (!kpis || kpis.length === 0) {
    return {
      totalReach: 0,
      totalInteractions: 0,
      avgEngagementRate: 0,
      costPerEngagement: null,
      roi: null,
      hasData: false,
      warning: 'No KPI data available for this campaign'
    };
  }

  // Calculate totals
  const totalReach = kpis.reduce((sum: number, kpi: KPI) => sum + (kpi.reach || 0), 0);
  const totalLikes = kpis.reduce((sum: number, kpi: KPI) => sum + (kpi.likes || 0), 0);
  const totalComments = kpis.reduce((sum: number, kpi: KPI) => sum + (kpi.comments || 0), 0);
  const totalShares = kpis.reduce((sum: number, kpi: KPI) => sum + (kpi.shares || 0), 0);
  const totalSaves = kpis.reduce((sum: number, kpi: KPI) => sum + (kpi.saves || 0), 0);
  const totalInteractions = totalLikes + totalComments + totalShares + totalSaves;

  // Calculate average engagement rate
  const engagementRates = kpis
    .map((kpi: KPI) => kpi.engagement_rate)
    .filter((rate): rate is number => rate !== null && rate !== undefined);
  const avgEngagementRate = engagementRates.length > 0
    ? engagementRates.reduce((sum: number, rate: number) => sum + rate, 0) / engagementRates.length
    : calculateEngagementRate(totalInteractions, totalReach);

  // Calculate budget efficiency metrics
  const budget = campaign?.budget;
  const costPerEngagement = budget && totalInteractions > 0
    ? safeDivide(budget, totalInteractions)
    : null;
  const roi = budget && totalReach > 0
    ? calculateROI(totalReach, budget)
    : null;

  return {
    totalReach,
    totalInteractions,
    avgEngagementRate,
    costPerEngagement,
    roi,
    hasData: true
  };
}

/**
 * Aggregate deliverables status
 */
async function aggregateDeliverables(campaignId: string) {
  const supabase = createClient();
  
  const { data: contentItems, error } = await supabase
    .from('content_items')
    .select('id, status')
    .eq('campaign_id', campaignId);

  if (error) {
    console.error('Error fetching content items:', error);
  }

  const total = contentItems?.length || 0;
  
  if (total === 0) {
    return {
      total: 0,
      completed: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      completionRate: 0,
      approvalRate: 0
    };
  }

  const statusCounts = contentItems!.reduce((acc: Record<string, number>, item: ContentItem) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const approved = statusCounts['approved'] || 0;
  const published = statusCounts['published'] || 0;
  const completed = approved + published;
  
  const pending = (statusCounts['pending_internal'] || 0) + 
                  (statusCounts['pending_client'] || 0);
  
  const rejected = (statusCounts['internal_rejected'] || 0) + 
                   (statusCounts['client_rejected'] || 0);

  return {
    total,
    completed,
    approved,
    pending,
    rejected,
    completionRate: safeDivide(completed, total) * 100,
    approvalRate: safeDivide(approved, total) * 100
  };
}

/**
 * Aggregate approval workflow metrics
 */
async function aggregateApprovals(campaignId: string) {
  const supabase = createClient();
  
  const { data: contentItems } = await supabase
    .from('content_items')
    .select('id')
    .eq('campaign_id', campaignId);

  if (!contentItems || contentItems.length === 0) {
    return {
      totalApprovals: 0,
      internalApprovals: 0,
      clientApprovals: 0,
      rejectionCount: 0
    };
  }

  const contentItemIds = contentItems.map((item: ContentItem) => item.id);

  const { data: approvals, error } = await supabase
    .from('content_approvals')
    .select('stage, decision')
    .in('content_item_id', contentItemIds);

  if (error) {
    console.error('Error fetching approvals:', error);
  }

  if (!approvals || approvals.length === 0) {
    return {
      totalApprovals: 0,
      internalApprovals: 0,
      clientApprovals: 0,
      rejectionCount: 0
    };
  }

  const internalApprovals = approvals.filter((a: any) => 
    a.stage === 'internal' && a.decision === 'approved'
  ).length;

  const clientApprovals = approvals.filter((a: any) => 
    a.stage === 'client' && a.decision === 'approved'
  ).length;

  const rejectionCount = approvals.filter((a: any) => 
    a.decision === 'rejected'
  ).length;

  return {
    totalApprovals: internalApprovals + clientApprovals,
    internalApprovals,
    clientApprovals,
    rejectionCount
  };
}

/**
 * Aggregate timeline data
 */
async function aggregateTimeline(campaignId: string) {
  const supabase = createClient();
  
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('start_date, end_date')
    .eq('id', campaignId)
    .single();

  if (!campaign) {
    return {
      startDate: '',
      endDate: null,
      duration: '',
      durationDays: 0
    };
  }

  const durationDays = campaign.end_date 
    ? calculateDuration(campaign.start_date, campaign.end_date)
    : calculateDuration(campaign.start_date, new Date().toISOString());

  return {
    startDate: campaign.start_date,
    endDate: campaign.end_date,
    duration: `${durationDays} days`,
    durationDays
  };
}
