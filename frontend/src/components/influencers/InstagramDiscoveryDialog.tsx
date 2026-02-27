'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Search, X, Instagram, Hash, User, Users, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { influencerService } from '@/services/influencer.service';
import { toast } from 'sonner';

type SearchMode = 'name' | 'username' | 'hashtag';

interface DiscoveryResult {
  igUserId: string;
  username: string;
  fullName: string;
  bio?: string;
  profilePicture?: string | null;
  followerCount: number | null;
  followingCount: number | null;
  mediaCount: number | null;
  engagementRate: number | null;
  isDemoData?: boolean;
  isExisting?: boolean;
  existingInfluencerId?: string | null;
}

interface InstagramDiscoveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (influencer: DiscoveryResult) => void;
  campaignId?: string;
}

const TABS: { mode: SearchMode; label: string; icon: any; placeholder: string }[] = [
  { mode: 'name', label: 'By Name', icon: User, placeholder: 'Search by name...' },
  { mode: 'username', label: 'By Username', icon: Instagram, placeholder: '@username' },
  { mode: 'hashtag', label: 'By Hashtag', icon: Hash, placeholder: '#hashtag' },
];

function formatNumber(n: number | null): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function InstagramDiscoveryDialog({
  isOpen,
  onClose,
  onSelect,
  campaignId,
}: InstagramDiscoveryDialogProps) {
  const [activeMode, setActiveMode] = useState<SearchMode>('username');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [isDemoData, setIsDemoData] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchMutation = useMutation({
    mutationFn: () => influencerService.discoverInfluencers(activeMode, query),
    onSuccess: (data) => {
      setResults(data.data?.results || []);
      setIsDemoData(data.data?.isDemoData || false);
      setHasSearched(true);
    },
    onError: () => {
      toast.error('Failed to search Instagram. Please try again.');
      setHasSearched(true);
    },
  });

  const addMutation = useMutation({
    mutationFn: (result: DiscoveryResult) => {
      if (!campaignId) return Promise.resolve(null);
      if (result.isExisting && result.existingInfluencerId) {
        return influencerService.addToCampaign(campaignId, { influencerId: result.existingInfluencerId });
      }
      return influencerService.addToCampaign(campaignId, {
        newInfluencer: {
          handle: `@${result.username}`,
          displayName: result.fullName,
          followerCount: result.followerCount,
          engagementRate: result.engagementRate,
          profilePicture: result.profilePicture,
          bio: result.bio,
          platform: 'instagram',
        },
      });
    },
    onSuccess: () => {
      toast.success('Influencer added to campaign');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error || 'Failed to add influencer';
      toast.error(msg);
    },
  });

  const handleSearch = () => {
    if (!query.trim()) return;
    searchMutation.mutate();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleSelect = (result: DiscoveryResult) => {
    if (campaignId) {
      addMutation.mutate(result);
    } else {
      onSelect(result);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Discover Influencers</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.mode}
                onClick={() => {
                  setActiveMode(tab.mode);
                  setResults([]);
                  setHasSearched(false);
                }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeMode === tab.mode
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="px-6 py-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={TABS.find((t) => t.mode === activeMode)?.placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={searchMutation.isPending || !query.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {searchMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </div>
          {isDemoData && hasSearched && (
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle className="h-3 w-3" />
              Demo data — Instagram API not connected
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-3">
          {searchMutation.isPending && (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Searching...
            </div>
          )}

          {!searchMutation.isPending && hasSearched && results.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No results found. Try a different search term.</p>
            </div>
          )}

          {results.map((result) => (
            <Card key={result.igUserId} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                    {result.fullName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">@{result.username}</span>
                      {result.isExisting && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          In System
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{result.fullName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-xs text-gray-500">
                    <div>{formatNumber(result.followerCount)} followers</div>
                    {result.engagementRate != null && (
                      <div>{result.engagementRate}% engagement</div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSelect(result)}
                    disabled={addMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {campaignId ? 'Add to Campaign' : 'Select'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
