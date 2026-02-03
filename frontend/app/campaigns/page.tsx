'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Campaign, Client } from '@/types';
import { isCampaignManagerOrHigher } from '@/utils/rbac';

export default function CampaignsPage() {
  return (
    <ProtectedRoute>
      <CampaignsContent />
    </ProtectedRoute>
  );
}

function CampaignsContent() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const canManageCampaigns = profile && isCampaignManagerOrHigher(profile.role);

  useEffect(() => {
    fetchCampaigns();
    fetchClients();
  }, []);

  async function fetchCampaigns() {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchClients() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error('Error fetching clients:', error.message);
    }
  }

  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'No Client';
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      brief_pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      content_review: 'bg-blue-100 text-blue-800',
      client_review: 'bg-purple-100 text-purple-800',
      completed: 'bg-indigo-100 text-indigo-800',
      archived: 'bg-gray-100 text-gray-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Draft',
      brief_pending: 'Brief Pending',
      active: 'Active',
      content_review: 'Content Review',
      client_review: 'Client Review',
      completed: 'Completed',
      archived: 'Archived',
    };
    return labels[status] || status;
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    // Filter by status
    if (filter !== 'all' && campaign.status !== filter) return false;
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const clientName = getClientName(campaign.client_id).toLowerCase();
      return (
        campaign.name.toLowerCase().includes(term) ||
        campaign.campaign_code.toLowerCase().includes(term) ||
        clientName.includes(term)
      );
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-600 mt-1">Manage your marketing campaigns</p>
          </div>
          {canManageCampaigns && (
            <button
              onClick={() => router.push('/campaigns/new')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              + New Campaign
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, code, or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="brief_pending">Brief Pending</option>
              <option value="active">Active</option>
              <option value="content_review">Content Review</option>
              <option value="client_review">Client Review</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Campaigns List */}
        {filteredCampaigns.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">
              {searchTerm || filter !== 'all'
                ? 'No campaigns match your filters.'
                : 'No campaigns yet. Create your first campaign to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                onClick={() => router.push(`/campaigns/${campaign.id}`)}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {campaign.name}
                      </h3>
                      <span className="text-sm font-mono text-gray-500">
                        {campaign.campaign_code}
                      </span>
                    </div>
                    <p className="text-gray-600">{getClientName(campaign.client_id)}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      campaign.status
                    )}`}
                  >
                    {getStatusLabel(campaign.status)}
                  </span>
                </div>

                {campaign.description && (
                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {campaign.description}
                  </p>
                )}

                <div className="flex gap-6 text-sm text-gray-500">
                  {campaign.start_date && (
                    <div>
                      <span className="font-medium">Start:</span>{' '}
                      {new Date(campaign.start_date).toLocaleDateString()}
                    </div>
                  )}
                  {campaign.end_date && (
                    <div>
                      <span className="font-medium">End:</span>{' '}
                      {new Date(campaign.end_date).toLocaleDateString()}
                    </div>
                  )}
                  {campaign.budget_amount && (
                    <div>
                      <span className="font-medium">Budget:</span>{' '}
                      {campaign.budget_currency} {campaign.budget_amount.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
