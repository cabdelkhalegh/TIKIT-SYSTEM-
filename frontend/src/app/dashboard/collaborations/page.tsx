'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Handshake, CheckCircle2, Clock, AlertCircle, User, Target } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CreateCollaborationButton } from '@/components/collaborations';

interface Collaboration {
  collaborationId: string;
  campaignId: string;
  influencerId: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  agreedCompensation: number;
  deliverables: {
    deliverableId: string;
    type: string;
    description: string;
    dueDate: string;
    status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  }[];
  campaign?: {
    campaignName: string;
  };
  influencer?: {
    fullName: string;
  };
}

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  accepted: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle2 },
  in_progress: { color: 'bg-purple-100 text-purple-800', icon: Clock },
  completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

const deliverableStatusConfig = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  submitted: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function CollaborationsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: collaborations, isLoading, error } = useQuery({
    queryKey: ['collaborations'],
    queryFn: async () => {
      const response = await apiClient.get('/collaborations');
      return response.data.data as Collaboration[];
    },
  });

  const filteredCollaborations = collaborations?.filter((collab) => {
    const campaignName = collab.campaign?.campaignName || '';
    const influencerName = collab.influencer?.fullName || '';
    const matchesSearch = 
      campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      influencerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || collab.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getCompletedDeliverables = (deliverables: Collaboration['deliverables']) => {
    // Count approved deliverables as completed
    return deliverables.filter(d => d.status === 'approved').length;
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Collaborations</h1>
              <p className="mt-2 text-gray-600">
                Manage influencer collaborations and track deliverables
              </p>
            </div>
            <CreateCollaborationButton />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by campaign or influencer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('pending')}
              size="sm"
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('in_progress')}
              size="sm"
            >
              In Progress
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('completed')}
              size="sm"
            >
              Completed
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800">
                Failed to load collaborations. Please try again later.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Collaborations List */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {filteredCollaborations && filteredCollaborations.length > 0 ? (
              filteredCollaborations.map((collab) => {
                const StatusIcon = statusConfig[collab.status]?.icon || Clock;
                return (
                  <Card
                    key={collab.collaborationId}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/dashboard/collaborations/${collab.collaborationId}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-xl">
                              {collab.campaign?.campaignName || 'Campaign'}
                            </CardTitle>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                statusConfig[collab.status]?.color || 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {collab.status.replace('_', ' ').charAt(0).toUpperCase() + 
                               collab.status.replace('_', ' ').slice(1)}
                            </span>
                          </div>
                          <CardDescription className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {collab.influencer?.fullName || 'Influencer'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              {formatCurrency(collab.agreedCompensation)}
                            </span>
                          </CardDescription>
                        </div>
                        <Handshake className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Deliverables */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-900">Deliverables</h4>
                          <span className="text-xs text-gray-600">
                            {getCompletedDeliverables(collab.deliverables)} of {collab.deliverables.length} completed
                          </span>
                        </div>
                        
                        {collab.deliverables.length > 0 ? (
                          <div className="space-y-2">
                            {collab.deliverables.map((deliverable) => (
                              <div
                                key={deliverable.deliverableId}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {deliverable.type} - {deliverable.description}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    Due: {formatDate(deliverable.dueDate)}
                                  </p>
                                </div>
                                <span
                                  className={`ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    deliverableStatusConfig[deliverable.status] || 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {deliverable.status.replace('_', ' ').charAt(0).toUpperCase() + 
                                   deliverable.status.replace('_', ' ').slice(1)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No deliverables yet
                          </p>
                        )}

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>
                              {collab.deliverables.length > 0
                                ? Math.round((getCompletedDeliverables(collab.deliverables) / collab.deliverables.length) * 100)
                                : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${
                                  collab.deliverables.length > 0
                                    ? (getCompletedDeliverables(collab.deliverables) / collab.deliverables.length) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          View Details
                        </Button>
                        <Button variant="default" size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">
                          Manage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Handshake className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No collaborations found
                  </h3>
                  <p className="text-gray-600 mb-4 text-center">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Start collaborating with influencers on your campaigns'}
                  </p>
                  <CreateCollaborationButton />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
