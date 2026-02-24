'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Upload,
  ClipboardPaste,
  Zap,
  ChevronRight,
  Sparkles,
  Loader2,
  FileText,
  X,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CampaignForm from '@/components/campaigns/CampaignForm';
import type { CampaignFormData } from '@/components/campaigns/CampaignForm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { campaignService } from '@/services/campaign.service';
import { clientService } from '@/services/client.service';
import { briefService } from '@/services/brief.service';
import type { BriefAnalysis } from '@/services/brief.service';
import type { CreateCampaignRequest, UpdateCampaignRequest } from '@/types/campaign.types';

type WizardMode = 'upload' | 'paste' | 'quick' | null;
type WizardStep = 'select' | 'brief-input' | 'form';

const MODE_OPTIONS = [
  {
    id: 'upload' as WizardMode,
    title: 'Upload Brief',
    description: 'Upload a PDF or document. AI will extract and pre-fill the campaign.',
    icon: Upload,
  },
  {
    id: 'paste' as WizardMode,
    title: 'Paste Brief Text',
    description: 'Paste your brief text. AI will read it and populate the form for you.',
    icon: ClipboardPaste,
  },
  {
    id: 'quick' as WizardMode,
    title: 'Quick Create',
    description: 'Fill in the campaign details manually. Fast and direct.',
    icon: Zap,
  },
];

const ACCEPTED_TYPES = '.pdf,.txt,.doc,.docx';
const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export default function NewCampaignPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedMode, setSelectedMode] = useState<WizardMode>(null);
  const [wizardStep, setWizardStep] = useState<WizardStep>('select');

  // Brief input state
  const [pasteText, setPasteText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // AI pre-fill state
  const [initialData, setInitialData] = useState<Partial<CampaignFormData> | undefined>(undefined);
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getAll({ perPage: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCampaignRequest) => campaignService.create(data),
    onSuccess: (response) => {
      toast.success('Campaign created successfully');
      router.push(`/dashboard/campaigns/${response.data.campaignId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create campaign');
    },
  });

  const handleSubmit = async (data: CreateCampaignRequest | UpdateCampaignRequest) => {
    await createMutation.mutateAsync(data as CreateCampaignRequest);
  };

  // Map AI analysis result to form data
  const mapAnalysisToForm = (analysis: BriefAnalysis): { data: Partial<CampaignFormData>; fields: Set<string> } => {
    const data: Partial<CampaignFormData> = {};
    const fields = new Set<string>();

    if (analysis.campaignName) {
      data.campaignName = analysis.campaignName;
      fields.add('campaignName');
    }

    if (analysis.description) {
      data.campaignDescription = analysis.description;
      fields.add('campaignDescription');
    }

    if (analysis.objectives && Array.isArray(analysis.objectives) && analysis.objectives.length > 0) {
      data.campaignObjectives = analysis.objectives;
      fields.add('campaignObjectives');
    }

    if (analysis.suggestedBudget && typeof analysis.suggestedBudget === 'number') {
      data.totalBudget = analysis.suggestedBudget;
      fields.add('totalBudget');
    }

    return { data, fields };
  };

  // Handle AI analysis
  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      let result;
      if (selectedMode === 'upload' && selectedFile) {
        result = await briefService.analyzeFile(selectedFile);
      } else if (selectedMode === 'paste' && pasteText.trim()) {
        result = await briefService.analyzeText(pasteText.trim());
      } else {
        throw new Error('No input provided');
      }

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      const { data, fields } = mapAnalysisToForm(result.data);
      setInitialData(data);
      setAiFilledFields(fields);
      toast.success('Brief analyzed successfully! Fields pre-filled.');
      setWizardStep('form');
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || 'AI analysis failed';
      setAnalysisError(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Continue button handler
  const handleContinue = () => {
    if (selectedMode === 'quick') {
      setWizardStep('form');
    } else {
      setWizardStep('brief-input');
    }
  };

  // File drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && ACCEPTED_MIME_TYPES.includes(file.type)) {
      setSelectedFile(file);
      setAnalysisError(null);
    } else {
      toast.error('Please upload a PDF, TXT, DOC, or DOCX file');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAnalysisError(null);
    }
  };

  if (clientsLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const clients = (clientsData?.data || []).map((client) => ({
    clientId: client.id,
    brandName: client.brandName,
    companyLegalName: client.companyLegalName,
  }));

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => {
                if (wizardStep === 'form' || wizardStep === 'brief-input') {
                  setWizardStep(wizardStep === 'form' && selectedMode !== 'quick' ? 'brief-input' : 'select');
                  if (wizardStep === 'form' && selectedMode === 'quick') {
                    setSelectedMode(null);
                  }
                } else {
                  router.back();
                }
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
          </div>
          <p className="text-gray-600 ml-7">
            {wizardStep === 'select'
              ? 'Choose how you want to create your campaign'
              : wizardStep === 'brief-input'
              ? selectedMode === 'upload'
                ? 'Upload your campaign brief document'
                : 'Paste your campaign brief text'
              : 'Set up your influencer marketing campaign with objectives and targeting'}
          </p>
        </div>

        {/* Step 1: Mode Selection */}
        {wizardStep === 'select' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MODE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedMode === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedMode(option.id)}
                    className={`relative p-6 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                        isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3
                      className={`text-lg font-semibold mb-2 ${
                        isSelected ? 'text-purple-900' : 'text-gray-900'
                      }`}
                    >
                      {option.title}
                    </h3>
                    <p className={`text-sm ${isSelected ? 'text-purple-700' : 'text-gray-600'}`}>
                      {option.description}
                    </p>
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleContinue}
                disabled={!selectedMode}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              >
                Continue
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2A: Upload Brief */}
        {wizardStep === 'brief-input' && selectedMode === 'upload' && (
          <div className="space-y-6">
            <Card className="p-8">
              {!isAnalyzing ? (
                <>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-purple-600 bg-purple-50'
                        : selectedFile
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_TYPES}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {selectedFile ? (
                      <div className="space-y-3">
                        <FileText className="h-12 w-12 text-green-600 mx-auto" />
                        <div>
                          <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                        <div>
                          <p className="text-lg font-medium text-gray-900">
                            Drag & drop your brief here
                          </p>
                          <p className="text-sm text-gray-500">
                            or click to browse — PDF, TXT, DOC, DOCX
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {analysisError && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{analysisError}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-16 text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100">
                    <Sparkles className="h-8 w-8 text-purple-600 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">Analyzing brief...</p>
                    <p className="text-sm text-gray-500 mt-1">
                      AI is reading your document and extracting campaign details
                    </p>
                  </div>
                  <Loader2 className="h-6 w-6 text-purple-600 animate-spin mx-auto" />
                </div>
              )}
            </Card>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setWizardStep('select');
                  setSelectedFile(null);
                  setAnalysisError(null);
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setInitialData(undefined);
                    setAiFilledFields(new Set());
                    setWizardStep('form');
                  }}
                >
                  Skip AI — fill manually
                </Button>
                <Button
                  onClick={runAnalysis}
                  disabled={!selectedFile || isAnalyzing}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze with AI
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2B: Paste Brief Text */}
        {wizardStep === 'brief-input' && selectedMode === 'paste' && (
          <div className="space-y-6">
            <Card className="p-8">
              {!isAnalyzing ? (
                <>
                  <textarea
                    value={pasteText}
                    onChange={(e) => {
                      setPasteText(e.target.value);
                      setAnalysisError(null);
                    }}
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none text-gray-900"
                    placeholder="Paste your campaign brief here..."
                  />
                  {analysisError && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{analysisError}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-16 text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100">
                    <Sparkles className="h-8 w-8 text-purple-600 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">Analyzing brief...</p>
                    <p className="text-sm text-gray-500 mt-1">
                      AI is reading your text and extracting campaign details
                    </p>
                  </div>
                  <Loader2 className="h-6 w-6 text-purple-600 animate-spin mx-auto" />
                </div>
              )}
            </Card>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setWizardStep('select');
                  setPasteText('');
                  setAnalysisError(null);
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setInitialData(undefined);
                    setAiFilledFields(new Set());
                    setWizardStep('form');
                  }}
                >
                  Skip AI — fill manually
                </Button>
                <Button
                  onClick={runAnalysis}
                  disabled={!pasteText.trim() || isAnalyzing}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze with AI
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Campaign Form */}
        {wizardStep === 'form' && (
          <CampaignForm
            clients={clients}
            onSubmit={handleSubmit}
            isSubmitting={createMutation.isPending}
            initialData={initialData}
            aiFilledFields={aiFilledFields}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
