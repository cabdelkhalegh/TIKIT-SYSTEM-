'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Campaign, ContentItem, Client, UserProfile, CampaignStatus, ContentStatus } from '@/types';
import { isCampaignManagerOrHigher } from '@/utils/rbac';

export default function CampaignDetailPage() {
  return (
    <ProtectedRoute>
      <CampaignDetail />
    </ProtectedRoute>
  );
}

function CampaignDetail() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const supabase = createClientComponentClient();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [campaignManager, setCampaignManager] = useState<UserProfile | null>(null);
  const [reviewer, setReviewer] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddContent, setShowAddContent] = useState(false);
  const [newContent, setNewContent] = useState({
    title: '',
    description: '',
    platform: '',
    format: '',
    internal_deadline: '',
    client_deadline: '',
    assigned_influencer_id: '',
  });

  const canEdit = profile && isCampaignManagerOrHigher(profile.role);

  useEffect(() => {
    loadCampaignData();
  }, [params.id]);

  async function loadCampaignData() {
    try {
      setLoading(true);

      // Load campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', params.id)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      // Load client
      if (campaignData.client_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .eq('id', campaignData.client_id)
          .single();
        if (clientData) setClient(clientData);
      }

      // Load team members
      if (campaignData.campaign_manager_id) {
        const { data: managerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', campaignData.campaign_manager_id)
          .single();
        if (managerData) setCampaignManager(managerData);
      }

      if (campaignData.reviewer_id) {
        const { data: reviewerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', campaignData.reviewer_id)
          .single();
        if (reviewerData) setReviewer(reviewerData);
      }

      // Load content items
      const { data: contentData } = await supabase
        .from('content_items')
        .select('*')
        .eq('campaign_id', params.id)
        .order('created_at', { ascending: false });

      if (contentData) setContentItems(contentData);
    } catch (error) {
      console.error('Error loading campaign:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateCampaignStatus(newStatus: CampaignStatus) {
    if (!canEdit || !campaign) return;

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus })
        .eq('id', campaign.id);

      if (error) throw error;

      setCampaign({ ...campaign, status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update campaign status');
    }
  }

  async function handleAddContent() {
    if (!campaign) return;

    try {
      const { data, error } = await supabase
        .from('content_items')
        .insert([
          {
            campaign_id: campaign.id,
            title: newContent.title,
            description: newContent.description,
            platform: newContent.platform,
            format: newContent.format,
            internal_deadline: newContent.internal_deadline || null,
            client_deadline: newContent.client_deadline || null,
            assigned_influencer_id: newContent.assigned_influencer_id || null,
            status: 'draft' as ContentStatus,
            current_version: 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setContentItems([data, ...contentItems]);
      setShowAddContent(false);
      setNewContent({
        title: '',
        description: '',
        platform: '',
        format: '',
        internal_deadline: '',
        client_deadline: '',
        assigned_influencer_id: '',
      });
    } catch (error) {
      console.error('Error adding content:', error);
      alert('Failed to add content item');
    }
  }

  async function handleDeleteContent(contentId: string) {
    if (!canEdit) return;
    if (!confirm('Are you sure you want to delete this content item?')) return;

    try {
      const { error } = await supabase
        .from('content_items')
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      setContentItems(contentItems.filter((item) => item.id !== contentId));
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content item');
    }
  }

  function getStatusColor(status: CampaignStatus | ContentStatus): string {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      brief_pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-blue-100 text-blue-800',
      content_review: 'bg-purple-100 text-purple-800',
      client_review: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-600',
      pending_internal: 'bg-yellow-100 text-yellow-800',
      internal_rejected: 'bg-red-100 text-red-800',
      pending_client: 'bg-yellow-100 text-yellow-800',
      client_rejected: 'bg-red-100 text-red-800',
      approved: 'bg-green-100 text-green-800',
      published: 'bg-green-600 text-white',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Campaign Not Found</h2>
            <p className="text-gray-600 mb-6">The campaign you're looking for doesn't exist or you don't have access to it.</p>
            <button
              onClick={() => router.push('/campaigns')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Campaigns
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <button
              onClick={() => router.push('/campaigns')}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
            >
              ← Back to Campaigns
            </button>
            <h1 className="text-3xl font-bold text-gray-800">{campaign.campaign_code}</h1>
            <p className="text-xl text-gray-600">{campaign.name}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(campaign.status)}`}>
            {campaign.status.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>

        {/* Campaign Details Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Campaign Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Client</p>
              <p className="font-medium">{client?.company_name || 'Not assigned'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Campaign Manager</p>
              <p className="font-medium">{campaignManager?.full_name || 'Not assigned'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Reviewer</p>
              <p className="font-medium">{reviewer?.full_name || 'Not assigned'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Budget</p>
              <p className="font-medium">
                {campaign.budget_amount ? `${campaign.budget_currency} ${campaign.budget_amount.toLocaleString()}` : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Start Date</p>
              <p className="font-medium">{campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">End Date</p>
              <p className="font-medium">{campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'Not set'}</p>
            </div>
            {campaign.brief_approved_at && (
              <div>
                <p className="text-sm text-gray-600">Brief Approved</p>
                <p className="font-medium">{new Date(campaign.brief_approved_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {canEdit && (
            <div className="mt-6 pt-6 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
              <select
                value={campaign.status}
                onChange={(e) => updateCampaignStatus(e.target.value as CampaignStatus)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="brief_pending">Brief Pending</option>
                <option value="active">Active</option>
                <option value="content_review">Content Review</option>
                <option value="client_review">Client Review</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}
        </div>

        {/* Content Items Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Content Items ({contentItems.length})</h2>
            {canEdit && !showAddContent && (
              <button
                onClick={() => setShowAddContent(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Add Content Item
              </button>
            )}
          </div>

          {/* Add Content Form */}
          {showAddContent && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-800 mb-4">New Content Item</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={newContent.title}
                    onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform *</label>
                  <input
                    type="text"
                    value={newContent.platform}
                    onChange={(e) => setNewContent({ ...newContent, platform: e.target.value })}
                    placeholder="e.g., Instagram, TikTok, YouTube"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                  <input
                    type="text"
                    value={newContent.format}
                    onChange={(e) => setNewContent({ ...newContent, format: e.target.value })}
                    placeholder="e.g., Reel, Story, Post"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Internal Deadline</label>
                  <input
                    type="date"
                    value={newContent.internal_deadline}
                    onChange={(e) => setNewContent({ ...newContent, internal_deadline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Deadline</label>
                  <input
                    type="date"
                    value={newContent.client_deadline}
                    onChange={(e) => setNewContent({ ...newContent, client_deadline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newContent.description}
                    onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddContent}
                  disabled={!newContent.title || !newContent.platform}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add Content Item
                </button>
                <button
                  onClick={() => setShowAddContent(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Content Items List */}
          {contentItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No content items yet</p>
              {canEdit && !showAddContent && (
                <button
                  onClick={() => setShowAddContent(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Add your first content item
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {contentItems.map((item) => (
                <div key={item.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-800">{item.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                      {item.description && <p className="text-sm text-gray-600 mb-2">{item.description}</p>}
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>📱 {item.platform}</span>
                        {item.format && <span>🎨 {item.format}</span>}
                        {item.current_version > 0 && <span>📄 v{item.current_version}</span>}
                        {item.internal_deadline && (
                          <span>📅 Internal: {new Date(item.internal_deadline).toLocaleDateString()}</span>
                        )}
                        {item.client_deadline && (
                          <span>👤 Client: {new Date(item.client_deadline).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleDeleteContent(item.id)}
                        className="text-red-600 hover:text-red-800 ml-4"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
