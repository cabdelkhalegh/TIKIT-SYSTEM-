'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import EngagementTrendChart from '@/components/charts/EngagementTrendChart';
import { formatCurrency, formatDate, formatNumber, formatRelativeTime } from '@/lib/utils';
import { InfluencerFormModal } from '@/components/influencers';
import {
  ArrowLeft,
  Mail,
  MapPin,
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Award,
  Edit,
  Trash2,
  MessageCircle,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  ShieldCheck,
  Clock,
  Calendar,
  BarChart3,
  Briefcase,
  Eye,
  Heart,
} from 'lucide-react';

interface SocialMediaHandle {
  platform: string;
  handle: string;
  followersCount: number;
  engagementRate: number;
  profileUrl?: string;
}

interface Campaign {
  campaignId: string;
  campaignName: string;
  status: string;
  engagement?: number;
  earnings?: number;
  completedAt?: string;
  client?: {
    brandDisplayName?: string;
    legalCompanyName?: string;
  };
}

interface Influencer {
  influencerId: string;
  fullName: string;
  username?: string;
  email?: string;
  verified?: boolean;
  qualityScore?: number;
  availabilityStatus?: 'available' | 'busy' | 'unavailable';
  bio?: string;
  categories?: string[];
  niche?: string;
  profileImage?: string;
  location?: string;
  socialMediaHandles?: SocialMediaHandle[];
  platforms?: SocialMediaHandle[];
  audienceMetrics?: {
    totalFollowers?: number;
    avgEngagementRate?: number;
    topPlatform?: string;
  };
  campaigns?: Campaign[];
  campaignInfluencers?: Array<{
    campaign: Campaign;
    agreedBudget?: number;
    status: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

const platformIcons: Record<string, typeof Instagram> = {
  instagram: Instagram,
  youtube: Youtube,
  twitter: Twitter,
  facebook: Facebook,
  tiktok: TrendingUp,
};

export default function InfluencerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const influencerId = params.id as string;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch influencer data
  const { data: influencer, isLoading, error } = useQuery({
    queryKey: ['influencer', influencerId],
    queryFn: async () => {
      const response = await apiClient.get(`/influencers/${influencerId}`);
      return response.data.data as Influencer;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/influencers/${influencerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencers'] });
      router.push('/dashboard/influencers');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
    setDeleteDialogOpen(false);
  };

  const handleContact = () => {
    if (influencer?.email) {
      window.location.href = `mailto:${influencer.email}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'invited':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityColor = (status?: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformIcon = (platform: string) => {
    const Icon = platformIcons[platform.toLowerCase()] || Users;
    return Icon;
  };

  // Calculate metrics
  const calculateMetrics = () => {
    if (!influencer) return null;

    const platforms = influencer.socialMediaHandles || influencer.platforms || [];
    const totalFollowers = platforms.reduce((sum, p) => sum + (p.followersCount || 0), 0);
    const avgEngagement = platforms.length > 0
      ? platforms.reduce((sum, p) => sum + (p.engagementRate || 0), 0) / platforms.length
      : 0;
    
    const topPlatform = platforms.length > 0
      ? platforms.reduce((prev, current) => {
          return (current.followersCount || 0) > (prev.followersCount || 0) ? current : prev;
        })
      : null;

    const campaignData = influencer.campaignInfluencers || [];
    const completedCampaigns = campaignData.filter(c => c.status === 'completed').length;
    const totalEarnings = campaignData.reduce((sum, c) => sum + (c.agreedBudget || 0), 0);
    const avgCampaignValue = completedCampaigns > 0 ? totalEarnings / completedCampaigns : 0;

    return {
      totalFollowers,
      avgEngagement,
      topPlatform,
      completedCampaigns,
      totalEarnings,
      avgCampaignValue,
      totalCampaigns: campaignData.length,
    };
  };

  const metrics = calculateMetrics();

  // TODO: Replace with actual engagement trend data from API
  // Mock engagement trend data for visualization
  const engagementTrendData = [
    { date: 'Jan', engagement: 4.2 },
    { date: 'Feb', engagement: 4.5 },
    { date: 'Mar', engagement: 4.8 },
    { date: 'Apr', engagement: 5.1 },
    { date: 'May', engagement: 5.3 },
    { date: 'Jun', engagement: 5.6 },
  ];

  // Loading skeleton
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded" />
              <div className="h-48 bg-gray-200 rounded" />
            </div>
            <div className="space-y-6">
              <div className="h-96 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <p>Failed to load influencer details. Please try again later.</p>
              </div>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/dashboard/influencers')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Influencers
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Not found
  if (!influencer) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card className="border-gray-200">
            <CardContent className="pt-6 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Influencer not found</h3>
              <p className="text-gray-600 mb-4">
                The influencer you&apos;re looking for doesn&apos;t exist or has been deleted.
              </p>
              <Button onClick={() => router.push('/dashboard/influencers')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Influencers
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const platforms = influencer.socialMediaHandles || influencer.platforms || [];
  const categories = influencer.categories || (influencer.niche ? [influencer.niche] : []);
  const campaigns = influencer.campaignInfluencers || [];

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex items-center text-sm text-gray-600">
            <button
              onClick={() => router.push('/dashboard')}
              className="hover:text-purple-600 transition-colors"
            >
              Dashboard
            </button>
            <ChevronRight className="h-4 w-4 mx-2" />
            <button
              onClick={() => router.push('/dashboard/influencers')}
              className="hover:text-purple-600 transition-colors"
            >
              Influencers
            </button>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-900 font-medium">{influencer.fullName}</span>
          </nav>
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/influencers')}
                className="mb-4 -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Influencers
              </Button>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{influencer.fullName}</h1>
                {influencer.verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </span>
                )}
                {influencer.availabilityStatus && (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAvailabilityColor(
                      influencer.availabilityStatus
                    )}`}
                  >
                    {influencer.availabilityStatus.charAt(0).toUpperCase() +
                      influencer.availabilityStatus.slice(1)}
                  </span>
                )}
              </div>
              {influencer.username && (
                <p className="text-gray-600">@{influencer.username}</p>
              )}
            </div>
            <div className="flex gap-2">
              <InfluencerFormModal influencerId={influencerId}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </InfluencerFormModal>
              <Button variant="outline" size="sm" onClick={handleContact}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
                      {influencer.profileImage ? (
                        <img
                          src={influencer.profileImage}
                          alt={influencer.fullName}
                          className="h-24 w-24 rounded-full object-cover"
                        />
                      ) : (
                        influencer.fullName.charAt(0).toUpperCase()
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Full Name</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">
                          {influencer.fullName}
                        </p>
                      </div>
                      {influencer.email && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Email</label>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <a
                              href={`mailto:${influencer.email}`}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              {influencer.email}
                            </a>
                          </div>
                        </div>
                      )}
                      {influencer.location && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Location</label>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <p className="text-gray-900">{influencer.location}</p>
                          </div>
                        </div>
                      )}
                      {influencer.qualityScore !== undefined && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Quality Score</label>
                          <div className="flex items-center gap-2 mt-1">
                            <Award className="h-4 w-4 text-yellow-500" />
                            <p className="text-lg font-bold text-gray-900">
                              {influencer.qualityScore}/100
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bio */}
                    {influencer.bio && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Bio</label>
                        <p className="text-gray-700 mt-1">{influencer.bio}</p>
                      </div>
                    )}

                    {/* Categories */}
                    {categories.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Categories</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {categories.map((category, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Media Section */}
            {platforms.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Social Media Presence</CardTitle>
                  <CardDescription>Platform reach and engagement metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {platforms.map((platform, index) => {
                      const Icon = getPlatformIcon(platform.platform);
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center">
                            <Icon className="h-6 w-6 text-gray-700" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 capitalize">
                              {platform.platform}
                            </p>
                            <p className="text-sm text-gray-600">@{platform.handle}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <div>
                                <p className="text-xs text-gray-500">Followers</p>
                                <p className="text-sm font-bold text-gray-900">
                                  {formatNumber(platform.followersCount)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Engagement</p>
                                <p className="text-sm font-bold text-purple-600">
                                  {platform.engagementRate.toFixed(2)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audience Metrics */}
            {metrics && (
              <Card>
                <CardHeader>
                  <CardTitle>Audience Metrics</CardTitle>
                  <CardDescription>Overall reach and engagement statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 mb-1">Total Followers</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatNumber(metrics.totalFollowers)}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 mb-1">Avg. Engagement</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {metrics.avgEngagement.toFixed(2)}%
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 mb-1">Top Platform</p>
                      <p className="text-lg font-bold text-green-900 capitalize">
                        {metrics.topPlatform?.platform || 'N/A'}
                      </p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 mb-1">Total Campaigns</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {metrics.totalCampaigns}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance Metrics Cards */}
            {metrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <Briefcase className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics.completedCampaigns}
                    </p>
                    <p className="text-sm text-gray-600">Campaigns Completed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(metrics.totalEarnings)}
                    </p>
                    <p className="text-sm text-gray-600">Total Earnings</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics.avgEngagement.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">Avg. Engagement</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <Target className="h-8 w-8 text-pink-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics.completedCampaigns > 0
                        ? ((metrics.completedCampaigns / metrics.totalCampaigns) * 100).toFixed(0)
                        : 0}
                      %
                    </p>
                    <p className="text-sm text-gray-600">Success Rate</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Trends</CardTitle>
                <CardDescription>Engagement performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <EngagementTrendChart data={engagementTrendData} />
              </CardContent>
            </Card>

            {/* Campaign History */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign History</CardTitle>
                <CardDescription>
                  {campaigns.length} campaign collaboration(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {campaigns.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                            Campaign Name
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                            Client
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                            Earnings
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.map((collab) => (
                          <tr
                            key={`${collab.campaign.campaignId}-${influencer.influencerId}`}
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() =>
                              router.push(`/dashboard/campaigns/${collab.campaign.campaignId}`)
                            }
                          >
                            <td className="py-3 px-4">
                              <p className="font-medium text-gray-900">
                                {collab.campaign.campaignName}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-gray-900">
                              {collab.campaign.client?.brandDisplayName ||
                                collab.campaign.client?.legalCompanyName ||
                                'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  collab.status
                                )}`}
                              >
                                {collab.status.charAt(0).toUpperCase() + collab.status.slice(1)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-900">
                              {collab.agreedBudget
                                ? formatCurrency(collab.agreedBudget)
                                : 'Not set'}
                            </td>
                            <td className="py-3 px-4 text-gray-600 text-sm">
                              {collab.campaign.completedAt
                                ? formatDate(collab.campaign.completedAt)
                                : 'Ongoing'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      No campaign history
                    </h3>
                    <p className="text-sm text-gray-600">
                      This influencer hasn&apos;t participated in any campaigns yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Influencer ID</span>
                  <span className="text-sm font-mono text-gray-900">
                    {influencer.influencerId.slice(0, 8)}...
                  </span>
                </div>
                {influencer.createdAt && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Member Since</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(influencer.createdAt)}
                    </span>
                  </div>
                )}
                {metrics && (
                  <>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Total Campaigns</span>
                      <span className="text-sm font-medium text-gray-900">
                        {metrics.totalCampaigns}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Avg. Campaign Value</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(metrics.avgCampaignValue)}
                      </span>
                    </div>
                  </>
                )}
                {influencer.updatedAt && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Last Active</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatRelativeTime(influencer.updatedAt)}
                    </span>
                  </div>
                )}
                {influencer.qualityScore !== undefined && (
                  <div className="flex items-center justify-between py-2 border-t border-gray-100 pt-4">
                    <span className="text-sm text-gray-600">Quality Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${influencer.qualityScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-purple-600">
                        {influencer.qualityScore}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>Recent activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {influencer.updatedAt && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 bg-purple-600 rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Profile Updated</p>
                        <p className="text-xs text-gray-600">
                          {formatRelativeTime(influencer.updatedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                  {campaigns.length > 0 && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-600 rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Latest Campaign
                        </p>
                        <p className="text-xs text-gray-600">
                          {campaigns[0].campaign.campaignName}
                        </p>
                      </div>
                    </div>
                  )}
                  {influencer.createdAt && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 bg-gray-400 rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Joined Platform</p>
                        <p className="text-xs text-gray-600">
                          {formatRelativeTime(influencer.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Influencer</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{influencer.fullName}&quot;? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Influencer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
