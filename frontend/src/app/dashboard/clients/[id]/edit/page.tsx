'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ClientForm from '@/components/clients/ClientForm';
import { clientService } from '@/services/client.service';
import type { UpdateClientRequest } from '@/types/client.types';

export default function EditClientPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientService.getById(clientId),
    enabled: !!clientId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateClientRequest) => clientService.update(clientId, data),
  });

  const handleSubmit = async (data: UpdateClientRequest) => {
    setIsSubmitting(true);
    try {
      await updateMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading client...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data?.data) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error loading client</h3>
            <p className="text-red-600">
              {error instanceof Error ? error.message : 'Failed to load client data'}
            </p>
            <Link 
              href="/dashboard/clients"
              className="inline-flex items-center text-sm text-red-600 hover:text-red-800 mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const client = data.data;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/dashboard/clients"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Client</h1>
          <p className="mt-1 text-gray-600">
            Update information for {client.brandName || client.companyLegalName}
          </p>
        </div>

        {/* Form */}
        <ClientForm 
          client={client} 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting}
        />
      </div>
    </DashboardLayout>
  );
}
