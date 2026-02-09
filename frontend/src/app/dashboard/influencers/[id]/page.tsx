'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { influencerService } from '@/services/influencer.service';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PlatformBadge from '@/components/influencers/PlatformBadge';
import SocialHandles from '@/components/influencers/SocialHandles';
import AudienceMetricsComponent from '@/components/influencers/AudienceMetrics';
import QualityScoreIndicator from '@/components/influencers/QualityScoreIndicator';
import InfluencerCard from '@/components/influencers/InfluencerCard';
import { formatCurrency } from '@/lib/utils';
import { parseSocialHandles, parseAudienceMetrics, parseContentCategories, parsePerformanceHistory, getDisplayLocation } from '@/types/influencer.types';

export default function InfluencerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['influencer', id],
    queryFn: () => influencerService.getById(id),
    enabled: !!id,
  });

  const { data: similarData } = useQuery({
    queryKey: ['influencer', id, 'similar'],
    queryFn: () => influencerService.findSimilar(id),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => influencerService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencers'] });
      router.push('/dashboard/influencers');
    },
  });

  const showDeleteConfirmation = (onConfirm: () => void) => {
    if (typeof document === 'undefined') {
      // Fallback for non-browser environments: execute immediately
      onConfirm();
      return;
    }

    const overlay = document.createElement('div');
    overlay.className =
      'fixed inset-0 z-50 flex items-center justify-center bg-black/50';

   const dialog = document.createElement('div');
    dialog.className =
      'w-full max-w-sm rounded-lg bg-white p-6 shadow-lg dark:bg-slate-900';

    dialog.innerHTML = `
      <h2 class="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Delete influencer
      </h2>
      <p class="mb-6 text-sm text-slate-600 dark:text-slate-300">
        Are you sure you want to delete this influencer? This action cannot be undone.
      </p>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          data-role="cancel"
          class="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="button"
          data-role="confirm"
          class="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Delete
        </button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const removeOverlay = () => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    };

    const cancelButton = dialog.querySelector<HTMLButtonElement>(
      'button[data-role="cancel"]',
    );
    const confirmButton = dialog.querySelector<HTMLButtonElement>(
      'button[data-role="confirm"]',
    );

    cancelButton?.addEventListener('click', () => {
      removeOverlay();
    });

    confirmButton?.addEventListener('click', () => {
      removeOverlay();
      onConfirm();
    });
  };

  const handleDelete = () => {
    showDeleteConfirmation(() => {
      deleteMutation.mutate();
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-64 bg-gray-200 rounded" />
            <div className="h-96 bg-gray-200 rounded" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data?.data) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Failed to load influencer details.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const influencer = data.data;
  const handles = parseSocialHandles(influencer);
  const metrics = parseAudienceMetrics(influencer);
  const categories = parseContentCategories(influencer);
  const perfHistory = parsePerformanceHistory(influencer);
  const location = getDisplayLocation(influencer);
  const initials = influencer.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const similarInfluencers = similarData?.data || [];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/influencers" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Influencers
          </Link>
        </div>

        {/* Profile Header */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="h-32 w-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                  {initials}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">
                        {influencer.displayName || influencer.fullName}
                      </h1>
                      {influencer.isVerified && (
                        <CheckCircle className="h-6 w-6 text-blue-500" />
                      )}
                    </div>
                    {influencer.displayName && influencer.displayName !== influencer.fullName && (
                      <p className="text-lg text-gray-600 mb-2">{influencer.fullName}</p>
                    )}
                    <PlatformBadge platform={influencer.primaryPlatform} />
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/dashboard/influencers/${id}/edit`}>
                      <Button variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>

                {influencer.bio && (
                  <p className="text-gray-700 mb-4">{influencer.bio}</p>
                )}

                {/* Categories */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((category) => (
                    <span
                      key={category}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700"
                    >
                      {category}
                    </span>
                  ))}
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <a href={`mailto:${influencer.email}`} className="hover:text-purple-600">
                      {influencer.email}
                    </a>
                  </div>
                  {influencer.phone && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <a href={`tel:${influencer.phone}`} className="hover:text-purple-600">
                        {influencer.phone}
                      </a>
                    </div>
                  )}
                  {location && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{location}</span>
                    </div>
                  )}
                </div>

                {/* Quality Score */}
                <QualityScoreIndicator score={influencer.qualityScore} />
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Social Media Handles */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Social Media</h2>
                <SocialHandles handles={handles} />
              </div>
            </Card>

            {/* Audience Metrics */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Audience Metrics</h2>
                <AudienceMetricsComponent metrics={metrics} />
              </div>
            </Card>

            {/* Performance History */}
            {perfHistory.length > 0 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance History</h2>
                  <div className="space-y-3">
                    {perfHistory.map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{record.date}</p>
                          <p className="text-xs text-gray-600">{record.postsCount} posts</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{record.followers.toLocaleString()} followers</p>
                          <p className="text-xs text-green-600">{record.engagementRate.toFixed(2)}% engagement</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rates Card */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Rates</h2>
                <div className="space-y-3">
                  {influencer.ratePerPost && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Per Post</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatCurrency(influencer.ratePerPost)}
                      </span>
                    </div>
                  )}
                  {influencer.ratePerVideo && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Per Video</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatCurrency(influencer.ratePerVideo)}
                      </span>
                    </div>
                  )}
                  {influencer.ratePerStory && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Per Story</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatCurrency(influencer.ratePerStory)}
                      </span>
                    </div>
                  )}
                  {!influencer.ratePerPost && !influencer.ratePerVideo && !influencer.ratePerStory && (
                    <p className="text-sm text-gray-500">No rates available</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Status Card */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Status</h2>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    influencer.availabilityStatus === 'available'
                      ? 'bg-green-100 text-green-800'
                      : influencer.availabilityStatus === 'busy'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {influencer.availabilityStatus.charAt(0).toUpperCase() + influencer.availabilityStatus.slice(1)}
                </span>
              </div>
            </Card>
          </div>
        </div>

        {/* Similar Influencers */}
        {similarInfluencers.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Similar Influencers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarInfluencers.slice(0, 4).map((similar) => (
                <InfluencerCard key={similar.influencerId} influencer={similar} />
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
