'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { influencerService } from '@/services/influencer.service';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import InfluencerForm from '@/components/influencers/InfluencerForm';
import { Alert } from '@/components/ui/alert';

export default function EditInfluencerPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['influencer', id],
    queryFn: () => influencerService.getById(id),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (formData: any) => influencerService.update(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencer', id] });
      queryClient.invalidateQueries({ queryKey: ['influencers'] });
      router.push(`/dashboard/influencers/${id}`);
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-96 bg-gray-200 rounded" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data?.data) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Failed to load influencer details.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/dashboard/influencers/${id}`} className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Influencer
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Influencer</h1>
          <p className="mt-1 text-gray-600">Update influencer profile information</p>
        </div>

        {/* Error Alert */}
        {updateMutation.isError && (
          <Alert variant="destructive" className="mb-6">
            Failed to update influencer. Please try again.
          </Alert>
        )}

        {/* Form */}
        <InfluencerForm
          influencer={data.data}
          onSubmit={(formData) => updateMutation.mutate(formData)}
          onCancel={() => router.push(`/dashboard/influencers/${id}`)}
          isLoading={updateMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
