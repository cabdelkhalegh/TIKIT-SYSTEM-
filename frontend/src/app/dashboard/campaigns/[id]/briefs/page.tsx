'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Upload,
  FileText,
  Sparkles,
  Trash2,
  Loader2,
  Target,
  BarChart3,
  Users,
  MessageSquare,
  Layers,
  Filter,
  Lightbulb,
  ClipboardPaste,
  X,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { briefService, type Brief } from '@/services/brief.service';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700' },
  extracting: { label: 'Extracting...', color: 'bg-yellow-100 text-yellow-700' },
  extracted: { label: 'Extracted', color: 'bg-green-100 text-green-700' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700' },
};

export default function BriefsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPasteForm, setShowPasteForm] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const { data: briefsData, isLoading } = useQuery({
    queryKey: ['briefs', campaignId],
    queryFn: () => briefService.getBriefs(campaignId),
    enabled: !!campaignId,
  });

  const briefs = briefsData?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: { rawText: string; fileName?: string }) =>
      briefService.createBrief(campaignId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['briefs', campaignId] });
      toast.success('Brief created successfully');
      setShowPasteForm(false);
      setPasteText('');
    },
    onError: () => toast.error('Failed to create brief'),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => briefService.uploadBrief(campaignId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['briefs', campaignId] });
      toast.success('Brief uploaded successfully');
    },
    onError: () => toast.error('Failed to upload brief'),
  });

  const extractMutation = useMutation({
    mutationFn: (briefId: string) => briefService.extractBrief(campaignId, briefId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['briefs', campaignId] });
      toast.success('Brief extracted successfully');
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['briefs', campaignId] });
      toast.error('AI extraction failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (briefId: string) => briefService.deleteBrief(campaignId, briefId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['briefs', campaignId] });
      toast.success('Brief deleted');
    },
    onError: () => toast.error('Failed to delete brief'),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) return;
    createMutation.mutate({ rawText: pasteText.trim() });
  };

  if (isLoading) {
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

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => router.push(`/dashboard/campaigns/${campaignId}`)}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Campaign Brief</h1>
            {briefs.length > 0 && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium">
                v{briefs[0].version}
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPasteForm(!showPasteForm)}
            >
              <ClipboardPaste className="h-4 w-4 mr-2" />
              Paste Text
            </Button>
          </div>
        </div>

        {/* Paste Text Form */}
        {showPasteForm && (
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Paste Brief Text</h3>
              <button onClick={() => setShowPasteForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your campaign brief text here..."
              rows={8}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => { setShowPasteForm(false); setPasteText(''); }}>
                Cancel
              </Button>
              <Button
                onClick={handlePasteSubmit}
                disabled={!pasteText.trim() || createMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Save Brief
              </Button>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {briefs.length === 0 && !showPasteForm && (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No briefs yet</h3>
            <p className="text-gray-600 mb-6">
              Upload a PDF or paste brief text to get started with AI extraction
            </p>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPasteForm(true)}
              >
                <ClipboardPaste className="h-4 w-4 mr-2" />
                Paste Text
              </Button>
            </div>
          </Card>
        )}

        {/* Brief Cards */}
        {briefs.map((brief) => (
          <BriefCard
            key={brief.id}
            brief={brief}
            onExtract={() => extractMutation.mutate(brief.id)}
            onDelete={() => deleteMutation.mutate(brief.id)}
            isExtracting={extractMutation.isPending && extractMutation.variables === brief.id}
            isDeleting={deleteMutation.isPending && deleteMutation.variables === brief.id}
          />
        ))}
      </div>
    </DashboardLayout>
  );
}

function BriefCard({
  brief,
  onExtract,
  onDelete,
  isExtracting,
  isDeleting,
}: {
  brief: Brief;
  onExtract: () => void;
  onDelete: () => void;
  isExtracting: boolean;
  isDeleting: boolean;
}) {
  const status = statusConfig[brief.aiStatus] || statusConfig.pending;

  return (
    <div className="mb-6">
      {/* Brief Header Card */}
      <Card className="p-6 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-gray-900">Version {brief.version}</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {(brief.aiStatus === 'pending' || brief.aiStatus === 'failed') && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExtract}
                disabled={isExtracting}
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                {isExtracting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Extract with AI
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {brief.fileName && <span className="mr-4">File: {brief.fileName}</span>}
          <span>Created: {new Date(brief.createdAt).toLocaleDateString()}</span>
        </div>
      </Card>

      {/* Extracted Results */}
      {brief.aiStatus === 'extracted' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ExtractedCard icon={Target} title="Objectives" content={brief.objectives} />
            <ExtractedCard icon={BarChart3} title="KPIs" content={brief.kpis} />
            <ExtractedCard icon={Users} title="Target Audience" content={brief.targetAudience} />
            <ExtractedCard icon={MessageSquare} title="Key Messages" content={brief.keyMessages} />
            <ExtractedCard icon={Layers} title="Content Pillars" content={brief.contentPillars} />
            <ExtractedCard icon={Filter} title="Matching Criteria" content={brief.matchingCriteria} />
          </div>
          {/* Full-width Strategy card */}
          <ExtractedCard icon={Lightbulb} title="Strategy" content={brief.strategy} fullWidth />
        </div>
      )}

      {/* Extracting state */}
      {brief.aiStatus === 'extracting' && (
        <Card className="p-8 text-center">
          <Loader2 className="h-8 w-8 text-purple-600 mx-auto mb-3 animate-spin" />
          <p className="text-gray-600">AI is extracting insights from the brief...</p>
        </Card>
      )}

      {/* Failed state */}
      {brief.aiStatus === 'failed' && (
        <Card className="p-6 border-red-200 bg-red-50">
          <p className="text-red-700 text-sm">
            AI extraction failed. You can try again by clicking "Extract with AI".
          </p>
        </Card>
      )}
    </div>
  );
}

function ExtractedCard({
  icon: Icon,
  title,
  content,
  fullWidth,
}: {
  icon: any;
  title: string;
  content: string | null;
  fullWidth?: boolean;
}) {
  if (!content) return null;

  return (
    <Card className={`p-5 ${fullWidth ? 'col-span-full' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-5 w-5 text-purple-600" />
        <h4 className="font-semibold text-gray-900">{title}</h4>
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
    </Card>
  );
}
