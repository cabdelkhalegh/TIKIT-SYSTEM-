'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@/lib/supabase';
import { ContentItem, KPISource } from '../types';

interface KPIEntryFormProps {
  campaignId: string;
  contentItems: ContentItem[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function KPIEntryForm({ campaignId, contentItems, onSuccess, onCancel }: KPIEntryFormProps) {
  const supabase = createClientComponentClient();
  
  const [selectedContentItem, setSelectedContentItem] = useState('');
  const [snapshotDate, setSnapshotDate] = useState(new Date().toISOString().slice(0, 16));
  const [dataSource, setDataSource] = useState<KPISource>('manual');
  
  const [views, setViews] = useState('');
  const [likes, setLikes] = useState('');
  const [comments, setComments] = useState('');
  const [shares, setShares] = useState('');
  const [saves, setSaves] = useState('');
  const [reach, setReach] = useState('');
  const [impressions, setImpressions] = useState('');
  const [engagementRate, setEngagementRate] = useState('');
  
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Auto-calculate engagement rate
  useEffect(() => {
    if (autoCalculate && reach && parseInt(reach) > 0) {
      const totalInteractions = 
        (parseInt(likes) || 0) +
        (parseInt(comments) || 0) +
        (parseInt(shares) || 0) +
        (parseInt(saves) || 0);
      
      const rate = (totalInteractions / parseInt(reach)) * 100;
      setEngagementRate(rate.toFixed(2));
    }
  }, [likes, comments, shares, saves, reach, autoCalculate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!selectedContentItem) {
      setError('Please select a content item');
      return;
    }

    const hasAtLeastOneMetric = views || likes || comments || shares || saves || reach || impressions;
    if (!hasAtLeastOneMetric) {
      setError('Please enter at least one metric');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const kpiData = {
        content_item_id: selectedContentItem,
        snapshot_date: new Date(snapshotDate).toISOString(),
        data_source: dataSource,
        views: views ? parseInt(views) : null,
        likes: likes ? parseInt(likes) : null,
        comments: comments ? parseInt(comments) : null,
        shares: shares ? parseInt(shares) : null,
        saves: saves ? parseInt(saves) : null,
        reach: reach ? parseInt(reach) : null,
        impressions: impressions ? parseInt(impressions) : null,
        engagement_rate: engagementRate ? parseFloat(engagementRate) : null,
        created_by: user.id,
      };

      const { error: insertError } = await supabase
        .from('kpis')
        .insert(kpiData);

      if (insertError) throw insertError;

      setSuccess(true);
      
      // Reset form
      setSelectedContentItem('');
      setViews('');
      setLikes('');
      setComments('');
      setShares('');
      setSaves('');
      setReach('');
      setImpressions('');
      setEngagementRate('');
      
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1000);
      }
    } catch (err) {
      console.error('Error saving KPI:', err);
      setError(err instanceof Error ? err.message : 'Failed to save KPI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div>
        <h3 className="text-lg font-semibold mb-4">Add KPI Data</h3>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          KPI data saved successfully!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content Item *
          </label>
          <select
            value={selectedContentItem}
            onChange={(e) => setSelectedContentItem(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          >
            <option value="">Select content item</option>
            {contentItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({item.platform})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Snapshot Date/Time *
          </label>
          <input
            type="datetime-local"
            value={snapshotDate}
            onChange={(e) => setSnapshotDate(e.target.value)}
            max={new Date().toISOString().slice(0, 16)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Source
          </label>
          <select
            value={dataSource}
            onChange={(e) => setDataSource(e.target.value as KPISource)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="manual">Manual Entry</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="facebook">Facebook</option>
          </select>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Metrics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Views</label>
            <input
              type="number"
              value={views}
              onChange={(e) => setViews(e.target.value)}
              min="0"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Likes</label>
            <input
              type="number"
              value={likes}
              onChange={(e) => setLikes(e.target.value)}
              min="0"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Comments</label>
            <input
              type="number"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              min="0"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Shares</label>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              min="0"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Saves</label>
            <input
              type="number"
              value={saves}
              onChange={(e) => setSaves(e.target.value)}
              min="0"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Reach</label>
            <input
              type="number"
              value={reach}
              onChange={(e) => setReach(e.target.value)}
              min="0"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Impressions</label>
            <input
              type="number"
              value={impressions}
              onChange={(e) => setImpressions(e.target.value)}
              min="0"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Engagement Rate (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={engagementRate}
                onChange={(e) => {
                  setEngagementRate(e.target.value);
                  setAutoCalculate(false);
                }}
                min="0"
                max="100"
                step="0.01"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder={autoCalculate ? 'Auto' : '0.00'}
                disabled={autoCalculate}
              />
            </div>
          </div>
        </div>

        <div className="mt-2">
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoCalculate}
              onChange={(e) => setAutoCalculate(e.target.checked)}
              className="mr-2"
            />
            Auto-calculate engagement rate from interactions / reach
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save KPI Data'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
