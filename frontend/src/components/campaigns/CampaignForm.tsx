'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ChevronRight,
  ChevronLeft,
  Target,
  Users,
  DollarSign,
  CheckCircle,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import type {
  Campaign,
  CreateCampaignRequest,
  UpdateCampaignRequest,
} from '@/types/campaign.types';

// Form validation schema
const campaignFormSchema = z.object({
  campaignName: z.string().min(1, 'Campaign name is required'),
  campaignDescription: z.string().optional(),
  clientId: z.string().min(1, 'Client is required'),
  campaignObjectives: z.array(z.string()).min(1, 'At least one objective is required'),
  targetAudience: z.object({
    demographics: z.object({
      ageRange: z.string().optional(),
      gender: z.string().optional(),
      locations: z.array(z.string()),
    }),
    interests: z.array(z.string()),
    behaviors: z.array(z.string()),
  }),
  targetPlatforms: z.array(z.string()).min(1, 'At least one platform is required'),
  totalBudget: z.number().min(0, 'Budget must be positive').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  performanceKPIs: z.record(z.number()).optional(),
});

type CampaignFormData = z.infer<typeof campaignFormSchema>;

interface CampaignFormProps {
  campaign?: Campaign;
  clients: Array<{ clientId: string; brandName: string; companyLegalName: string }>;
  onSubmit: (data: CreateCampaignRequest | UpdateCampaignRequest) => Promise<void>;
  isSubmitting?: boolean;
}

const STEPS = [
  { id: 1, title: 'Basic Info', icon: Target },
  { id: 2, title: 'Strategy', icon: Users },
  { id: 3, title: 'Budget & Timeline', icon: DollarSign },
  { id: 4, title: 'Review', icon: CheckCircle },
];

const PLATFORM_OPTIONS = ['Instagram', 'TikTok', 'YouTube', 'Twitter', 'Facebook', 'LinkedIn'];

export default function CampaignForm({
  campaign,
  clients,
  onSubmit,
  isSubmitting = false,
}: CampaignFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      campaignName: '',
      campaignDescription: '',
      clientId: '',
      campaignObjectives: [''],
      targetAudience: {
        demographics: {
          ageRange: '',
          gender: '',
          locations: [],
        },
        interests: [],
        behaviors: [],
      },
      targetPlatforms: [],
      totalBudget: 0,
      startDate: '',
      endDate: '',
      performanceKPIs: {},
    },
  });

  // Note: Using 'as any' for useFieldArray with nested paths is a known limitation in react-hook-form v7
  // This is the recommended workaround: https://github.com/react-hook-form/react-hook-form/issues/4055
  const {
    fields: objectiveFields,
    append: appendObjective,
    remove: removeObjective,
  } = useFieldArray({
    control,
    name: 'campaignObjectives',
  } as any);

  const {
    fields: interestFields,
    append: appendInterest,
    remove: removeInterest,
  } = useFieldArray({
    control,
    name: 'targetAudience.interests',
  } as any);

  const {
    fields: locationFields,
    append: appendLocation,
    remove: removeLocation,
  } = useFieldArray({
    control,
    name: 'targetAudience.demographics.locations',
  } as any);

  const selectedPlatforms = watch('targetPlatforms') || [];

  useEffect(() => {
    if (campaign) {
      reset({
        campaignName: campaign.campaignName,
        campaignDescription: campaign.campaignDescription || '',
        clientId: campaign.clientId,
        campaignObjectives: campaign.campaignObjectives || [''],
        targetAudience: campaign.targetAudience || {
          demographics: { ageRange: '', gender: '', locations: [] },
          interests: [],
          behaviors: [],
        },
        targetPlatforms: campaign.targetPlatforms || [],
        totalBudget: campaign.totalBudget || 0,
        startDate: campaign.startDate ? campaign.startDate.split('T')[0] : '',
        endDate: campaign.endDate ? campaign.endDate.split('T')[0] : '',
        performanceKPIs: campaign.performanceKPIs || {},
      });
    }
  }, [campaign, reset]);

  const handleFormSubmit = async (data: CampaignFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const togglePlatform = (platform: string) => {
    const platforms = selectedPlatforms.includes(platform)
      ? selectedPlatforms.filter((p) => p !== platform)
      : [...selectedPlatforms, platform];
    setValue('targetPlatforms', platforms);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Progress Indicator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep === step.id
                      ? 'bg-purple-600 text-white'
                      : currentStep > step.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    currentStep === step.id ? 'text-purple-600' : 'text-gray-600'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${
                    currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {currentStep === 1 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaignName">Campaign Name *</Label>
              <Input
                id="campaignName"
                {...register('campaignName')}
                placeholder="Summer Product Launch 2024"
              />
              {errors.campaignName && (
                <p className="mt-1 text-sm text-red-600">{errors.campaignName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="campaignDescription">Description</Label>
              <textarea
                id="campaignDescription"
                {...register('campaignDescription')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="Describe the campaign goals and vision..."
              />
            </div>

            <div>
              <Label htmlFor="clientId">Client *</Label>
              <select
                id="clientId"
                {...register('clientId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.clientId} value={client.clientId}>
                    {client.brandName || client.companyLegalName}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="mt-1 text-sm text-red-600">{errors.clientId.message}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Strategy */}
      {currentStep === 2 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Campaign Strategy</h2>
          <div className="space-y-6">
            {/* Objectives */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Campaign Objectives *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendObjective('')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Objective
                </Button>
              </div>
              <div className="space-y-2">
                {objectiveFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      {...register(`campaignObjectives.${index}`)}
                      placeholder="e.g., Increase brand awareness by 50%"
                    />
                    {objectiveFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeObjective(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {errors.campaignObjectives && (
                <p className="mt-1 text-sm text-red-600">{errors.campaignObjectives.message}</p>
              )}
            </div>

            {/* Target Platforms */}
            <div>
              <Label>Target Platforms *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {PLATFORM_OPTIONS.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      selectedPlatforms.includes(platform)
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {platform}
                  </button>
                ))}
              </div>
              {errors.targetPlatforms && (
                <p className="mt-1 text-sm text-red-600">{errors.targetPlatforms.message}</p>
              )}
            </div>

            {/* Target Audience */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Target Audience</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ageRange">Age Range</Label>
                    <Input
                      id="ageRange"
                      {...register('targetAudience.demographics.ageRange')}
                      placeholder="e.g., 18-34"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      {...register('targetAudience.demographics.gender')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="">All</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Locations</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendLocation('')}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Location
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {locationFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <Input
                          {...register(
                            `targetAudience.demographics.locations.${index}`
                          )}
                          placeholder="e.g., United States, United Kingdom"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeLocation(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Interests</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendInterest('')}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Interest
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {interestFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <Input
                          {...register(`targetAudience.interests.${index}`)}
                          placeholder="e.g., Fashion, Technology, Sports"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeInterest(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Budget & Timeline */}
      {currentStep === 3 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Budget & Timeline</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="totalBudget">Total Budget (USD)</Label>
              <Input
                id="totalBudget"
                type="number"
                step="0.01"
                {...register('totalBudget', { valueAsNumber: true })}
                placeholder="50000"
              />
              {errors.totalBudget && (
                <p className="mt-1 text-sm text-red-600">{errors.totalBudget.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" {...register('startDate')} />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" {...register('endDate')} />
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Key Performance Indicators</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="kpi-impressions">Target Impressions</Label>
                    <Input
                      id="kpi-impressions"
                      type="number"
                      placeholder="1000000"
                      onChange={(e) =>
                        setValue('performanceKPIs.impressions', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="kpi-engagement">Target Engagement Rate (%)</Label>
                    <Input
                      id="kpi-engagement"
                      type="number"
                      step="0.1"
                      placeholder="5.5"
                      onChange={(e) =>
                        setValue('performanceKPIs.engagementRate', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="kpi-conversions">Target Conversions</Label>
                    <Input
                      id="kpi-conversions"
                      type="number"
                      placeholder="5000"
                      onChange={(e) =>
                        setValue('performanceKPIs.conversions', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="kpi-roi">Target ROI (%)</Label>
                    <Input
                      id="kpi-roi"
                      type="number"
                      step="0.1"
                      placeholder="250"
                      onChange={(e) =>
                        setValue('performanceKPIs.roi', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Review */}
      {currentStep === 4 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Review & Submit</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Basic Information</h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Campaign Name:</dt>
                  <dd className="font-medium text-gray-900">{watch('campaignName')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Client:</dt>
                  <dd className="font-medium text-gray-900">
                    {clients.find((c) => c.clientId === watch('clientId'))?.brandName}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium text-gray-900 mb-2">Strategy</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-gray-600 mb-1">Objectives:</dt>
                  <dd>
                    <ul className="list-disc list-inside space-y-1">
                      {watch('campaignObjectives')?.map((obj, idx) => (
                        <li key={idx} className="text-gray-900">{obj}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-600 mb-1">Platforms:</dt>
                  <dd className="flex flex-wrap gap-2">
                    {watch('targetPlatforms')?.map((platform) => (
                      <span
                        key={platform}
                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm"
                      >
                        {platform}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium text-gray-900 mb-2">Budget & Timeline</h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Total Budget:</dt>
                  <dd className="font-medium text-gray-900">
                    ${watch('totalBudget')?.toLocaleString()}
                  </dd>
                </div>
                {watch('startDate') && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Start Date:</dt>
                    <dd className="font-medium text-gray-900">{watch('startDate')}</dd>
                  </div>
                )}
                {watch('endDate') && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">End Date:</dt>
                    <dd className="font-medium text-gray-900">{watch('endDate')}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>

          {currentStep < STEPS.length ? (
            <Button type="button" onClick={nextStep} className="bg-purple-600 hover:bg-purple-700">
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {campaign ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{campaign ? 'Update Campaign' : 'Create Campaign'}</>
              )}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
