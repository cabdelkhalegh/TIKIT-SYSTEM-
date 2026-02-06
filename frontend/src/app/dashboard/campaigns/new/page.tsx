'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CampaignForm from '@/components/campaigns/CampaignForm';
import { campaignService } from '@/services/campaign.service';
import { clientService } from '@/services/client.service';
import type { CreateCampaignRequest, UpdateCampaignRequest } from '@/types/campaign.types';

export default function NewCampaignPage() {
  const router = useRouter();

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getAll({ perPage: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCampaignRequest) => campaignService.create(data),
    onSuccess: (response) => {
      toast.success('Campaign created successfully');
      router.push(`/dashboard/campaigns/${response.data.campaignId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create campaign');
    },
  });

  const handleSubmit = async (data: CreateCampaignRequest | UpdateCampaignRequest) => {
    await createMutation.mutateAsync(data as CreateCampaignRequest);
  };

  if (clientsLoading) {
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
            <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
          </div>
          <p className="text-gray-600 ml-7">
            Set up your influencer marketing campaign with objectives and targeting
          </p>
        </div>

        <CampaignForm
          clients={clients}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
