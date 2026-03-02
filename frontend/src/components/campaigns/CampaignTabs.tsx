'use client';

import {
  FileText, Target, Users, Film, BarChart3, ClipboardList, DollarSign, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type CampaignTabId =
  | 'brief' | 'strategy' | 'influencers' | 'content'
  | 'kpis' | 'reports' | 'finance' | 'closure';

interface CampaignTabsProps {
  campaign: any;
  activeTab: CampaignTabId;
  onTabChange: (tab: CampaignTabId) => void;
}

interface TabDef {
  id: CampaignTabId;
  label: string;
  icon: any;
  enabledStatuses: string[] | 'always';
}

const TABS: TabDef[] = [
  {
    id: 'brief',
    label: 'Brief',
    icon: FileText,
    enabledStatuses: 'always',
  },
  {
    id: 'strategy',
    label: 'Strategy',
    icon: Target,
    enabledStatuses: ['in_review', 'pitching', 'live', 'reporting', 'closed', 'paused'],
  },
  {
    id: 'influencers',
    label: 'Influencers',
    icon: Users,
    enabledStatuses: ['pitching', 'live', 'reporting', 'closed', 'paused'],
  },
  {
    id: 'content',
    label: 'Content',
    icon: Film,
    enabledStatuses: ['live', 'reporting', 'closed', 'paused'],
  },
  {
    id: 'kpis',
    label: 'KPIs',
    icon: BarChart3,
    enabledStatuses: ['live', 'reporting', 'closed', 'paused'],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: ClipboardList,
    enabledStatuses: ['reporting', 'closed'],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    enabledStatuses: 'always',
  },
  {
    id: 'closure',
    label: 'Closure',
    icon: Lock,
    enabledStatuses: ['reporting', 'closed'],
  },
];

function isTabEnabled(tab: TabDef, campaignStatus: string): boolean {
  if (tab.enabledStatuses === 'always') return true;
  return tab.enabledStatuses.includes(campaignStatus);
}

export default function CampaignTabs({
  campaign,
  activeTab,
  onTabChange,
}: CampaignTabsProps) {
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-6 overflow-x-auto">
        {TABS.map((tab) => {
          const enabled = isTabEnabled(tab, campaign.status);
          const active = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => enabled && onTabChange(tab.id)}
              disabled={!enabled}
              className={cn(
                'flex items-center gap-1.5 py-3 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors',
                active
                  ? 'border-purple-600 text-purple-600'
                  : enabled
                  ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  : 'border-transparent text-gray-300 cursor-not-allowed'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {!enabled && <Lock className="h-3 w-3 ml-0.5" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
