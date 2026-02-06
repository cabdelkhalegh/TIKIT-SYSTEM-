export interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalInfluencers: number;
  activeCollaborations: number;
  totalBudget: number;
  spentBudget: number;
}

export interface CampaignBreakdown {
  status: string;
  count: number;
  color: string;
}

export interface Activity {
  id: string;
  type: 'campaign' | 'collaboration' | 'payment' | 'system';
  description: string;
  timestamp: string;
  user?: string;
}

export interface QuickAction {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}
