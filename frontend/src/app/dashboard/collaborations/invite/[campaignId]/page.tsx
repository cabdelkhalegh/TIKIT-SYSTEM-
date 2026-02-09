'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, Send, Search, Loader2 } from 'lucide-react';
import { collaborationService } from '@/services/collaboration.service';
import { campaignService } from '@/services/campaign.service';
import { influencerService } from '@/services/influencer.service';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { BulkInviteRequest } from '@/types/collaboration.types';

export default function BulkInvitePage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;

  const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [agreedAmount, setAgreedAmount] = useState('');
  const [deliverables, setDeliverables] = useState([
    { name: '', description: '', dueDate: '' },
  ]);

  const { data: campaignData } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignService.getById(campaignId),
    enabled: !!campaignId,
  });

  const { data: influencersData } = useQuery({
    queryKey: ['influencers'],
    queryFn: () => influencerService.getAll({ perPage: 100 }),
  });

  const bulkInviteMutation = useMutation({
    mutationFn: (data: BulkInviteRequest) => collaborationService.bulkInvite(data),
    onSuccess: () => {
      toast.success('Invitations sent successfully');
      router.push(`/dashboard/campaigns/${campaignId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send invitations');
    },
  });

  const campaign = campaignData?.data;
  const influencers = influencersData?.data || [];
  const filteredInfluencers = influencers.filter((inf) =>
    (inf.displayName || inf.fullName).toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleInfluencer = (influencerId: string) => {
    setSelectedInfluencers((prev) =>
      prev.includes(influencerId)
        ? prev.filter((id) => id !== influencerId)
        : [...prev, influencerId]
    );
  };

  const handleAddDeliverable = () => {
    setDeliverables([...deliverables, { name: '', description: '', dueDate: '' }]);
  };

  const handleRemoveDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  const handleUpdateDeliverable = (
    index: number,
    field: 'name' | 'description' | 'dueDate',
    value: string
  ) => {
    const updated = [...deliverables];
    updated[index][field] = value;
    setDeliverables(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedInfluencers.length === 0) {
      toast.error('Please select at least one influencer');
      return;
    }

    const validDeliverables = deliverables
      .filter((d) => d.name.trim())
      .map((d) => ({
        ...d,
        id: `temp-${Date.now()}-${Math.random()}`,
        status: 'pending' as const,
      }));

    const data: BulkInviteRequest = {
      campaignId,
      influencerIds: selectedInfluencers,
      role: role || undefined,
      agreedDeliverables: validDeliverables.length > 0 ? validDeliverables : undefined,
      agreedAmount: agreedAmount ? Number(agreedAmount) : undefined,
    };

    await bulkInviteMutation.mutateAsync(data);
  };

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
            <span className="text-gray-900">Bulk Invite</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Invite Influencers</h1>
          <p className="mt-1 text-gray-600">
            Campaign: <span className="font-medium">{campaign?.campaignName || 'Loading...'}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Influencer Selection */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Influencers ({selectedInfluencers.length} selected)
            </h3>

            {/* Search */}
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search influencers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Influencer List */}
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredInfluencers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No influencers found
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredInfluencers.map((influencer) => (
                    <label
                      key={influencer.influencerId}
                      className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedInfluencers.includes(influencer.influencerId)}
                        onChange={() => handleToggleInfluencer(influencer.influencerId)}
                        className="h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                      />
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-700">
                          {(influencer.displayName || influencer.fullName).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{influencer.displayName || influencer.fullName}</div>
                        {influencer.fullName && influencer.displayName && (
                          <div className="text-sm text-gray-600">{influencer.fullName}</div>
                        )}
                        {influencer.primaryPlatform && (
                          <div className="text-xs text-gray-500">{influencer.primaryPlatform}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Collaboration Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Collaboration Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Brand Ambassador"
                />
              </div>
              <div>
                <Label htmlFor="agreedAmount">Agreed Amount ($)</Label>
                <Input
                  id="agreedAmount"
                  type="number"
                  step="0.01"
                  value={agreedAmount}
                  onChange={(e) => setAgreedAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </Card>

          {/* Deliverables */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Deliverables</h3>
              <Button type="button" onClick={handleAddDeliverable} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Deliverable
              </Button>
            </div>

            <div className="space-y-4">
              {deliverables.map((deliverable, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Deliverable {index + 1}</h4>
                    {deliverables.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => handleRemoveDeliverable(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor={`deliverable-${index}-name`}>Name</Label>
                      <Input
                        id={`deliverable-${index}-name`}
                        value={deliverable.name}
                        onChange={(e) => handleUpdateDeliverable(index, 'name', e.target.value)}
                        placeholder="e.g., Instagram Post"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor={`deliverable-${index}-description`}>Description</Label>
                      <textarea
                        id={`deliverable-${index}-description`}
                        value={deliverable.description}
                        onChange={(e) =>
                          handleUpdateDeliverable(index, 'description', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={2}
                        placeholder="Deliverable description..."
                      />
                    </div>
                    <div>
                      <Label htmlFor={`deliverable-${index}-dueDate`}>Due Date</Label>
                      <Input
                        id={`deliverable-${index}-dueDate`}
                        type="date"
                        value={deliverable.dueDate}
                        onChange={(e) => handleUpdateDeliverable(index, 'dueDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={bulkInviteMutation.isPending || selectedInfluencers.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {bulkInviteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending Invitations...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send {selectedInfluencers.length} Invitation
                  {selectedInfluencers.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
