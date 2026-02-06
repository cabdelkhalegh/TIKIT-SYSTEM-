'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

// Platform options
const PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'twitter', label: 'Twitter' },
  { id: 'facebook', label: 'Facebook' },
] as const;

// Campaign type options
const CAMPAIGN_TYPES = [
  { value: 'awareness', label: 'Awareness' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'conversion', label: 'Conversion' },
  { value: 'mixed', label: 'Mixed' },
] as const;

// Form validation schema
const campaignFormSchema = z.object({
  campaignName: z
    .string()
    .min(3, 'Campaign name must be at least 3 characters')
    .max(100, 'Campaign name must not exceed 100 characters'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  totalBudget: z
    .number({ invalid_type_error: 'Budget must be a number' })
    .min(0, 'Budget must be at least 0'),
  targetAudience: z.string().optional(),
  platforms: z.array(z.string()).min(1, 'Select at least one platform'),
  campaignType: z.enum(['awareness', 'engagement', 'conversion', 'mixed'], {
    required_error: 'Please select a campaign type',
  }),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

type CampaignFormData = z.infer<typeof campaignFormSchema>;

interface CampaignFormModalProps {
  children?: React.ReactNode;
}

export function CampaignFormModal({ children }: CampaignFormModalProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      platforms: [],
      totalBudget: 0,
    },
  });

  const selectedPlatforms = watch('platforms') || [];
  const campaignType = watch('campaignType');

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const response = await apiClient.post('/campaigns', {
        campaignName: data.campaignName,
        description: data.description || '',
        startDate: data.startDate,
        endDate: data.endDate,
        totalBudget: data.totalBudget,
        targetAudience: data.targetAudience ? { description: data.targetAudience } : undefined,
        platforms: data.platforms,
        campaignType: data.campaignType,
        status: 'draft',
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Campaign created successfully!');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setOpen(false);
      reset();
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to create campaign. Please try again.';
      toast.error(errorMessage);
    },
  });

  const onSubmit = (data: CampaignFormData) => {
    createCampaignMutation.mutate(data);
  };

  const handlePlatformToggle = (platformId: string) => {
    const currentPlatforms = selectedPlatforms;
    const newPlatforms = currentPlatforms.includes(platformId)
      ? currentPlatforms.filter((p) => p !== platformId)
      : [...currentPlatforms, platformId];
    setValue('platforms', newPlatforms, { shouldValidate: true });
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
            Create Campaign
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Set up a new influencer marketing campaign. Fill in the details below to get started.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="campaignName">
              Campaign Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="campaignName"
              placeholder="e.g., Summer Product Launch 2024"
              {...register('campaignName')}
              disabled={createCampaignMutation.isPending}
            />
            {errors.campaignName && (
              <p className="text-sm text-red-500">{errors.campaignName.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your campaign goals and key messages..."
              rows={3}
              {...register('description')}
              disabled={createCampaignMutation.isPending}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
                disabled={createCampaignMutation.isPending}
              />
              {errors.startDate && (
                <p className="text-sm text-red-500">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                End Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
                disabled={createCampaignMutation.isPending}
              />
              {errors.endDate && (
                <p className="text-sm text-red-500">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Total Budget */}
          <div className="space-y-2">
            <Label htmlFor="totalBudget">
              Total Budget ($) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="totalBudget"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('totalBudget', { valueAsNumber: true })}
              disabled={createCampaignMutation.isPending}
            />
            {errors.totalBudget && (
              <p className="text-sm text-red-500">{errors.totalBudget.message}</p>
            )}
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target Audience Description</Label>
            <Textarea
              id="targetAudience"
              placeholder="e.g., Women aged 25-35 interested in fitness and wellness..."
              rows={3}
              {...register('targetAudience')}
              disabled={createCampaignMutation.isPending}
            />
            {errors.targetAudience && (
              <p className="text-sm text-red-500">{errors.targetAudience.message}</p>
            )}
          </div>

          {/* Platforms */}
          <div className="space-y-2">
            <Label>
              Platforms <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-md">
              {PLATFORMS.map((platform) => (
                <div key={platform.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform.id}
                    checked={selectedPlatforms.includes(platform.id)}
                    onCheckedChange={() => handlePlatformToggle(platform.id)}
                    disabled={createCampaignMutation.isPending}
                  />
                  <Label
                    htmlFor={platform.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {platform.label}
                  </Label>
                </div>
              ))}
            </div>
            {errors.platforms && (
              <p className="text-sm text-red-500">{errors.platforms.message}</p>
            )}
          </div>

          {/* Campaign Type */}
          <div className="space-y-2">
            <Label htmlFor="campaignType">
              Campaign Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={campaignType}
              onValueChange={(value) =>
                setValue('campaignType', value as CampaignFormData['campaignType'], {
                  shouldValidate: true,
                })
              }
              disabled={createCampaignMutation.isPending}
            >
              <SelectTrigger id="campaignType">
                <SelectValue placeholder="Select a campaign type" />
              </SelectTrigger>
              <SelectContent>
                {CAMPAIGN_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.campaignType && (
              <p className="text-sm text-red-500">{errors.campaignType.message}</p>
            )}
          </div>

          {/* Form Footer */}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogChange(false)}
              disabled={createCampaignMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={createCampaignMutation.isPending}
            >
              {createCampaignMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Campaign'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Export a default trigger button component
export function CreateCampaignButton() {
  return (
    <CampaignFormModal>
      <Button className="bg-purple-600 hover:bg-purple-700">
        <Plus className="h-4 w-4 mr-2" />
        Create Campaign
      </Button>
    </CampaignFormModal>
  );
}
