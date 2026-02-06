'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import type {
  Collaboration,
  CreateCollaborationRequest,
  UpdateCollaborationRequest,
  Deliverable,
} from '@/types/collaboration.types';

const deliverableSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Deliverable name is required'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['pending', 'submitted', 'approved', 'rejected']).default('pending'),
});

const collaborationFormSchema = z.object({
  campaignId: z.string().min(1, 'Campaign is required'),
  influencerId: z.string().min(1, 'Influencer is required'),
  role: z.string().optional(),
  agreedDeliverables: z.array(deliverableSchema).optional(),
  agreedAmount: z.number().min(0, 'Amount must be positive').optional(),
  notes: z.string().optional(),
});

type CollaborationFormData = z.infer<typeof collaborationFormSchema>;

interface CollaborationFormProps {
  collaboration?: Collaboration;
  campaigns: Array<{ campaignId: string; campaignName: string }>;
  influencers: Array<{ id: string; displayName?: string; fullName: string }>;
  onSubmit: (data: CreateCollaborationRequest | UpdateCollaborationRequest) => Promise<void>;
  isSubmitting?: boolean;
}

export default function CollaborationForm({
  collaboration,
  campaigns,
  influencers,
  onSubmit,
  isSubmitting = false,
}: CollaborationFormProps) {
  const [deliverableCount, setDeliverableCount] = useState(1);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CollaborationFormData>({
    resolver: zodResolver(collaborationFormSchema),
    defaultValues: {
      campaignId: collaboration?.campaignId || '',
      influencerId: collaboration?.influencerId || '',
      role: collaboration?.role || '',
      agreedDeliverables: collaboration?.agreedDeliverables || [
        { name: '', description: '', dueDate: '', status: 'pending' as const },
      ],
      agreedAmount: collaboration?.agreedAmount || undefined,
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'agreedDeliverables',
  });

  useEffect(() => {
    if (collaboration) {
      reset({
        campaignId: collaboration.campaignId,
        influencerId: collaboration.influencerId,
        role: collaboration.role || '',
        agreedDeliverables: collaboration.agreedDeliverables || [
          { name: '', description: '', dueDate: '', status: 'pending' as const },
        ],
        agreedAmount: collaboration.agreedAmount,
        notes: '',
      });
    }
  }, [collaboration, reset]);

  const handleFormSubmit = async (data: CollaborationFormData) => {
    const formattedData = {
      ...data,
      agreedAmount: data.agreedAmount ? Number(data.agreedAmount) : undefined,
      agreedDeliverables: data.agreedDeliverables?.map((d) => ({
        ...d,
        id: d.id || `temp-${Date.now()}-${Math.random()}`,
      })),
    };
    await onSubmit(formattedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Campaign Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign & Influencer</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="campaignId">Campaign *</Label>
            <select
              id="campaignId"
              {...register('campaignId')}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={!!collaboration}
            >
              <option value="">Select a campaign</option>
              {campaigns.map((campaign) => (
                <option key={campaign.campaignId} value={campaign.campaignId}>
                  {campaign.campaignName}
                </option>
              ))}
            </select>
            {errors.campaignId && (
              <p className="mt-1 text-sm text-red-600">{errors.campaignId.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="influencerId">Influencer *</Label>
            <select
              id="influencerId"
              {...register('influencerId')}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={!!collaboration}
            >
              <option value="">Select an influencer</option>
              {influencers.map((influencer) => (
                <option key={influencer.id} value={influencer.id}>
                  {influencer.displayName || influencer.fullName}
                </option>
              ))}
            </select>
            {errors.influencerId && (
              <p className="mt-1 text-sm text-red-600">{errors.influencerId.message}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Role & Amount */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Collaboration Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              {...register('role')}
              placeholder="e.g., Brand Ambassador, Content Creator"
            />
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="agreedAmount">Agreed Amount ($)</Label>
            <Input
              id="agreedAmount"
              type="number"
              step="0.01"
              {...register('agreedAmount', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.agreedAmount && (
              <p className="mt-1 text-sm text-red-600">{errors.agreedAmount.message}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Deliverables */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Deliverables</h3>
          <Button
            type="button"
            onClick={() =>
              append({ name: '', description: '', dueDate: '', status: 'pending' as const })
            }
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Deliverable
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-gray-900">Deliverable {index + 1}</h4>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => remove(index)}
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
                  <Label htmlFor={`agreedDeliverables.${index}.name`}>Name *</Label>
                  <Input
                    id={`agreedDeliverables.${index}.name`}
                    {...register(`agreedDeliverables.${index}.name` as const)}
                    placeholder="e.g., Instagram Post, YouTube Video"
                  />
                  {errors.agreedDeliverables?.[index]?.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.agreedDeliverables[index]?.name?.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor={`agreedDeliverables.${index}.description`}>Description</Label>
                  <textarea
                    id={`agreedDeliverables.${index}.description`}
                    {...register(`agreedDeliverables.${index}.description` as const)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                    placeholder="Deliverable description..."
                  />
                </div>

                <div>
                  <Label htmlFor={`agreedDeliverables.${index}.dueDate`}>Due Date</Label>
                  <Input
                    id={`agreedDeliverables.${index}.dueDate`}
                    type="date"
                    {...register(`agreedDeliverables.${index}.dueDate` as const)}
                  />
                </div>
              </div>
            </div>
          ))}

          {fields.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No deliverables added. Click &quot;Add Deliverable&quot; to add one.
            </div>
          )}
        </div>
      </Card>

      {/* Notes */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
        <textarea
          {...register('notes')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows={4}
          placeholder="Any additional notes or instructions..."
        />
      </Card>

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {collaboration ? 'Update Collaboration' : 'Create Collaboration'}
        </Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
