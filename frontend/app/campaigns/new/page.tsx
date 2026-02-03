'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Client, Profile } from '@/types';
import { isCampaignManagerOrHigher } from '@/utils/rbac';

export default function NewCampaignPage() {
  return (
    <ProtectedRoute>
      <NewCampaignContent />
    </ProtectedRoute>
  );
}

function NewCampaignContent() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [campaignManagers, setCampaignManagers] = useState<Profile[]>([]);
  const [reviewers, setReviewers] = useState<Profile[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    description: '',
    start_date: '',
    end_date: '',
    budget_amount: '',
    budget_currency: 'USD',
    campaign_manager_id: '',
    reviewer_id: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check permissions
    if (profile && !isCampaignManagerOrHigher(profile.role)) {
      router.push('/dashboard');
      return;
    }

    fetchClients();
    fetchTeamMembers();
  }, [profile]);

  async function fetchClients() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error('Error fetching clients:', error.message);
    }
  }

  async function fetchTeamMembers() {
    try {
      // Fetch campaign managers
      const { data: managers, error: managersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'campaign_manager')
        .eq('role_approved', true)
        .order('full_name');

      if (managersError) throw managersError;
      setCampaignManagers(managers || []);

      // Fetch reviewers
      const { data: reviewerList, error: reviewersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'reviewer')
        .eq('role_approved', true)
        .order('full_name');

      if (reviewersError) throw reviewersError;
      setReviewers(reviewerList || []);
    } catch (error: any) {
      console.error('Error fetching team members:', error.message);
    }
  }

  function validate() {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    }

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    if (formData.budget_amount && parseFloat(formData.budget_amount) < 0) {
      newErrors.budget_amount = 'Budget must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const campaignData = {
        name: formData.name,
        client_id: formData.client_id || null,
        description: formData.description || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        budget_amount: formData.budget_amount ? parseFloat(formData.budget_amount) : null,
        budget_currency: formData.budget_currency,
        campaign_manager_id: formData.campaign_manager_id || null,
        reviewer_id: formData.reviewer_id || null,
        status: 'draft',
        created_by: user?.id,
      };

      const { data, error } = await supabase
        .from('campaigns')
        .insert([campaignData])
        .select()
        .single();

      if (error) throw error;

      router.push(`/campaigns/${data.id}`);
    } catch (error: any) {
      console.error('Error creating campaign:', error.message);
      alert('Failed to create campaign: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-indigo-600 hover:text-indigo-800 mb-4"
          >
            ← Back to Campaigns
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
          <p className="text-gray-600 mt-1">
            Campaign code will be auto-generated (e.g., TKT-2026-0001)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          {/* Campaign Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Summer Collection 2026"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Client */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client
            </label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.client_code})
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Brief description of the campaign objectives..."
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.end_date && (
                <p className="text-red-600 text-sm mt-1">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.budget_amount}
                onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="10000.00"
              />
              {errors.budget_amount && (
                <p className="text-red-600 text-sm mt-1">{errors.budget_amount}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={formData.budget_currency}
                onChange={(e) => setFormData({ ...formData, budget_currency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
            </div>
          </div>

          {/* Team Assignment */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Manager
              </label>
              <select
                value={formData.campaign_manager_id}
                onChange={(e) =>
                  setFormData({ ...formData, campaign_manager_id: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Assign later</option>
                {campaignManagers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.full_name || manager.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reviewer
              </label>
              <select
                value={formData.reviewer_id}
                onChange={(e) => setFormData({ ...formData, reviewer_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Assign later</option>
                {reviewers.map((reviewer) => (
                  <option key={reviewer.id} value={reviewer.id}>
                    {reviewer.full_name || reviewer.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
