'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { influencerService } from '@/services/influencer.service';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import InfluencerForm from '@/components/influencers/InfluencerForm';
import { Alert } from '@/components/ui/alert';

export default function NewInfluencerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: influencerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencers'] });
      router.push('/dashboard/influencers');
    },
  });

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/influencers" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Influencers
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Influencer</h1>
          <p className="mt-1 text-gray-600">Create a new influencer profile</p>
        </div>

        {/* Error Alert */}
        {createMutation.isError && (
          <Alert variant="destructive" className="mb-6">
            Failed to create influencer. Please try again.
          </Alert>
        )}

        {/* Form */}
        <InfluencerForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => router.push('/dashboard/influencers')}
          isLoading={createMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
