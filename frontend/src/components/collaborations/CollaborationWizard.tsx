'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Loader2, ChevronLeft, ChevronRight, Check, Search, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatNumber } from '@/lib/utils';

// Form validation schema for collaboration
const collaborationFormSchema = z.object({
  campaignId: z.string().min(1, 'Please select a campaign'),
  influencerIds: z.array(z.string()).min(1, 'Please select at least one influencer'),
  collaborations: z.array(
    z.object({
      influencerId: z.string(),
      role: z.string().optional(),
      agreedAmount: z.number().min(0, 'Amount must be at least 0'),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  ),
  deliverables: z.array(
    z.object({
      description: z.string().min(1, 'Description is required'),
      dueDate: z.string().min(1, 'Due date is required'),
    })
  ).optional(),
});

type CollaborationFormData = z.infer<typeof collaborationFormSchema>;

interface Campaign {
  campaignId: string;
  campaignName: string;
  client?: string;
  totalBudget: number;
  status: string;
}

interface Influencer {
  influencerId: string;
  fullName: string;
  username: string;
  primaryPlatform: string;
  platforms?: {
    platform: string;
    followersCount: number;
  }[];
  socialMedia?: {
    [key: string]: {
      followers: number;
    };
  };
}

interface CollaborationWizardProps {
  campaignId?: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export function CollaborationWizard({ campaignId, children, onSuccess }: CollaborationWizardProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [influencerSearch, setInfluencerSearch] = useState('');
  const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>([]);
  const [deliverables, setDeliverables] = useState<{ description: string; dueDate: string }[]>([]);
  const queryClient = useQueryClient();

  const TOTAL_STEPS = 5;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CollaborationFormData>({
    resolver: zodResolver(collaborationFormSchema),
    defaultValues: {
      campaignId: campaignId || '',
      influencerIds: [],
      collaborations: [],
      deliverables: [],
    },
  });

  const selectedCampaignId = watch('campaignId');
  const collaborations = watch('collaborations') || [];

  // Fetch campaigns
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await apiClient.get('/campaigns');
      return response.data.data as Campaign[];
    },
    enabled: open,
  });

  // Fetch influencers
  const { data: influencers, isLoading: influencersLoading } = useQuery({
    queryKey: ['influencers'],
    queryFn: async () => {
      const response = await apiClient.get('/influencers');
      return response.data.data as Influencer[];
    },
    enabled: open,
  });

  // Set campaign ID if provided
  useEffect(() => {
    if (campaignId) {
      setValue('campaignId', campaignId);
    }
  }, [campaignId, setValue]);

  // Filter campaigns
  const filteredCampaigns = campaigns?.filter((campaign) => {
    const matchesSearch = campaign.campaignName.toLowerCase().includes(campaignSearch.toLowerCase());
    const isActive = campaign.status === 'active' || campaign.status === 'draft';
    return matchesSearch && isActive;
  });

  // Filter influencers
  const filteredInfluencers = influencers?.filter((influencer) => {
    const matchesSearch =
      influencer.fullName.toLowerCase().includes(influencerSearch.toLowerCase()) ||
      influencer.username.toLowerCase().includes(influencerSearch.toLowerCase());
    return matchesSearch;
  });

  // Get selected campaign
  const selectedCampaign = campaigns?.find((c) => c.campaignId === selectedCampaignId);

  // Get influencer data
  const getInfluencer = (influencerId: string) => {
    return influencers?.find((i) => i.influencerId === influencerId);
  };

  // Get total followers for an influencer
  const getTotalFollowers = (influencer: Influencer) => {
    if (influencer.platforms) {
      return influencer.platforms.reduce((sum, p) => sum + p.followersCount, 0);
    }
    if (influencer.socialMedia) {
      return Object.values(influencer.socialMedia).reduce((sum, p) => sum + (p.followers || 0), 0);
    }
    return 0;
  };

  // Handle influencer selection
  const handleInfluencerToggle = (influencerId: string) => {
    const newSelection = selectedInfluencers.includes(influencerId)
      ? selectedInfluencers.filter((id) => id !== influencerId)
      : [...selectedInfluencers, influencerId];
    
    setSelectedInfluencers(newSelection);
    setValue('influencerIds', newSelection, { shouldValidate: true });

    // Initialize collaboration data for new influencers
    const newCollaborations = newSelection.map((id) => {
      const existing = collaborations.find((c) => c.influencerId === id);
      return existing || {
        influencerId: id,
        role: '',
        agreedAmount: 0,
        startDate: '',
        endDate: '',
      };
    });
    setValue('collaborations', newCollaborations);
  };

  // Update collaboration details
  const updateCollaboration = (influencerId: string, field: string, value: any) => {
    const newCollaborations = collaborations.map((c) =>
      c.influencerId === influencerId ? { ...c, [field]: value } : c
    );
    setValue('collaborations', newCollaborations);
  };

  // Apply values to all collaborations
  const applyToAll = () => {
    if (collaborations.length === 0) return;
    const template = collaborations[0];
    
    // Validate that template has at least the agreed amount
    if (!template.agreedAmount || template.agreedAmount < 0) {
      toast.error('Please set a valid agreed amount in the first collaboration before applying to all');
      return;
    }
    
    const newCollaborations = collaborations.map((c) => ({
      ...c,
      role: template.role,
      agreedAmount: template.agreedAmount,
      startDate: template.startDate,
      endDate: template.endDate,
    }));
    setValue('collaborations', newCollaborations);
    toast.success('Applied values to all collaborations');
  };

  // Add deliverable
  const addDeliverable = () => {
    setDeliverables([...deliverables, { description: '', dueDate: '' }]);
  };

  // Remove deliverable
  const removeDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  // Update deliverable
  const updateDeliverable = (index: number, field: string, value: string) => {
    const newDeliverables = deliverables.map((d, i) =>
      i === index ? { ...d, [field]: value } : d
    );
    setDeliverables(newDeliverables);
  };

  // Calculate total cost
  const calculateTotalCost = () => {
    return collaborations.reduce((sum, c) => sum + (c.agreedAmount || 0), 0);
  };

  // Create collaborations mutation
  const createCollaborationsMutation = useMutation({
    mutationFn: async (data: CollaborationFormData) => {
      const validDeliverables = deliverables.filter(
        (d) => d.description && d.dueDate
      );

      // If multiple influencers, use bulk invite
      if (data.influencerIds.length > 1) {
        const response = await apiClient.post('/collaborations/invite-bulk', {
          campaignId: data.campaignId,
          influencers: data.collaborations.map((collab) => ({
            influencerId: collab.influencerId,
            role: collab.role || undefined,
            agreedAmount: collab.agreedAmount,
            startDate: collab.startDate || undefined,
            endDate: collab.endDate || undefined,
            deliverables: validDeliverables.length > 0 ? validDeliverables : undefined,
          })),
        });
        return response.data;
      } else {
        // Single collaboration
        const collab = data.collaborations[0];
        const response = await apiClient.post('/collaborations', {
          campaignId: data.campaignId,
          influencerId: collab.influencerId,
          role: collab.role || undefined,
          agreedAmount: collab.agreedAmount,
          startDate: collab.startDate || undefined,
          endDate: collab.endDate || undefined,
          deliverables: validDeliverables.length > 0 ? validDeliverables : undefined,
        });
        return response.data;
      }
    },
    onSuccess: (data) => {
      const count = Array.isArray(data.data) ? data.data.length : 1;
      toast.success(`Successfully created ${count} collaboration${count > 1 ? 's' : ''}!`);
      queryClient.invalidateQueries({ queryKey: ['collaborations'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setOpen(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to create collaboration(s). Please try again.';
      toast.error(errorMessage);
    },
  });

  const onSubmit = (data: CollaborationFormData) => {
    createCollaborationsMutation.mutate(data);
  };

  const resetForm = () => {
    reset();
    setCurrentStep(1);
    setSelectedInfluencers([]);
    setDeliverables([]);
    setCampaignSearch('');
    setInfluencerSearch('');
  };

  const handleDialogChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setCurrentStep(step);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return !!selectedCampaignId;
      case 2:
        return selectedInfluencers.length > 0;
      case 3:
        return collaborations.every((c) => c.agreedAmount >= 0);
      default:
        return true;
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step === currentStep
                  ? 'border-purple-600 bg-purple-600 text-white'
                  : step < currentStep
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-gray-300 bg-white text-gray-400'
              }`}
            >
              {step < currentStep ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="text-sm font-semibold">{step}</span>
              )}
            </div>
            {step < 5 && (
              <div
                className={`w-12 h-1 mx-2 ${
                  step < currentStep ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 text-sm text-center text-gray-600">
        Step {currentStep} of {TOTAL_STEPS}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Select Campaign</h3>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search campaigns..."
          value={campaignSearch}
          onChange={(e) => setCampaignSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {campaignsLoading ? (
          <p className="text-sm text-gray-500">Loading campaigns...</p>
        ) : filteredCampaigns && filteredCampaigns.length > 0 ? (
          filteredCampaigns.map((campaign) => (
            <Card
              key={campaign.campaignId}
              className={`cursor-pointer transition-all ${
                selectedCampaignId === campaign.campaignId
                  ? 'border-purple-600 bg-purple-50'
                  : 'hover:border-gray-400'
              }`}
              onClick={() => setValue('campaignId', campaign.campaignId, { shouldValidate: true })}
            >
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{campaign.campaignName}</CardTitle>
                    <CardDescription className="text-sm">
                      {campaign.client && `Client: ${campaign.client} • `}
                      Budget: {formatCurrency(campaign.totalBudget)}
                    </CardDescription>
                  </div>
                  {selectedCampaignId === campaign.campaignId && (
                    <Check className="h-5 w-5 text-purple-600" />
                  )}
                </div>
              </CardHeader>
            </Card>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            No active campaigns found
          </p>
        )}
      </div>
      {errors.campaignId && (
        <p className="text-sm text-red-500">{errors.campaignId.message}</p>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Select Influencers</h3>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search influencers..."
          value={influencerSearch}
          onChange={(e) => setInfluencerSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="text-sm text-gray-600">
        {selectedInfluencers.length} influencer{selectedInfluencers.length !== 1 ? 's' : ''} selected
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {influencersLoading ? (
          <p className="text-sm text-gray-500">Loading influencers...</p>
        ) : filteredInfluencers && filteredInfluencers.length > 0 ? (
          filteredInfluencers.map((influencer) => (
            <Card
              key={influencer.influencerId}
              className={`cursor-pointer transition-all ${
                selectedInfluencers.includes(influencer.influencerId)
                  ? 'border-purple-600 bg-purple-50'
                  : 'hover:border-gray-400'
              }`}
              onClick={() => handleInfluencerToggle(influencer.influencerId)}
            >
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-bold">
                      {influencer.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-base">{influencer.fullName}</CardTitle>
                      <CardDescription className="text-sm">
                        @{influencer.username} • {influencer.primaryPlatform} • {formatNumber(getTotalFollowers(influencer))} followers
                      </CardDescription>
                    </div>
                  </div>
                  <Checkbox
                    checked={selectedInfluencers.includes(influencer.influencerId)}
                    onCheckedChange={() => handleInfluencerToggle(influencer.influencerId)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </CardHeader>
            </Card>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            No influencers found
          </p>
        )}
      </div>
      {errors.influencerIds && (
        <p className="text-sm text-red-500">{errors.influencerIds.message}</p>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Define Collaboration Details</h3>
        {collaborations.length > 1 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={applyToAll}
          >
            Apply First to All
          </Button>
        )}
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {collaborations.map((collab, index) => {
          const influencer = getInfluencer(collab.influencerId);
          if (!influencer) return null;

          return (
            <Card key={collab.influencerId}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                    {influencer.fullName.charAt(0).toUpperCase()}
                  </div>
                  {influencer.fullName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`role-${index}`}>Role/Position</Label>
                    <Input
                      id={`role-${index}`}
                      placeholder="e.g., Brand Ambassador"
                      value={collab.role || ''}
                      onChange={(e) => updateCollaboration(collab.influencerId, 'role', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`amount-${index}`}>
                      Agreed Amount ($) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`amount-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={collab.agreedAmount || 0}
                      onChange={(e) =>
                        updateCollaboration(collab.influencerId, 'agreedAmount', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`startDate-${index}`}>Start Date</Label>
                    <Input
                      id={`startDate-${index}`}
                      type="date"
                      value={collab.startDate || ''}
                      onChange={(e) => updateCollaboration(collab.influencerId, 'startDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`endDate-${index}`}>End Date</Label>
                    <Input
                      id={`endDate-${index}`}
                      type="date"
                      value={collab.endDate || ''}
                      onChange={(e) => updateCollaboration(collab.influencerId, 'endDate', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Add Deliverables (Optional)</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addDeliverable}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Deliverable
        </Button>
      </div>

      <p className="text-sm text-gray-600">
        Define deliverables that will be added to all collaborations
      </p>

      {deliverables.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {deliverables.map((deliverable, index) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`deliverable-desc-${index}`}>Description</Label>
                      <Input
                        id={`deliverable-desc-${index}`}
                        placeholder="e.g., Instagram post"
                        value={deliverable.description}
                        onChange={(e) => updateDeliverable(index, 'description', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`deliverable-date-${index}`}>Due Date</Label>
                      <Input
                        id={`deliverable-date-${index}`}
                        type="date"
                        value={deliverable.dueDate}
                        onChange={(e) => updateDeliverable(index, 'dueDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDeliverable(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-sm text-gray-500 text-center">
              No deliverables added yet. Click &quot;Add Deliverable&quot; to add one.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Review & Submit</h3>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium">{selectedCampaign?.campaignName}</p>
          <p className="text-sm text-gray-600">
            Budget: {formatCurrency(selectedCampaign?.totalBudget || 0)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Collaborations ({collaborations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {collaborations.map((collab) => {
            const influencer = getInfluencer(collab.influencerId);
            if (!influencer) return null;

            return (
              <div
                key={collab.influencerId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium">{influencer.fullName}</p>
                  <p className="text-xs text-gray-600">
                    {collab.role || 'No role specified'} • {formatCurrency(collab.agreedAmount)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => goToStep(3)}
                >
                  Edit
                </Button>
              </div>
            );
          })}
          <div className="pt-3 border-t border-gray-200 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Total Cost:</span>
              <span className="text-lg font-bold text-purple-600">
                {formatCurrency(calculateTotalCost())}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {deliverables.filter((d) => d.description && d.dueDate).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deliverables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {deliverables
              .filter((d) => d.description && d.dueDate)
              .map((deliverable, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{deliverable.description}</span>
                  <span className="text-xs text-gray-600">Due: {deliverable.dueDate}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            New Collaboration
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Collaboration</DialogTitle>
          <DialogDescription>
            Follow the steps to create one or more collaborations with influencers
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {renderStepIndicator()}
          {renderCurrentStep()}

          <DialogFooter className="gap-2">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => goToStep(currentStep - 1)}
                disabled={createCollaborationsMutation.isPending}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}

            {currentStep < TOTAL_STEPS ? (
              <Button
                type="button"
                onClick={() => goToStep(currentStep + 1)}
                disabled={!canProceedToNextStep() || createCollaborationsMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700"
                disabled={createCollaborationsMutation.isPending}
              >
                {createCollaborationsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Collaboration{collaborations.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Export a default trigger button component
export function CreateCollaborationButton({ campaignId }: { campaignId?: string }) {
  return (
    <CollaborationWizard campaignId={campaignId}>
      <Button className="bg-purple-600 hover:bg-purple-700">
        <Plus className="h-4 w-4 mr-2" />
        New Collaboration
      </Button>
    </CollaborationWizard>
  );
}
