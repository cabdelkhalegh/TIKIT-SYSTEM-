'use client';

import { useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Upload,
  FileText,
  Sparkles,
  CheckCircle,
  Loader2,
  X,
  ClipboardPaste,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { campaignService } from '@/services/campaign.service';
import type { BriefFields } from '@/lib/brief-extractor';

const FIELD_META: {
  key: keyof BriefFields;
  label: string;
  placeholder: string;
  multiline?: boolean;
}[] = [
  {
    key: 'campaign_goals',
    label: 'Campaign Goals',
    placeholder: 'e.g. Increase brand awareness by 30%',
    multiline: true,
  },
  {
    key: 'target_audience',
    label: 'Target Audience',
    placeholder: 'e.g. Women 25-34, interested in fitness and wellness',
    multiline: true,
  },
  {
    key: 'deliverables',
    label: 'Deliverables',
    placeholder: 'e.g. 3 Instagram posts, 2 Stories, 1 Reel',
    multiline: true,
  },
  {
    key: 'timeline',
    label: 'Timeline',
    placeholder: 'e.g. March 1 - March 31, 2026',
  },
  {
    key: 'budget_hint',
    label: 'Budget Hint',
    placeholder: 'e.g. $15,000 USD',
  },
  {
    key: 'tone_of_voice',
    label: 'Tone of Voice',
    placeholder: 'e.g. Friendly, aspirational, authentic',
  },
  {
    key: 'key_messages',
    label: 'Key Messages',
    placeholder: 'e.g. Our product is 100% natural and sustainably sourced',
    multiline: true,
  },
];

const EMPTY_FIELDS: BriefFields = {
  campaign_goals: '',
  target_audience: '',
  deliverables: '',
  timeline: '',
  budget_hint: '',
  tone_of_voice: '',
  key_messages: '',
};

const ACCEPTED_TYPES = '.txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export default function CampaignBriefPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fields, setFields] = useState<BriefFields>({ ...EMPTY_FIELDS });
  const [extractionMethod, setExtractionMethod] = useState<'openai' | 'keyword' | null>(null);
  const [hasExtracted, setHasExtracted] = useState(false);

  // Fetch campaign info
  const { data: campaignData, isLoading: campaignLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignService.getById(campaignId),
    enabled: !!campaignId,
  });

  const campaign = campaignData?.data;

  // Extract mutation
  const extractMutation = useMutation({
    mutationFn: async () => {
      if (selectedFile) {
        return campaignService.extractBriefFromFile(campaignId, selectedFile);
      }
      return campaignService.extractBrief(campaignId, rawText);
    },
    onSuccess: (data) => {
      setFields(data.data.fields);
      setExtractionMethod(data.data.extraction_method);
      setHasExtracted(true);
      toast.success(
        `Brief extracted using ${data.data.extraction_method === 'openai' ? 'AI' : 'keyword matching'}`
      );
    },
    onError: () => {
      toast.error('Failed to extract brief. Check your input and try again.');
    },
  });

  // Apply mutation
  const applyMutation = useMutation({
    mutationFn: () => campaignService.applyBrief(campaignId, fields),
    onSuccess: () => {
      toast.success('Brief applied to campaign successfully');
      router.push(`/dashboard/campaigns/${campaignId}`);
    },
    onError: () => {
      toast.error('Failed to apply brief to campaign');
    },
  });

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setRawText('');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setRawText('');
    }
  }, []);

  const handleFieldChange = (key: keyof BriefFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const canExtract = rawText.trim().length > 0 || selectedFile !== null;
  const hasAnyField = Object.values(fields).some((v) => v.trim().length > 0);

  if (campaignLoading) {
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

  if (!campaign) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Campaign not found</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => router.push(`/dashboard/campaigns/${campaignId}`)}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Campaign Brief</h1>
          </div>
          <p className="text-gray-600 ml-7">
            Paste or upload a brief for <span className="font-medium">{campaign.campaignName}</span> and let AI extract the key fields.
          </p>
        </div>

        {/* Step 1: Input */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardPaste className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">1. Provide Brief Content</h2>
          </div>

          {/* Upload zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors mb-4"
          >
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-purple-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={clearFile}
                  className="ml-4 p-1 text-gray-400 hover:text-red-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-1">
                  Drag & drop a file here, or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    browse
                  </button>
                </p>
                <p className="text-sm text-gray-400">Supports PDF, TXT, DOCX</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Or paste text */}
          {!selectedFile && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-sm text-gray-400">or paste text below</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste your campaign brief here..."
                rows={8}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
              />
            </>
          )}

          {/* Extract button */}
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => extractMutation.mutate()}
              disabled={!canExtract || extractMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {extractMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Extract Brief
            </Button>
          </div>
        </Card>

        {/* Step 2: Extracted fields */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">2. Review & Edit Fields</h2>
            </div>
            {extractionMethod && (
              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                Extracted via {extractionMethod === 'openai' ? 'AI' : 'keyword matching'}
              </span>
            )}
          </div>

          {!hasExtracted && !hasAnyField && (
            <p className="text-gray-400 text-sm mb-4">
              Fields will be pre-filled after extraction. You can also fill them manually.
            </p>
          )}

          <div className="space-y-4">
            {FIELD_META.map(({ key, label, placeholder, multiline }) => (
              <div key={key}>
                <Label htmlFor={key} className="text-sm font-medium text-gray-700">
                  {label}
                </Label>
                {multiline ? (
                  <textarea
                    id={key}
                    value={fields[key]}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    placeholder={placeholder}
                    rows={3}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
                  />
                ) : (
                  <Input
                    id={key}
                    value={fields[key]}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    placeholder={placeholder}
                    className="mt-1"
                  />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Step 3: Apply */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/campaigns/${campaignId}`)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => applyMutation.mutate()}
            disabled={!hasAnyField || applyMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {applyMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Apply to Campaign
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
