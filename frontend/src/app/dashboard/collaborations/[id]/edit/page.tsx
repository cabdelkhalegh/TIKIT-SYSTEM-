'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { collaborationService } from '@/services/collaboration.service';
import { campaignService } from '@/services/campaign.service';
import { influencerService } from '@/services/influencer.service';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CollaborationForm from '@/components/collaborations/CollaborationForm';
import { toast } from 'sonner';
import type { UpdateCollaborationRequest } from '@/types/collaboration.types';

export default function EditCollaborationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['collaboration', id],
    queryFn: () => collaborationService.getById(id),
    enabled: !!id,
  });

  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignService.getAll({ perPage: 100 }),
  });

  const { data: influencersData } = useQuery({
    queryKey: ['influencers'],
    queryFn: () => influencerService.getAll({ perPage: 100 }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateCollaborationRequest) => collaborationService.update(id, data),
    onSuccess: () => {
      toast.success('Collaboration updated successfully');
      router.push(`/dashboard/collaborations/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update collaboration');
    },
  });

  const collaboration = data?.data;
  const campaigns = campaignsData?.data || [];
  const influencers = influencersData?.data || [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading collaboration...</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !collaboration) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card className="p-8 text-center">
            <p className="text-red-600">Error loading collaboration</p>
            <Button onClick={() => router.back()} className="mt-4" variant="outline">
              Go Back
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

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
            <Link href={`/dashboard/collaborations/${id}`} className="hover:text-gray-900">
              {collaboration.campaign?.campaignName}
            </Link>
            <span>/</span>
            <span className="text-gray-900">Edit</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Collaboration</h1>
          <p className="mt-1 text-gray-600">Update collaboration details</p>
        </div>

        {/* Form */}
        <CollaborationForm
          collaboration={collaboration}
          campaigns={campaigns}
          influencers={influencers}
          onSubmit={async (data) => {
            await updateMutation.mutateAsync(data as UpdateCollaborationRequest);
          }}
          isSubmitting={updateMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
