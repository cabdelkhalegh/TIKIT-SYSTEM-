'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Influencer, Platform, ContentCategory } from '@/types/influencer.types';
import { parseSocialHandles, parseAudienceMetrics, parseContentCategories } from '@/types/influencer.types';

const influencerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  displayName: z.string().optional(),
  bio: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  
  // Social Media Handles
  instagramHandle: z.string().optional(),
  tiktokHandle: z.string().optional(),
  youtubeHandle: z.string().optional(),
  twitterHandle: z.string().optional(),
  facebookHandle: z.string().optional(),
  linkedinHandle: z.string().optional(),
  
  primaryPlatform: z.enum(['instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'linkedin']),
  
  // Audience Metrics
  followers: z.number().min(0),
  engagementRate: z.number().min(0).max(100),
  avgViews: z.number().min(0),
  avgLikes: z.number().min(0).optional(),
  avgComments: z.number().min(0).optional(),
  
  // Rates
  ratePerPost: z.number().min(0).optional(),
  ratePerVideo: z.number().min(0).optional(),
  ratePerStory: z.number().min(0).optional(),
  
  city: z.string().optional(),
  country: z.string().optional(),
  isVerified: z.boolean().default(false),
  availabilityStatus: z.enum(['available', 'busy', 'unavailable']).default('available'),
});

type InfluencerFormData = z.infer<typeof influencerSchema>;

interface InfluencerFormProps {
  influencer?: Influencer;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const contentCategories: ContentCategory[] = [
  'lifestyle', 'beauty', 'fitness', 'tech', 'fashion', 'food',
  'travel', 'gaming', 'business', 'education', 'entertainment',
  'health', 'parenting', 'sports'
];

export default function InfluencerForm({
  influencer,
  onSubmit,
  onCancel,
  isLoading = false,
}: InfluencerFormProps) {
  const handles = influencer ? parseSocialHandles(influencer) : {};
  const metrics = influencer ? parseAudienceMetrics(influencer) : null;
  const existingCategories = influencer ? parseContentCategories(influencer) : [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InfluencerFormData>({
    resolver: zodResolver(influencerSchema),
    defaultValues: influencer ? {
      fullName: influencer.fullName,
      displayName: influencer.displayName || '',
      bio: influencer.bio || '',
      email: influencer.email,
      phone: influencer.phone || '',
      instagramHandle: handles.instagram || '',
      tiktokHandle: handles.tiktok || '',
      youtubeHandle: handles.youtube || '',
      twitterHandle: handles.twitter || '',
      facebookHandle: handles.facebook || '',
      linkedinHandle: handles.linkedin || '',
      primaryPlatform: influencer.primaryPlatform,
      followers: metrics?.followers || 0,
      engagementRate: metrics?.engagementRate || 0,
      avgViews: metrics?.avgViews || 0,
      avgLikes: metrics?.avgLikes || 0,
      avgComments: metrics?.avgComments || 0,
      ratePerPost: influencer.ratePerPost || 0,
      ratePerVideo: influencer.ratePerVideo || 0,
      ratePerStory: influencer.ratePerStory || 0,
      city: influencer.city || '',
      country: influencer.country || '',
      isVerified: influencer.isVerified,
      availabilityStatus: influencer.availabilityStatus as 'available' | 'busy' | 'unavailable',
    } : {
      isVerified: false,
      availabilityStatus: 'available' as const,
    },
  });

  const [selectedCategories, setSelectedCategories] = React.useState<ContentCategory[]>(
    existingCategories
  );

  const handleFormSubmit = (data: InfluencerFormData) => {
    const formattedData = {
      fullName: data.fullName,
      displayName: data.displayName,
      bio: data.bio,
      email: data.email,
      phone: data.phone,
      socialMediaHandles: JSON.stringify({
        instagram: data.instagramHandle,
        tiktok: data.tiktokHandle,
        youtube: data.youtubeHandle,
        twitter: data.twitterHandle,
        facebook: data.facebookHandle,
        linkedin: data.linkedinHandle,
      }),
      primaryPlatform: data.primaryPlatform,
      contentCategories: JSON.stringify(selectedCategories),
      audienceMetrics: JSON.stringify({
        followers: Number(data.followers),
        engagementRate: Number(data.engagementRate),
        avgViews: Number(data.avgViews),
        avgLikes: data.avgLikes ? Number(data.avgLikes) : undefined,
        avgComments: data.avgComments ? Number(data.avgComments) : undefined,
      }),
      ratePerPost: data.ratePerPost ? Number(data.ratePerPost) : undefined,
      ratePerVideo: data.ratePerVideo ? Number(data.ratePerVideo) : undefined,
      ratePerStory: data.ratePerStory ? Number(data.ratePerStory) : undefined,
      city: data.city,
      country: data.country,
      isVerified: data.isVerified,
      availabilityStatus: data.availabilityStatus,
    };

    onSubmit(formattedData);
  };

  const toggleCategory = (category: ContentCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              {...register('fullName')}
              placeholder="John Doe"
            />
            {errors.fullName && (
              <p className="text-sm text-red-600 mt-1">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              {...register('displayName')}
              placeholder="@johndoe"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              {...register('bio')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
      </div>

      {/* Social Media Handles */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media Handles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primaryPlatform">Primary Platform *</Label>
            <select
              id="primaryPlatform"
              {...register('primaryPlatform')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="twitter">Twitter</option>
              <option value="facebook">Facebook</option>
              <option value="linkedin">LinkedIn</option>
            </select>
            {errors.primaryPlatform && (
              <p className="text-sm text-red-600 mt-1">{errors.primaryPlatform.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="instagramHandle">Instagram Handle</Label>
            <Input
              id="instagramHandle"
              {...register('instagramHandle')}
              placeholder="johndoe"
            />
          </div>

          <div>
            <Label htmlFor="tiktokHandle">TikTok Handle</Label>
            <Input
              id="tiktokHandle"
              {...register('tiktokHandle')}
              placeholder="johndoe"
            />
          </div>

          <div>
            <Label htmlFor="youtubeHandle">YouTube Handle</Label>
            <Input
              id="youtubeHandle"
              {...register('youtubeHandle')}
              placeholder="johndoe"
            />
          </div>

          <div>
            <Label htmlFor="twitterHandle">Twitter Handle</Label>
            <Input
              id="twitterHandle"
              {...register('twitterHandle')}
              placeholder="johndoe"
            />
          </div>

          <div>
            <Label htmlFor="facebookHandle">Facebook Handle</Label>
            <Input
              id="facebookHandle"
              {...register('facebookHandle')}
              placeholder="johndoe"
            />
          </div>

          <div>
            <Label htmlFor="linkedinHandle">LinkedIn Handle</Label>
            <Input
              id="linkedinHandle"
              {...register('linkedinHandle')}
              placeholder="johndoe"
            />
          </div>
        </div>
      </div>

      {/* Content Categories */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {contentCategories.map((category) => (
            <label
              key={category}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => toggleCategory(category)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 capitalize">{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Audience Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="followers">Followers *</Label>
            <Input
              id="followers"
              type="number"
              {...register('followers', { valueAsNumber: true })}
              placeholder="100000"
            />
            {errors.followers && (
              <p className="text-sm text-red-600 mt-1">{errors.followers.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="engagementRate">Engagement Rate (%) *</Label>
            <Input
              id="engagementRate"
              type="number"
              step="0.01"
              {...register('engagementRate', { valueAsNumber: true })}
              placeholder="5.5"
            />
            {errors.engagementRate && (
              <p className="text-sm text-red-600 mt-1">{errors.engagementRate.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="avgViews">Average Views *</Label>
            <Input
              id="avgViews"
              type="number"
              {...register('avgViews', { valueAsNumber: true })}
              placeholder="50000"
            />
            {errors.avgViews && (
              <p className="text-sm text-red-600 mt-1">{errors.avgViews.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="avgLikes">Average Likes</Label>
            <Input
              id="avgLikes"
              type="number"
              {...register('avgLikes', { valueAsNumber: true })}
              placeholder="5000"
            />
          </div>

          <div>
            <Label htmlFor="avgComments">Average Comments</Label>
            <Input
              id="avgComments"
              type="number"
              {...register('avgComments', { valueAsNumber: true })}
              placeholder="500"
            />
          </div>
        </div>
      </div>

      {/* Rates */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rates (USD)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ratePerPost">Per Post</Label>
            <Input
              id="ratePerPost"
              type="number"
              {...register('ratePerPost', { valueAsNumber: true })}
              placeholder="500"
            />
          </div>

          <div>
            <Label htmlFor="ratePerVideo">Per Video</Label>
            <Input
              id="ratePerVideo"
              type="number"
              {...register('ratePerVideo', { valueAsNumber: true })}
              placeholder="1000"
            />
          </div>

          <div>
            <Label htmlFor="ratePerStory">Per Story</Label>
            <Input
              id="ratePerStory"
              type="number"
              {...register('ratePerStory', { valueAsNumber: true })}
              placeholder="200"
            />
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              {...register('city')}
              placeholder="Los Angeles"
            />
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              {...register('country')}
              placeholder="United States"
            />
          </div>

          <div>
            <Label htmlFor="availabilityStatus">Availability Status</Label>
            <select
              id="availabilityStatus"
              {...register('availabilityStatus')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              id="isVerified"
              type="checkbox"
              {...register('isVerified')}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <Label htmlFor="isVerified" className="mb-0">Verified Influencer</Label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
          {isLoading ? 'Saving...' : influencer ? 'Update Influencer' : 'Create Influencer'}
        </Button>
      </div>
    </form>
  );
}
