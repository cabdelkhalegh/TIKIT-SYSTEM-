'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Users, DollarSign, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { collaborationService } from '@/services/collaboration.service';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import CollaborationStatusBadge from '@/components/collaborations/CollaborationStatusBadge';
import PaymentStatusBadge from '@/components/collaborations/PaymentStatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Collaboration, CollaborationStatus } from '@/types/collaboration.types';

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'invited', label: 'Invited' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'declined', label: 'Declined' },
];

export default function CollaborationsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['collaborations', { page, status: statusFilter }],
    queryFn: () =>
      collaborationService.getAll({
        page,
        perPage: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
    staleTime: 30000,
  });

  const collaborations = data?.data || [];
  const filteredCollaborations = collaborations.filter((collab) => {
    const searchLower = search.toLowerCase();
    const campaignName = (collab.campaign?.campaignName || '').toLowerCase();
    const influencerName = (collab.influencer?.profileName || collab.influencer?.fullName || '').toLowerCase();
    const role = (collab.role || '').toLowerCase();
    return (
      campaignName.includes(searchLower) ||
      influencerName.includes(searchLower) ||
      role.includes(searchLower)
    );
  });

  const stats = {
    total: collaborations.length,
    active: collaborations.filter((c) => c.status === 'active').length,
    completed: collaborations.filter((c) => c.status === 'completed').length,
    totalValue: collaborations.reduce((sum, c) => sum + (c.agreedAmount || 0), 0),
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Collaborations</h1>
            <p className="mt-1 text-gray-600">Manage influencer collaborations</p>
          </div>
          <Link href="/dashboard/collaborations/new">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              New Collaboration
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total</div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Active</div>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Completed</div>
                <div className="text-2xl font-bold text-purple-600">{stats.completed}</div>
              </div>
              <Users className="h-8 w-8 text-purple-400" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Value</div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</div>
              </div>
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search collaborations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === filter.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Collaborations Table */}
        {isLoading ? (
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading collaborations...</p>
          </Card>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-red-600">Error loading collaborations</p>
          </Card>
        ) : filteredCollaborations.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Collaborations Found</h3>
            <p className="text-gray-600 mb-4">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first collaboration'}
            </p>
            {!search && statusFilter === 'all' && (
              <Link href="/dashboard/collaborations/new">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Collaboration
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Influencer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invited
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCollaborations.map((collaboration) => (
                    <tr key={collaboration.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {collaboration.campaign?.campaignName || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-purple-700">
                              {(collaboration.influencer?.profileName?.charAt(0) || collaboration.influencer?.fullName?.charAt(0) || '?').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {collaboration.influencer?.profileName}
                            </div>
                            {collaboration.influencer?.fullName && (
                              <div className="text-xs text-gray-500">
                                {collaboration.influencer.fullName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{collaboration.role || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <CollaborationStatusBadge status={collaboration.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PaymentStatusBadge status={collaboration.paymentStatus} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(collaboration.agreedAmount || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatDate(collaboration.invitedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/dashboard/collaborations/${collaboration.id}`}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <Button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              variant="outline"
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {page} of {data.pagination.totalPages}
            </span>
            <Button
              onClick={() => setPage(page + 1)}
              disabled={page === data.pagination.totalPages}
              variant="outline"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
