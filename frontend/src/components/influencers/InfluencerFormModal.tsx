'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';

// Category options
const CATEGORIES = [
  { id: 'fashion', label: 'Fashion' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'tech', label: 'Tech' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'food', label: 'Food' },
  { id: 'travel', label: 'Travel' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'gaming', label: 'Gaming' },
] as const;

// Platform options
const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'facebook', label: 'Facebook' },
] as const;

// Availability status options
const AVAILABILITY_STATUS = [
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'not_available', label: 'Not Available' },
] as const;

// Form validation schema
const influencerFormSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Please enter a valid email address'),
  bio: z.string().max(500, 'Bio must not exceed 500 characters').optional(),
  categories: z.array(z.string()).min(1, 'Select at least one category'),
  primaryPlatform: z.enum(['instagram', 'youtube', 'tiktok', 'twitter', 'facebook'], {
    required_error: 'Please select a primary platform',
  }),
  profileImageUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  location: z.string().optional(),
  // Social media handles
  instagramHandle: z.string().optional(),
  instagramFollowers: z.number().min(0).optional().nullable(),
  youtubeHandle: z.string().optional(),
  youtubeFollowers: z.number().min(0).optional().nullable(),
  tiktokHandle: z.string().optional(),
  tiktokFollowers: z.number().min(0).optional().nullable(),
  twitterHandle: z.string().optional(),
  twitterFollowers: z.number().min(0).optional().nullable(),
  facebookHandle: z.string().optional(),
  facebookFollowers: z.number().min(0).optional().nullable(),
  // Metrics
  qualityScore: z.number().min(0).max(100),
  availabilityStatus: z.enum(['available', 'busy', 'not_available'], {
    required_error: 'Please select availability status',
  }),
});

type InfluencerFormData = z.infer<typeof influencerFormSchema>;

interface InfluencerFormModalProps {
  influencerId?: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export function InfluencerFormModal({ influencerId, children, onSuccess }: InfluencerFormModalProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const isEditMode = !!influencerId;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<InfluencerFormData>({
    resolver: zodResolver(influencerFormSchema),
    defaultValues: {
      categories: [],
      qualityScore: 50,
      availabilityStatus: 'available',
      instagramFollowers: null,
      youtubeFollowers: null,
      tiktokFollowers: null,
      twitterFollowers: null,
      facebookFollowers: null,
    },
  });

  const selectedCategories = watch('categories') || [];
  const primaryPlatform = watch('primaryPlatform');
  const availabilityStatus = watch('availabilityStatus');
  const qualityScore = watch('qualityScore');

  // Fetch influencer data for edit mode
  const { data: influencerData } = useQuery({
    queryKey: ['influencer', influencerId],
    queryFn: async () => {
      if (!influencerId) return null;
      const response = await apiClient.get(`/influencers/${influencerId}`);
      return response.data.data;
    },
    enabled: !!influencerId && open,
  });

  // Populate form when editing
  useEffect(() => {
    if (influencerData && isEditMode) {
      reset({
        fullName: influencerData.fullName || '',
        username: influencerData.username || '',
        email: influencerData.email || '',
        bio: influencerData.bio || '',
        categories: influencerData.categories || [],
        primaryPlatform: influencerData.primaryPlatform || 'instagram',
        profileImageUrl: influencerData.profileImageUrl || '',
        location: influencerData.location || '',
        instagramHandle: influencerData.socialMedia?.instagram?.handle || '',
        instagramFollowers: influencerData.socialMedia?.instagram?.followers || null,
        youtubeHandle: influencerData.socialMedia?.youtube?.handle || '',
        youtubeFollowers: influencerData.socialMedia?.youtube?.followers || null,
        tiktokHandle: influencerData.socialMedia?.tiktok?.handle || '',
        tiktokFollowers: influencerData.socialMedia?.tiktok?.followers || null,
        twitterHandle: influencerData.socialMedia?.twitter?.handle || '',
        twitterFollowers: influencerData.socialMedia?.twitter?.followers || null,
        facebookHandle: influencerData.socialMedia?.facebook?.handle || '',
        facebookFollowers: influencerData.socialMedia?.facebook?.followers || null,
        qualityScore: influencerData.qualityScore || 50,
        availabilityStatus: influencerData.availabilityStatus || 'available',
      });
    }
  }, [influencerData, isEditMode, reset]);

  // Create/update influencer mutation
  const saveInfluencerMutation = useMutation({
    mutationFn: async (data: InfluencerFormData) => {
      const payload = {
        fullName: data.fullName,
        username: data.username,
        email: data.email,
        bio: data.bio || '',
        categories: data.categories,
        primaryPlatform: data.primaryPlatform,
        profileImageUrl: data.profileImageUrl || undefined,
        location: data.location || undefined,
        socialMedia: {
          ...(data.instagramHandle && {
            instagram: {
              handle: data.instagramHandle,
              followers: data.instagramFollowers || 0,
            },
          }),
          ...(data.youtubeHandle && {
            youtube: {
              handle: data.youtubeHandle,
              followers: data.youtubeFollowers || 0,
            },
          }),
          ...(data.tiktokHandle && {
            tiktok: {
              handle: data.tiktokHandle,
              followers: data.tiktokFollowers || 0,
            },
          }),
          ...(data.twitterHandle && {
            twitter: {
              handle: data.twitterHandle,
              followers: data.twitterFollowers || 0,
            },
          }),
          ...(data.facebookHandle && {
            facebook: {
              handle: data.facebookHandle,
              followers: data.facebookFollowers || 0,
            },
          }),
        },
        qualityScore: data.qualityScore,
        availabilityStatus: data.availabilityStatus,
      };

      if (isEditMode) {
        const response = await apiClient.put(`/influencers/${influencerId}`, payload);
        return response.data;
      } else {
        const response = await apiClient.post('/influencers', payload);
        return response.data;
      }
    },
    onSuccess: () => {
      toast.success(isEditMode ? 'Influencer updated successfully!' : 'Influencer created successfully!');
      queryClient.invalidateQueries({ queryKey: ['influencers'] });
      if (influencerId) {
        queryClient.invalidateQueries({ queryKey: ['influencer', influencerId] });
      }
      setOpen(false);
      reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || 
        `Failed to ${isEditMode ? 'update' : 'create'} influencer. Please try again.`;
      toast.error(errorMessage);
    },
  });

  const onSubmit = (data: InfluencerFormData) => {
    saveInfluencerMutation.mutate(data);
  };

  const handleCategoryToggle = (categoryId: string) => {
    const currentCategories = selectedCategories;
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter((c) => c !== categoryId)
      : [...currentCategories, categoryId];
    setValue('categories', newCategories, { shouldValidate: true });
  };

  const handleDialogChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Influencer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Influencer' : 'Add New Influencer'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update influencer information and social media profiles.'
              : 'Add a new influencer to your network. Fill in their details and social media information.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  placeholder="e.g., Jane Doe"
                  {...register('fullName')}
                  disabled={saveInfluencerMutation.isPending}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-500">{errors.fullName.message}</p>
                )}
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">
                  Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  placeholder="e.g., jane_doe"
                  {...register('username')}
                  disabled={saveInfluencerMutation.isPending}
                />
                {errors.username && (
                  <p className="text-sm text-red-500">{errors.username.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  {...register('email')}
                  disabled={saveInfluencerMutation.isPending}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Los Angeles, CA"
                  {...register('location')}
                  disabled={saveInfluencerMutation.isPending}
                />
                {errors.location && (
                  <p className="text-sm text-red-500">{errors.location.message}</p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Brief bio about the influencer..."
                rows={3}
                {...register('bio')}
                disabled={saveInfluencerMutation.isPending}
              />
              <p className="text-xs text-gray-500">Max 500 characters</p>
              {errors.bio && (
                <p className="text-sm text-red-500">{errors.bio.message}</p>
              )}
            </div>

            {/* Profile Image URL */}
            <div className="space-y-2">
              <Label htmlFor="profileImageUrl">Profile Image URL</Label>
              <Input
                id="profileImageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                {...register('profileImageUrl')}
                disabled={saveInfluencerMutation.isPending}
              />
              {errors.profileImageUrl && (
                <p className="text-sm text-red-500">{errors.profileImageUrl.message}</p>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label>
              Categories <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border rounded-md">
              {CATEGORIES.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                    disabled={saveInfluencerMutation.isPending}
                  />
                  <Label
                    htmlFor={category.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {category.label}
                  </Label>
                </div>
              ))}
            </div>
            {errors.categories && (
              <p className="text-sm text-red-500">{errors.categories.message}</p>
            )}
          </div>

          {/* Primary Platform */}
          <div className="space-y-2">
            <Label htmlFor="primaryPlatform">
              Primary Platform <span className="text-red-500">*</span>
            </Label>
            <Select
              value={primaryPlatform}
              onValueChange={(value) =>
                setValue('primaryPlatform', value as InfluencerFormData['primaryPlatform'], {
                  shouldValidate: true,
                })
              }
              disabled={saveInfluencerMutation.isPending}
            >
              <SelectTrigger id="primaryPlatform">
                <SelectValue placeholder="Select primary platform" />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((platform) => (
                  <SelectItem key={platform.value} value={platform.value}>
                    {platform.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.primaryPlatform && (
              <p className="text-sm text-red-500">{errors.primaryPlatform.message}</p>
            )}
          </div>

          {/* Social Media Handles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Social Media Profiles</h3>
            
            {/* Instagram */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-gray-50">
              <div className="space-y-2">
                <Label htmlFor="instagramHandle">Instagram Handle</Label>
                <Input
                  id="instagramHandle"
                  placeholder="@username"
                  {...register('instagramHandle')}
                  disabled={saveInfluencerMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagramFollowers">Followers</Label>
                <Input
                  id="instagramFollowers"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register('instagramFollowers', { valueAsNumber: true })}
                  disabled={saveInfluencerMutation.isPending}
                />
              </div>
            </div>

            {/* YouTube */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-gray-50">
              <div className="space-y-2">
                <Label htmlFor="youtubeHandle">YouTube Channel</Label>
                <Input
                  id="youtubeHandle"
                  placeholder="channel-name"
                  {...register('youtubeHandle')}
                  disabled={saveInfluencerMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtubeFollowers">Subscribers</Label>
                <Input
                  id="youtubeFollowers"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register('youtubeFollowers', { valueAsNumber: true })}
                  disabled={saveInfluencerMutation.isPending}
                />
              </div>
            </div>

            {/* TikTok */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-gray-50">
              <div className="space-y-2">
                <Label htmlFor="tiktokHandle">TikTok Handle</Label>
                <Input
                  id="tiktokHandle"
                  placeholder="@username"
                  {...register('tiktokHandle')}
                  disabled={saveInfluencerMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiktokFollowers">Followers</Label>
                <Input
                  id="tiktokFollowers"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register('tiktokFollowers', { valueAsNumber: true })}
                  disabled={saveInfluencerMutation.isPending}
                />
              </div>
            </div>

            {/* Twitter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-gray-50">
              <div className="space-y-2">
                <Label htmlFor="twitterHandle">Twitter Handle</Label>
                <Input
                  id="twitterHandle"
                  placeholder="@username"
                  {...register('twitterHandle')}
                  disabled={saveInfluencerMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitterFollowers">Followers</Label>
                <Input
                  id="twitterFollowers"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register('twitterFollowers', { valueAsNumber: true })}
                  disabled={saveInfluencerMutation.isPending}
                />
              </div>
            </div>

            {/* Facebook */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-gray-50">
              <div className="space-y-2">
                <Label htmlFor="facebookHandle">Facebook Page</Label>
                <Input
                  id="facebookHandle"
                  placeholder="page-name"
                  {...register('facebookHandle')}
                  disabled={saveInfluencerMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebookFollowers">Followers</Label>
                <Input
                  id="facebookFollowers"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register('facebookFollowers', { valueAsNumber: true })}
                  disabled={saveInfluencerMutation.isPending}
                />
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Metrics</h3>
            
            {/* Quality Score */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="qualityScore">Quality Score</Label>
                <span className="text-sm font-medium text-purple-600">{qualityScore}</span>
              </div>
              <Input
                id="qualityScore"
                type="range"
                min="0"
                max="100"
                step="1"
                {...register('qualityScore', { valueAsNumber: true })}
                disabled={saveInfluencerMutation.isPending}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            {/* Availability Status */}
            <div className="space-y-2">
              <Label htmlFor="availabilityStatus">
                Availability Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={availabilityStatus}
                onValueChange={(value) =>
                  setValue('availabilityStatus', value as InfluencerFormData['availabilityStatus'], {
                    shouldValidate: true,
                  })
                }
                disabled={saveInfluencerMutation.isPending}
              >
                <SelectTrigger id="availabilityStatus">
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_STATUS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.availabilityStatus && (
                <p className="text-sm text-red-500">{errors.availabilityStatus.message}</p>
              )}
            </div>
          </div>

          {/* Form Footer */}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogChange(false)}
              disabled={saveInfluencerMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={saveInfluencerMutation.isPending}
            >
              {saveInfluencerMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditMode ? 'Update Influencer' : 'Create Influencer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Export a default trigger button component
export function CreateInfluencerButton() {
  return (
    <InfluencerFormModal>
      <Button className="bg-purple-600 hover:bg-purple-700">
        <Plus className="h-4 w-4 mr-2" />
        Add Influencer
      </Button>
    </InfluencerFormModal>
  );
}
