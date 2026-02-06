'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { collaborationService } from '@/services/collaboration.service';
import { campaignService } from '@/services/campaign.service';
import { influencerService } from '@/services/influencer.service';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import CollaborationForm from '@/components/collaborations/CollaborationForm';
import { toast } from 'sonner';
import type { CreateCollaborationRequest } from '@/types/collaboration.types';

export default function NewCollaborationPage() {
  const router = useRouter();

  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignService.getAll({ perPage: 100 }),
  });

  const { data: influencersData } = useQuery({
    queryKey: ['influencers'],
    queryFn: () => influencerService.getAll({ perPage: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCollaborationRequest) => collaborationService.create(data),
    onSuccess: (response) => {
      toast.success('Collaboration created successfully');
      router.push(`/dashboard/collaborations/${response.data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create collaboration');
    },
  });

  const campaigns = campaignsData?.data || [];
  const influencers = influencersData?.data || [];

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Link href="/dashboard/collaborations" className="hover:text-gray-900">
              Collaborations
            </Link>
            <span>/</span>
            <span className="text-gray-900">New</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create Collaboration</h1>
          <p className="mt-1 text-gray-600">Invite an influencer to collaborate on a campaign</p>
        </div>

        {/* Form */}
        <CollaborationForm
          campaigns={campaigns}
          influencers={influencers}
          onSubmit={async (data) => {
            await createMutation.mutateAsync(data as CreateCollaborationRequest);
          }}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
