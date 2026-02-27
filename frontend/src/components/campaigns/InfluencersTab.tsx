'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Sparkles, Users, ChevronDown, Loader2,
  CheckCircle, Send, DollarSign, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { influencerService } from '@/services/influencer.service';
import InstagramDiscoveryDialog from '@/components/influencers/InstagramDiscoveryDialog';
import { toast } from 'sonner';

interface InfluencersTabProps {
  campaignId: string;
  campaign: any;
}

const LIFECYCLE_STATUSES = ['proposed', 'approved', 'contracted', 'brief_accepted', 'live', 'completed'];

const STATUS_COLORS: Record<string, string> = {
  proposed: 'bg-gray-100 text-gray-700',
  approved: 'bg-blue-100 text-blue-700',
  contracted: 'bg-indigo-100 text-indigo-700',
  brief_accepted: 'bg-purple-100 text-purple-700',
  live: 'bg-green-100 text-green-700',
  completed: 'bg-emerald-100 text-emerald-700',
};

const NEXT_STATUS: Record<string, string> = {
  proposed: 'approved',
  approved: 'contracted',
  contracted: 'brief_accepted',
  brief_accepted: 'live',
  live: 'completed',
};

function scoreColor(score: number | null): string {
  if (score == null) return 'text-gray-400';
  if (score >= 75) return 'text-green-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function scoreBgColor(score: number | null): string {
  if (score == null) return 'bg-gray-50';
  if (score >= 75) return 'bg-green-50';
  if (score >= 50) return 'bg-amber-50';
  return 'bg-red-50';
}

function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function InfluencersTab({ campaignId, campaign }: InfluencersTabProps) {
  const queryClient = useQueryClient();
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [showShortlist, setShowShortlist] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingPricing, setEditingPricing] = useState<string | null>(null);
  const [pricingValue, setPricingValue] = useState('');
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['campaign-influencers', campaignId],
    queryFn: () => influencerService.getCampaignInfluencers(campaignId),
    staleTime: 15000,
  });

  const influencers = data?.data?.influencers || [];

  const scoreMutation = useMutation({
    mutationFn: () => influencerService.scoreCampaignInfluencers(campaignId),
    onSuccess: (result) => {
      const count = result?.data?.scoredCount || 0;
      if (result?.data?.aiError) {
        toast.error(`AI scoring unavailable: ${result.data.aiError}`);
      } else {
        toast.success(`Scored ${count} influencer(s)`);
      }
      queryClient.invalidateQueries({ queryKey: ['campaign-influencers', campaignId] });
    },
    onError: () => toast.error('Failed to run AI scoring'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ ciId, newStatus, agreedCost }: { ciId: string; newStatus: string; agreedCost?: number }) =>
      influencerService.transitionInfluencerStatus(campaignId, ciId, newStatus, agreedCost ? { agreedCost } : undefined),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['campaign-influencers', campaignId] });
      setStatusDropdownId(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to update status');
    },
  });

  const pricingMutation = useMutation({
    mutationFn: ({ ciId, agreedCost }: { ciId: string; agreedCost: number }) =>
      influencerService.setInfluencerPricing(campaignId, ciId, { agreedCost }),
    onSuccess: () => {
      toast.success('Pricing updated');
      queryClient.invalidateQueries({ queryKey: ['campaign-influencers', campaignId] });
      setEditingPricing(null);
    },
    onError: () => toast.error('Failed to update pricing'),
  });

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStatusTransition = (ciId: string, currentStatus: string) => {
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;

    if (next === 'contracted') {
      // Find the influencer's estimated cost to use as default
      const ci = influencers.find((i: any) => i.id === ciId);
      const cost = ci?.estimatedCost || ci?.agreedCost;
      if (!cost) {
        toast.error('Set pricing before contracting');
        return;
      }
      statusMutation.mutate({ ciId, newStatus: next, agreedCost: cost });
    } else {
      statusMutation.mutate({ ciId, newStatus: next });
    }
  };

  // Shortlist view
  if (showShortlist) {
    const shortlisted = influencers.filter((i: any) => selectedIds.has(i.id));
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Client Shortlist Presentation</h3>
          <Button variant="outline" onClick={() => setShowShortlist(false)}>
            Back to Table
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shortlisted.map((ci: any) => (
            <Card key={ci.id} className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                  {ci.influencer?.displayName?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{ci.influencer?.handle}</h4>
                  <p className="text-sm text-gray-500">{ci.influencer?.displayName}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Followers:</span>{' '}
                      <span className="font-medium">{formatNumber(ci.influencer?.followerCount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Engagement:</span>{' '}
                      <span className="font-medium">{ci.influencer?.engagementRate ? `${ci.influencer.engagementRate}%` : '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">AI Score:</span>{' '}
                      <span className={`font-bold ${scoreColor(ci.aiMatchScore)}`}>
                        {ci.aiMatchScore != null ? ci.aiMatchScore : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Est. Cost:</span>{' '}
                      <span className="font-medium">
                        {ci.estimatedCost ? `AED ${ci.estimatedCost.toLocaleString()}` : '—'}
                      </span>
                    </div>
                  </div>
                  {ci.aiMatchRationale && (
                    <p className="mt-2 text-xs text-gray-600 italic">{ci.aiMatchRationale}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
        {shortlisted.length === 0 && (
          <p className="text-center text-gray-500 py-8">No influencers selected for shortlist.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowDiscovery(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-1" />
            Add Influencer
          </Button>
          <Button
            variant="outline"
            onClick={() => scoreMutation.mutate()}
            disabled={scoreMutation.isPending || influencers.length === 0}
          >
            {scoreMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            Run AI Scoring
          </Button>
        </div>
        {selectedIds.size > 0 && (
          <Button variant="outline" onClick={() => setShowShortlist(true)}>
            <Eye className="h-4 w-4 mr-1" />
            Present to Client ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading influencers...
        </div>
      )}

      {/* Empty State */}
      {!isLoading && influencers.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No influencers assigned</h3>
          <p className="text-gray-500 mb-4">Add influencers to this campaign to get started.</p>
          <Button onClick={() => setShowDiscovery(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-1" />
            Discover Influencers
          </Button>
        </Card>
      )}

      {/* Table */}
      {!isLoading && influencers.length > 0 && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-3 text-left w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === influencers.length && influencers.length > 0}
                    onChange={() => {
                      if (selectedIds.size === influencers.length) {
                        setSelectedIds(new Set());
                      } else {
                        setSelectedIds(new Set(influencers.map((i: any) => i.id)));
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Handle</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Followers</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Engagement</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">AI Score</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Rationale</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Pricing (AED)</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {influencers.map((ci: any) => (
                <tr key={ci.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(ci.id)}
                      onChange={() => toggleSelected(ci.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {ci.influencer?.displayName?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-medium">{ci.influencer?.handle || '—'}</div>
                        <div className="text-xs text-gray-500">{ci.influencer?.displayName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">{formatNumber(ci.influencer?.followerCount)}</td>
                  <td className="px-3 py-3">
                    {ci.influencer?.engagementRate != null ? `${ci.influencer.engagementRate}%` : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-bold ${scoreColor(ci.aiMatchScore)} ${scoreBgColor(ci.aiMatchScore)}`}>
                      {ci.aiMatchScore != null ? ci.aiMatchScore : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3 max-w-[200px]">
                    <span className="text-xs text-gray-600 line-clamp-2" title={ci.aiMatchRationale || ''}>
                      {ci.aiMatchRationale || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3 relative">
                    <button
                      onClick={() => setStatusDropdownId(statusDropdownId === ci.id ? null : ci.id)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[ci.status] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {ci.status?.replace('_', ' ')}
                      {NEXT_STATUS[ci.status] && <ChevronDown className="h-3 w-3" />}
                    </button>
                    {statusDropdownId === ci.id && NEXT_STATUS[ci.status] && (
                      <div className="absolute z-10 mt-1 bg-white border rounded-md shadow-lg py-1 min-w-[140px]">
                        <button
                          onClick={() => handleStatusTransition(ci.id, ci.status)}
                          disabled={statusMutation.isPending}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Move to {NEXT_STATUS[ci.status]?.replace('_', ' ')}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {editingPricing === ci.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={pricingValue}
                          onChange={(e) => setPricingValue(e.target.value)}
                          className="w-24 h-7 text-xs"
                          placeholder="AED"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            if (pricingValue) {
                              pricingMutation.mutate({ ciId: ci.id, agreedCost: parseFloat(pricingValue) });
                            }
                          }}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingPricing(ci.id);
                          setPricingValue(String(ci.agreedCost || ci.estimatedCost || ''));
                        }}
                        className="text-sm hover:underline"
                      >
                        {ci.agreedCost ? `${ci.agreedCost.toLocaleString()}` : ci.estimatedCost ? `~${ci.estimatedCost.toLocaleString()}` : '—'}
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      {ci.status === 'contracted' && (
                        <button
                          title="Send Brief"
                          className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-purple-600"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Discovery Dialog */}
      <InstagramDiscoveryDialog
        isOpen={showDiscovery}
        onClose={() => {
          setShowDiscovery(false);
          queryClient.invalidateQueries({ queryKey: ['campaign-influencers', campaignId] });
        }}
        onSelect={() => {}}
        campaignId={campaignId}
      />
    </div>
  );
}
