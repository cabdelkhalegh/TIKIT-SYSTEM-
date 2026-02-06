'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ArrowLeft, Target, TrendingUp, Mail } from 'lucide-react';
import Link from 'next/link';
import { influencerService } from '@/services/influencer.service';
import { campaignService } from '@/services/campaign.service';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import InfluencerCard from '@/components/influencers/InfluencerCard';
import { formatCurrency, formatDate } from '@/lib/utils';

// SVG Circle Progress Constants
// Circle radius = 32px, circumference = 2πr ≈ 201px
const CIRCLE_RADIUS = 32;
const CIRCLE_CENTER = 40; // SVG viewbox center
const CIRCLE_CIRCUMFERENCE = 201; // 2 * Math.PI * CIRCLE_RADIUS ≈ 201
const CIRCLE_STROKE_WIDTH = 6;

export default function CampaignMatchPage() {
  const params = useParams();
  const campaignId = params.campaignId as string;

  const { data: campaignData, isLoading: campaignLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignService.getById(campaignId),
    enabled: !!campaignId,
  });

  const { data: matchData, isLoading: matchLoading, error } = useQuery({
    queryKey: ['campaign-matches', campaignId],
    queryFn: () => influencerService.findMatchesForCampaign(campaignId),
    enabled: !!campaignId,
  });

  const campaign = campaignData?.data;
  const matches = matchData?.data || [];

  const isLoading = campaignLoading || matchLoading;

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/campaigns" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Influencer Matches</h1>
          <p className="mt-1 text-gray-600">AI-recommended influencers for your campaign</p>
        </div>

        {/* Campaign Details */}
        {campaign && (
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">{campaign.campaignName}</h2>
                  {campaign.campaignDescription && (
                    <p className="text-gray-600 mb-4">{campaign.campaignDescription}</p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    campaign.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : campaign.status === 'draft'
                      ? 'bg-gray-100 text-gray-800'
                      : campaign.status === 'paused'
                      ? 'bg-yellow-100 text-yellow-800'
                      : campaign.status === 'completed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {campaign.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Budget</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(campaign.totalBudget || 0)}
                  </p>
                </div>
                {campaign.startDate && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Start Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(campaign.startDate)}
                    </p>
                  </div>
                )}
                {campaign.endDate && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">End Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(campaign.endDate)}
                    </p>
                  </div>
                )}
                {campaign.targetAudience && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Target Audience</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {campaign.targetAudience.demographics?.ageRange || 'All ages'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Failed to load influencer matches. Please try again.</p>
          </div>
        )}

        {/* Matches */}
        {!isLoading && !error && (
          <>
            {matches.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches found</h3>
                <p className="text-gray-600 mb-6">
                  We couldn&apos;t find any influencers matching your campaign criteria.
                </p>
                <Link href="/dashboard/influencers/search">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Search Manually
                  </Button>
                </Link>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Best Matches ({matches.length})
                  </h2>
                  <p className="text-gray-600">
                    Sorted by match score - these influencers are most likely to deliver great results for your campaign
                  </p>
                </div>

                <div className="space-y-6">
                  {matches.map((match) => (
                    <Card key={match.influencer.id} className="overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-start gap-6">
                          {/* Match Score Badge */}
                          <div className="flex-shrink-0 text-center">
                            <div className="relative inline-flex items-center justify-center">
                              <svg className="w-20 h-20">
                                {/* Background circle */}
                                <circle
                                  className="text-gray-200"
                                  strokeWidth={CIRCLE_STROKE_WIDTH}
                                  stroke="currentColor"
                                  fill="transparent"
                                  r={CIRCLE_RADIUS}
                                  cx={CIRCLE_CENTER}
                                  cy={CIRCLE_CENTER}
                                />
                                {/* Progress circle - strokeDasharray creates the progress effect */}
                                {/* First value: progress length, Second value: total circumference */}
                                <circle
                                  className="text-purple-600"
                                  strokeWidth={CIRCLE_STROKE_WIDTH}
                                  strokeDasharray={`${match.matchScore * 2.01} ${CIRCLE_CIRCUMFERENCE}`}
                                  strokeLinecap="round"
                                  stroke="currentColor"
                                  fill="transparent"
                                  r={CIRCLE_RADIUS}
                                  cx={CIRCLE_CENTER}
                                  cy={CIRCLE_CENTER}
                                  transform={`rotate(-90 ${CIRCLE_CENTER} ${CIRCLE_CENTER})`}
                                />
                              </svg>
                              <span className="absolute text-xl font-bold text-purple-600">
                                {match.matchScore}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">Match Score</p>
                          </div>

                          {/* Influencer Info */}
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/dashboard/influencers/${match.influencer.id}`}
                              className="text-xl font-semibold text-gray-900 hover:text-purple-600"
                            >
                              {match.influencer.displayName || match.influencer.fullName}
                            </Link>
                            
                            {match.influencer.bio && (
                              <p className="text-gray-600 mt-2">{match.influencer.bio}</p>
                            )}

                            {/* Match Reasons */}
                            <div className="mt-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">Why this is a good match:</p>
                              <ul className="space-y-1">
                                {match.reasons.map((reason, index) => (
                                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                                    <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span>{reason}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Quick Stats */}
                            <div className="mt-4 flex flex-wrap gap-6">
                              <div>
                                <p className="text-xs text-gray-600">Followers</p>
                                <p className="text-lg font-semibold text-gray-900">
                                  {match.influencer.audienceMetrics.followers.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Engagement</p>
                                <p className="text-lg font-semibold text-green-600">
                                  {match.influencer.audienceMetrics.engagementRate.toFixed(2)}%
                                </p>
                              </div>
                              {match.influencer.rates.perPost && (
                                <div>
                                  <p className="text-xs text-gray-600">Rate per Post</p>
                                  <p className="text-lg font-semibold text-gray-900">
                                    {formatCurrency(match.influencer.rates.perPost)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex-shrink-0 flex flex-col gap-2">
                            <Link href={`/dashboard/influencers/${match.influencer.id}`}>
                              <Button variant="outline" className="w-full">
                                View Profile
                              </Button>
                            </Link>
                            <Button className="bg-purple-600 hover:bg-purple-700 w-full">
                              <Mail className="h-4 w-4 mr-2" />
                              Contact
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
