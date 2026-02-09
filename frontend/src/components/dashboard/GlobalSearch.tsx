'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Command, Loader2, Building2, Target, Users, Handshake } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { clientService } from '@/services/client.service';
import { campaignService } from '@/services/campaign.service';
import { influencerService } from '@/services/influencer.service';
import { collaborationService } from '@/services/collaboration.service';

interface SearchResult {
  id: string;
  type: 'client' | 'campaign' | 'influencer' | 'collaboration';
  title: string;
  subtitle?: string;
  href: string;
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search across all entities
  const { data: clientsData, isLoading: loadingClients } = useQuery({
    queryKey: ['clients-search', query],
    queryFn: () => clientService.getAll({ perPage: 5 }),
    enabled: query.length >= 2,
  });

  const { data: campaignsData, isLoading: loadingCampaigns } = useQuery({
    queryKey: ['campaigns-search', query],
    queryFn: () => campaignService.getAll({ perPage: 5 }),
    enabled: query.length >= 2,
  });

  const { data: influencersData, isLoading: loadingInfluencers } = useQuery({
    queryKey: ['influencers-search', query],
    queryFn: () => influencerService.getAll({ search: query, perPage: 5 }),
    enabled: query.length >= 2,
  });

  const { data: collaborationsData, isLoading: loadingCollaborations } = useQuery({
    queryKey: ['collaborations-search', query],
    queryFn: () => collaborationService.getAll({ perPage: 5 }),
    enabled: query.length >= 2,
  });

  const isLoading = loadingClients || loadingCampaigns || loadingInfluencers || loadingCollaborations;

  // Aggregate results
  useEffect(() => {
    const allResults: SearchResult[] = [];

    if (clientsData?.data) {
      clientsData.data.forEach((client: any) => {
        allResults.push({
          id: client.clientId,
          type: 'client',
          title: client.brandDisplayName || client.legalCompanyName,
          subtitle: client.industryVertical,
          href: `/dashboard/clients/${client.clientId}`,
        });
      });
    }

    if (campaignsData?.data) {
      campaignsData.data.forEach((campaign: any) => {
        allResults.push({
          id: campaign.id,
          type: 'campaign',
          title: campaign.title,
          subtitle: campaign.status,
          href: `/dashboard/campaigns/${campaign.id}`,
        });
      });
    }

    if (influencersData?.data) {
      influencersData.data.forEach((influencer: any) => {
        allResults.push({
          id: influencer.influencerId,
          type: 'influencer',
          title: influencer.displayName || influencer.fullName,
          subtitle: influencer.primaryPlatform,
          href: `/dashboard/influencers/${influencer.influencerId}`,
        });
      });
    }

    if (collaborationsData?.data) {
      collaborationsData.data.forEach((collab: any) => {
        allResults.push({
          id: collab.id,
          type: 'collaboration',
          title: `Collaboration #${collab.id.substring(0, 8)}`,
          subtitle: collab.status,
          href: `/dashboard/collaborations/${collab.id}`,
        });
      });
    }

    setResults(allResults);
    setSelectedIndex(0);
  }, [clientsData, campaignsData, influencersData, collaborationsData]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  const handleSelect = (result: SearchResult) => {
    router.push(result.href);
    setIsOpen(false);
    setQuery('');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <Building2 className="h-4 w-4" />;
      case 'campaign':
        return <Target className="h-4 w-4" />;
      case 'influencer':
        return <Users className="h-4 w-4" />;
      case 'collaboration':
        return <Handshake className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        aria-label="Open search (Cmd+K)"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono bg-white border border-gray-300 rounded">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-gray-900/50 z-50"
        onClick={() => setIsOpen(false)}
      />

      {/* Search Modal */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50">
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search clients, campaigns, influencers..."
              className="flex-1 outline-none text-gray-900 placeholder-gray-500"
              aria-label="Global search input"
            />
            {isLoading && <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded"
              aria-label="Close search"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {query.length < 2 && (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Type at least 2 characters to search
              </div>
            )}

            {query.length >= 2 && !isLoading && results.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No results found for &ldquo;{query}&rdquo;
              </div>
            )}

            {results.length > 0 && (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                      index === selectedIndex ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      result.type === 'client' ? 'bg-purple-100 text-purple-600' :
                      result.type === 'campaign' ? 'bg-blue-100 text-blue-600' :
                      result.type === 'influencer' ? 'bg-green-100 text-green-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-gray-900">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-xs text-gray-500 capitalize">{result.subtitle}</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 capitalize">{result.type}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <span>Use ↑↓ to navigate</span>
            <span>Press Enter to select</span>
          </div>
        </div>
      </div>
    </>
  );
}
