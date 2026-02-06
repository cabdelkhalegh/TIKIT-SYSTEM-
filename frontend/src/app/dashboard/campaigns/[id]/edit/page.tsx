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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update campaign');
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
  const campaign: Campaign = {
    ...campaignData.data,
    campaignObjectives: Array.isArray(campaignData.data.campaignObjectives)
      ? campaignData.data.campaignObjectives
      : campaignData.data.campaignObjectives
      ? JSON.parse(campaignData.data.campaignObjectives as any)
      : [],
    targetAudience:
      typeof campaignData.data.targetAudienceJson === 'string'
        ? JSON.parse(campaignData.data.targetAudienceJson)
        : campaignData.data.targetAudience,
    targetPlatforms: Array.isArray(campaignData.data.targetPlatforms)
      ? campaignData.data.targetPlatforms
      : campaignData.data.targetPlatformsJson
      ? JSON.parse(campaignData.data.targetPlatformsJson as any)
      : [],
    performanceKPIs:
      typeof campaignData.data.performanceKPIsJson === 'string'
        ? JSON.parse(campaignData.data.performanceKPIsJson)
        : campaignData.data.performanceKPIs,
  };

  const clients = (clientsData?.data || []).map((client) => ({
    clientId: client.id,
    brandName: client.brandName,
    companyLegalName: client.companyLegalName,
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
