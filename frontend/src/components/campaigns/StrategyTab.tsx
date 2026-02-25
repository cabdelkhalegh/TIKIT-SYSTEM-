'use client';

// T041: StrategyTab — AI strategy generation + display + editing
// Generate button, strategy display, edit mode, regenerate, manual fallback

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Sparkles,
  Loader2,
  Target,
  MessageSquare,
  Layers,
  Filter,
  Pencil,
  Save,
  X,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { strategyService, type Strategy } from '@/services/strategy.service';
import { briefService } from '@/services/brief.service';

interface StrategyTabProps {
  campaignId: string;
  campaign: any;
}

function tryParseJson(value: string | null): any {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export default function StrategyTab({ campaignId, campaign }: StrategyTabProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{
    summary: string;
    keyMessages: string[];
    contentPillars: string[];
    matchingCriteria: any;
  }>({ summary: '', keyMessages: [], contentPillars: [], matchingCriteria: {} });

  // Fetch strategy
  const { data: strategyData, isLoading: strategyLoading, error: strategyError } = useQuery({
    queryKey: ['campaign-strategy', campaignId],
    queryFn: () => strategyService.getStrategy(campaignId),
    enabled: !!campaignId,
    retry: false,
  });

  // Fetch briefs to check review status
  const { data: briefsData } = useQuery({
    queryKey: ['campaign-briefs', campaignId],
    queryFn: () => briefService.getBriefs(campaignId),
    enabled: !!campaignId,
  });

  const strategy = strategyData?.data;
  const briefs = briefsData?.data || [];
  const hasBrief = briefs.length > 0;
  const briefReviewed = briefs[0]?.isReviewed === true;
  const hasStrategy = !!strategy && !strategyError;

  // Parse stored JSON fields
  const keyMessages: string[] = strategy ? tryParseJson(strategy.keyMessages) || [] : [];
  const contentPillars: string[] = strategy ? tryParseJson(strategy.contentPillars) || [] : [];
  const matchingCriteria: any = strategy ? tryParseJson(strategy.matchingCriteria) || {} : {};

  // Generate strategy
  const generateMutation = useMutation({
    mutationFn: () => strategyService.generateStrategy(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-strategy', campaignId] });
      toast.success('Strategy generated');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error || 'Failed to generate strategy';
      toast.error(msg);
    },
  });

  // Update strategy
  const updateMutation = useMutation({
    mutationFn: (data: any) => strategyService.updateStrategy(campaignId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-strategy', campaignId] });
      setIsEditing(false);
      toast.success('Strategy updated');
    },
    onError: () => toast.error('Failed to update strategy'),
  });

  const handleStartEdit = () => {
    setEditData({
      summary: strategy?.summary || '',
      keyMessages,
      contentPillars,
      matchingCriteria,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const handleRegenerate = () => {
    if (window.confirm('This will overwrite the existing strategy. Continue?')) {
      generateMutation.mutate();
    }
  };

  if (strategyLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  // No strategy — show generate or warning
  if (!hasStrategy) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Campaign Strategy</h3>

        {!hasBrief && (
          <Card className="p-6 border-amber-200 bg-amber-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">No brief available</p>
                <p className="text-sm text-amber-700 mt-1">Upload and review a brief first before generating a strategy.</p>
              </div>
            </div>
          </Card>
        )}

        {hasBrief && !briefReviewed && (
          <Card className="p-6 border-amber-200 bg-amber-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Brief not reviewed</p>
                <p className="text-sm text-amber-700 mt-1">The brief must be reviewed and approved before generating a strategy.</p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-12 text-center">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No strategy yet</h4>
          <p className="text-gray-600 mb-6">
            Generate an AI-powered strategy from the reviewed brief, or enter one manually.
          </p>
          <div className="flex justify-center gap-3">
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={!briefReviewed || generateMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {generateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate with AI
            </Button>
            <Button variant="outline" onClick={handleStartEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Enter Manually
            </Button>
          </div>
        </Card>

        {/* Manual entry form when no strategy exists */}
        {isEditing && <StrategyEditForm editData={editData} setEditData={setEditData} onSave={handleSave} onCancel={() => setIsEditing(false)} isPending={updateMutation.isPending} />}
      </div>
    );
  }

  // Strategy exists — display it
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Campaign Strategy</h3>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={handleStartEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Strategy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Regenerate
              </Button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <StrategyEditForm editData={editData} setEditData={setEditData} onSave={handleSave} onCancel={() => setIsEditing(false)} isPending={updateMutation.isPending} />
      ) : (
        <>
          {/* Summary */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Summary</h4>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {strategy.summary || <span className="text-gray-400 italic">No summary</span>}
            </p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Messages */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                <h4 className="font-semibold text-gray-900">Key Messages</h4>
              </div>
              {keyMessages.length > 0 ? (
                <div className="space-y-1.5">
                  {keyMessages.map((msg: string, i: number) => (
                    <div key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                      <span className="text-purple-500 mt-0.5">&#8226;</span>
                      <span>{msg}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">None</p>
              )}
            </Card>

            {/* Content Pillars */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-5 w-5 text-purple-600" />
                <h4 className="font-semibold text-gray-900">Content Pillars</h4>
              </div>
              {contentPillars.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {contentPillars.map((pillar: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {pillar}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">None</p>
              )}
            </Card>
          </div>

          {/* Matching Criteria */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-5 w-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Matching Criteria</h4>
            </div>
            {matchingCriteria && Object.keys(matchingCriteria).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {matchingCriteria.platform && (
                      <tr><td className="py-2 pr-4 font-medium text-gray-600 w-40">Platform</td><td className="py-2 text-gray-900 capitalize">{matchingCriteria.platform}</td></tr>
                    )}
                    {matchingCriteria.followerRange && (
                      <tr><td className="py-2 pr-4 font-medium text-gray-600">Follower Range</td><td className="py-2 text-gray-900">{matchingCriteria.followerRange.min?.toLocaleString()} &ndash; {matchingCriteria.followerRange.max?.toLocaleString()}</td></tr>
                    )}
                    {matchingCriteria.engagementMin != null && (
                      <tr><td className="py-2 pr-4 font-medium text-gray-600">Min Engagement</td><td className="py-2 text-gray-900">{matchingCriteria.engagementMin}%</td></tr>
                    )}
                    {matchingCriteria.niches?.length > 0 && (
                      <tr><td className="py-2 pr-4 font-medium text-gray-600">Niches</td><td className="py-2 text-gray-900">{matchingCriteria.niches.join(', ')}</td></tr>
                    )}
                    {matchingCriteria.locations?.length > 0 && (
                      <tr><td className="py-2 pr-4 font-medium text-gray-600">Locations</td><td className="py-2 text-gray-900">{matchingCriteria.locations.join(', ')}</td></tr>
                    )}
                    {matchingCriteria.languages?.length > 0 && (
                      <tr><td className="py-2 pr-4 font-medium text-gray-600">Languages</td><td className="py-2 text-gray-900">{matchingCriteria.languages.join(', ')}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No matching criteria</p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

// Edit form sub-component
function StrategyEditForm({
  editData,
  setEditData,
  onSave,
  onCancel,
  isPending,
}: {
  editData: { summary: string; keyMessages: string[]; contentPillars: string[]; matchingCriteria: any };
  setEditData: (data: any) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
        <textarea
          value={editData.summary}
          onChange={(e) => setEditData({ ...editData, summary: e.target.value })}
          rows={6}
          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
          placeholder="Enter strategy summary..."
        />
      </Card>

      <Card className="p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Key Messages (one per line)</label>
        <textarea
          value={editData.keyMessages.join('\n')}
          onChange={(e) => setEditData({ ...editData, keyMessages: e.target.value.split('\n').filter(Boolean) })}
          rows={4}
          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
          placeholder="Enter key messages, one per line..."
        />
      </Card>

      <Card className="p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Content Pillars (one per line)</label>
        <textarea
          value={editData.contentPillars.join('\n')}
          onChange={(e) => setEditData({ ...editData, contentPillars: e.target.value.split('\n').filter(Boolean) })}
          rows={4}
          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
          placeholder="Enter content pillars, one per line..."
        />
      </Card>

      <Card className="p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Matching Criteria (JSON)</label>
        <textarea
          value={JSON.stringify(editData.matchingCriteria, null, 2)}
          onChange={(e) => {
            try {
              setEditData({ ...editData, matchingCriteria: JSON.parse(e.target.value) });
            } catch {
              // Allow invalid JSON while typing
            }
          }}
          rows={6}
          className="w-full border border-gray-300 rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
          placeholder='{"platform": "instagram", "followerRange": {"min": 10000, "max": 100000}}'
        />
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" /> Cancel
        </Button>
        <Button onClick={onSave} disabled={isPending} className="bg-purple-600 hover:bg-purple-700 text-white">
          {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Strategy
        </Button>
      </div>
    </div>
  );
}
