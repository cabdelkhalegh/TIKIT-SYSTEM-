'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CampaignForm from '@/components/campaigns/CampaignForm';
import { campaignService } from '@/services/campaign.service';
import { clientService } from '@/services/client.service';
import type { UpdateCampaignRequest, Campaign } from '@/types/campaign.types';

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const { data: campaignData, isLoading: campaignLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignService.getById(campaignId),
    enabled: !!campaignId,
  });

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getAll({ perPage: 100 }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateCampaignRequest) =>
      campaignService.update(campaignId, data),
    onSuccess: () => {
      toast.success('Campaign updated successfully');
      router.push(`/dashboard/campaigns/${campaignId}`);
    },
    onError: (error: unknown) => {
      let message = 'Failed to update campaign';

      if (error instanceof Error && error.message) {
        message = error.message;
      } else if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
      ) {
        message = (error as { response?: { data?: { message?: string } } }).response!.data!.message as string;
      }

      toast.error(message);
    },
  });

  const handleSubmit = async (data: UpdateCampaignRequest) => {
    await updateMutation.mutateAsync(data);
  };

  if (campaignLoading || clientsLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!campaignData?.data) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Campaign not found</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Parse JSON fields if needed
  const parseJsonField = <T,>(field: string | T | undefined, fallback: T): T => {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to parse JSON field:', field, error);
        }
        return fallback;
      }
    }
    return field ?? fallback;
  };

  const campaign: Campaign = {
    ...campaignData.data,
    campaignObjectives: parseJsonField<string[]>(
      campaignData.data.campaignObjectives as any,
      []
    ),
    targetAudience: parseJsonField(
      campaignData.data.targetAudienceJson,
      undefined
    ),
    targetPlatforms: parseJsonField<string[]>(
      campaignData.data.targetPlatforms as any,
      []
    ),
    performanceKPIs: parseJsonField(
      campaignData.data.performanceKPIsJson,
      undefined
    ),
  };

  const clients = (clientsData?.data || []).map((client) => ({
    clientId: client.clientId,
    brandDisplayName: client.brandDisplayName,
    legalCompanyName: client.legalCompanyName,
  }));

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Edit Campaign</h1>
          </div>
          <p className="text-gray-600 ml-7">
            Update your campaign details and settings
          </p>
        </div>

        <CampaignForm
          campaign={campaign}
          clients={clients}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
