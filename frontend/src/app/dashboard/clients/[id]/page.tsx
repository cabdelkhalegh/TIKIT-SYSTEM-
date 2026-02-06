'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Building2, Mail, Phone, Globe, Calendar, TrendingUp, ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import { clientService } from '@/services/client.service';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientService.getById(clientId),
    enabled: !!clientId,
  });

  const client = data?.data;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !client) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Failed to load client details.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/clients" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Clients
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {client.brandName || client.companyLegalName}
                </h1>
                {client.brandName !== client.companyLegalName && (
                  <p className="text-gray-600 mt-1">{client.companyLegalName}</p>
                )}
              </div>
            </div>
            <Link href={`/dashboard/clients/${clientId}/edit`}>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Edit className="h-4 w-4 mr-2" />
                Edit Client
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Campaigns</span>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {client._count?.campaigns || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Spend</span>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(client.spendTotals || 0)}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Client Since</span>
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatDate(client.createdAt)}
              </p>
            </div>
          </Card>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Company Information */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
              <div className="space-y-3">
                {client.industry && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Industry</span>
                    <span className="font-medium text-gray-900">{client.industry}</span>
                  </div>
                )}
                {client.websiteUrl && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Website</span>
                    <a
                      href={client.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-purple-600 hover:text-purple-700"
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      Visit Website
                    </a>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span className="font-medium text-gray-900">{formatDate(client.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="font-medium text-gray-900">{formatDate(client.updatedAt)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Primary Contacts */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Primary Contacts</h2>
              {client.primaryContacts && client.primaryContacts.length > 0 ? (
                <div className="space-y-4">
                  {client.primaryContacts.map((contact, index) => (
                    <div key={index} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      {contact.role && (
                        <p className="text-sm text-gray-600">{contact.role}</p>
                      )}
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="flex items-center text-sm text-purple-600 hover:text-purple-700 mt-1">
                          <Mail className="h-3 w-3 mr-1" />
                          {contact.email}
                        </a>
                      )}
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="flex items-center text-sm text-gray-600 hover:text-gray-700 mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          {contact.phone}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No contacts added</p>
              )}
            </div>
          </Card>
        </div>

        {/* Campaigns */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Campaigns</h2>
              <Link href={`/dashboard/campaigns/new?clientId=${clientId}`}>
                <Button variant="outline" size="sm">
                  New Campaign
                </Button>
              </Link>
            </div>
            {client.campaigns && client.campaigns.length > 0 ? (
              <div className="space-y-3">
                {client.campaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    href={`/dashboard/campaigns/${campaign.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{campaign.title}</h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {campaign.status}
                          </span>
                          {campaign.budget && (
                            <span className="text-sm text-gray-600">
                              Budget: {formatCurrency(campaign.budget)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No campaigns yet</p>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
