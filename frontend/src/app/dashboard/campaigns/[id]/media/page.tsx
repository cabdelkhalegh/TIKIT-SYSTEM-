'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import FileUpload from '@/components/media/FileUpload';
import MediaGallery from '@/components/media/MediaGallery';
import { mediaService } from '@/services/media.service';
import { campaignService } from '@/services/campaign.service';
import { toast } from 'sonner';
import { ArrowLeft, Upload as UploadIcon } from 'lucide-react';
import Link from 'next/link';

export default function CampaignMediaPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const queryClient = useQueryClient();

  // Fetch campaign
  const { data: campaign } = useQuery({
    queryKey: ['campaigns', campaignId],
    queryFn: () => campaignService.getById(campaignId),
  });

  // Fetch media files
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['media', 'campaign', campaignId],
    queryFn: () => mediaService.getByCampaign(campaignId),
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const uploads = files.map((file) =>
        mediaService.upload(file, 'campaign', campaignId)
      );
      return Promise.all(uploads);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', 'campaign', campaignId] });
      toast.success('Files uploaded successfully');
    },
    onError: () => {
      toast.error('Failed to upload files');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => mediaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', 'campaign', campaignId] });
      toast.success('File deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete file');
    },
  });

  const handleUpload = async (files: File[]) => {
    await uploadMutation.mutateAsync(files);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/dashboard/campaigns/${campaignId}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaign
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Campaign Media</h1>
          <p className="text-gray-600 mt-2">
            {campaign?.data?.campaignName || 'Loading...'}
          </p>
        </div>

        {/* Upload Section */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <UploadIcon className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Upload Files</h2>
          </div>
          <FileUpload onUpload={handleUpload} />
        </Card>

        {/* Gallery Section */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            All Files ({files.length})
          </h2>
          <MediaGallery files={files} onDelete={handleDelete} isLoading={isLoading} />
        </Card>
      </div>
    </DashboardLayout>
  );
}
