'use client';

// T040: BriefTab — brief management tab for campaign detail hub
// Upload/paste input, AI extraction cards with confidence indicators,
// inline editing, re-run extraction, review flow, version history

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  Sparkles,
  Loader2,
  Target,
  BarChart3,
  Users,
  MessageSquare,
  Layers,
  Filter,
  DollarSign,
  Building2,
  ClipboardPaste,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Pencil,
  X,
  Save,
  RefreshCw,
  AlertTriangle,
  Clock,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { briefService, type Brief, type BriefVersion } from '@/services/brief.service';

interface BriefTabProps {
  campaignId: string;
  campaign: any;
}

// Confidence level helpers
function getConfidenceColor(score: number) {
  if (score >= 0.8) return 'bg-green-500';
  if (score >= 0.5) return 'bg-amber-500';
  return 'bg-red-500';
}

function getConfidenceLabel(score: number) {
  if (score >= 0.8) return 'High';
  if (score >= 0.5) return 'Medium';
  return 'Low';
}

// Parse JSON string safely
function tryParseJson(value: string | null): any {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

const FIELD_CONFIG: { key: string; label: string; icon: any }[] = [
  { key: 'objectives', label: 'Objectives', icon: Target },
  { key: 'kpis', label: 'KPIs', icon: BarChart3 },
  { key: 'targetAudience', label: 'Target Audience', icon: Users },
  { key: 'deliverables', label: 'Deliverables', icon: Package },
  { key: 'budgetSignals', label: 'Budget Signals', icon: DollarSign },
  { key: 'clientInfo', label: 'Client Info', icon: Building2 },
  { key: 'keyMessages', label: 'Key Messages', icon: MessageSquare },
  { key: 'contentPillars', label: 'Content Pillars', icon: Layers },
  { key: 'matchingCriteria', label: 'Matching Criteria', icon: Filter },
];

export default function BriefTab({ campaignId, campaign }: BriefTabProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPasteForm, setShowPasteForm] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showVersions, setShowVersions] = useState(false);

  // Fetch briefs
  const { data: briefsData, isLoading } = useQuery({
    queryKey: ['campaign-briefs', campaignId],
    queryFn: () => briefService.getBriefs(campaignId),
    enabled: !!campaignId,
  });

  const briefs = briefsData?.data || [];
  const brief = briefs[0] as Brief | undefined;

  // Fetch versions when expanded
  const { data: versionsData } = useQuery({
    queryKey: ['brief-versions', campaignId, brief?.id],
    queryFn: () => briefService.getVersions(campaignId, brief!.id),
    enabled: !!brief?.id && showVersions,
  });

  const versions = versionsData?.data?.versions || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: { rawText: string }) => briefService.createBrief(campaignId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-briefs', campaignId] });
      toast.success('Brief created');
      setShowPasteForm(false);
      setPasteText('');
    },
    onError: () => toast.error('Failed to create brief'),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => briefService.uploadBrief(campaignId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-briefs', campaignId] });
      toast.success('Brief uploaded');
    },
    onError: () => toast.error('Failed to upload brief'),
  });

  const extractMutation = useMutation({
    mutationFn: (briefId: string) => briefService.extractBrief(campaignId, briefId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-briefs', campaignId] });
      toast.success('Extraction complete');
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-briefs', campaignId] });
      toast.error('AI extraction failed — you can fill in fields manually');
    },
  });

  const reExtractMutation = useMutation({
    mutationFn: (briefId: string) => briefService.reExtract(campaignId, briefId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-briefs', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['brief-versions', campaignId] });
      toast.success('Re-extraction complete');
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-briefs', campaignId] });
      toast.error('AI re-extraction failed');
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (briefId: string) => briefService.markReviewed(campaignId, briefId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-briefs', campaignId] });
      toast.success('Brief marked as reviewed');
    },
    onError: () => toast.error('Failed to mark brief as reviewed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ briefId, data }: { briefId: string; data: Partial<Brief> }) =>
      briefService.updateBrief(campaignId, briefId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-briefs', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['brief-versions', campaignId] });
      setEditingField(null);
      toast.success('Field updated');
    },
    onError: () => toast.error('Failed to update field'),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = '';
  };

  const handleStartEdit = (fieldKey: string, currentValue: any) => {
    setEditingField(fieldKey);
    setEditValue(typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue, null, 2));
  };

  const handleSaveEdit = () => {
    if (!brief || !editingField) return;
    let value: any = editValue;
    // Try to parse as JSON for structured fields
    try { value = JSON.parse(editValue); } catch { /* keep as string */ }
    updateMutation.mutate({
      briefId: brief.id,
      data: { [editingField]: typeof value === 'string' ? value : JSON.stringify(value) } as any,
    });
  };

  // Parse confidence scores
  const confidenceScores: Record<string, number> = brief?.confidenceScores
    ? tryParseJson(brief.confidenceScores) || {}
    : {};

  // Calculate overall confidence
  const confidenceValues = Object.values(confidenceScores).filter((v) => typeof v === 'number');
  const overallConfidence = confidenceValues.length > 0
    ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  // No brief yet — show upload/paste options
  if (!brief) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Campaign Brief</h3>

        {showPasteForm ? (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Paste Brief Text</h4>
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
                onClick={() => createMutation.mutate({ rawText: pasteText.trim() })}
                disabled={!pasteText.trim() || createMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Brief
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No briefs yet</h4>
            <p className="text-gray-600 mb-6">
              Upload a PDF or paste brief text to get started with AI extraction.
            </p>
            <div className="flex justify-center gap-3">
              <input ref={fileInputRef} type="file" accept=".pdf,.txt,.doc,.docx" onChange={handleFileSelect} className="hidden" />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Upload PDF
              </Button>
              <Button variant="outline" onClick={() => setShowPasteForm(true)}>
                <ClipboardPaste className="h-4 w-4 mr-2" />
                Paste Text
              </Button>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Brief exists — show extraction results + actions
  const isExtracted = brief.aiStatus === 'extracted';
  const isExtracting = brief.aiStatus === 'extracting';
  const isFailed = brief.aiStatus === 'failed';
  const isPending = brief.aiStatus === 'pending';

  return (
    <div className="space-y-6">
      {/* Brief header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Campaign Brief</h3>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">v{brief.version}</span>
          {brief.isReviewed ? (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Reviewed
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
              Pending Review
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isExtracted && !brief.isReviewed && (
            <Button
              size="sm"
              onClick={() => reviewMutation.mutate(brief.id)}
              disabled={reviewMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {reviewMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Review & Approve
            </Button>
          )}
          {isExtracted && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => reExtractMutation.mutate(brief.id)}
              disabled={reExtractMutation.isPending}
            >
              {reExtractMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Re-run Extraction
            </Button>
          )}
          {(isPending || isFailed) && (
            <Button
              size="sm"
              onClick={() => extractMutation.mutate(brief.id)}
              disabled={extractMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {extractMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Extract with AI
            </Button>
          )}
        </div>
      </div>

      {/* Low confidence notice / manual fallback (§VI) */}
      {isExtracted && overallConfidence > 0 && overallConfidence < 0.5 && (
        <Card className="p-4 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Low overall confidence ({Math.round(overallConfidence * 100)}%)</p>
              <p className="text-sm text-amber-700 mt-1">
                AI extraction confidence is low. Please review and edit fields manually before approving.
              </p>
            </div>
          </div>
        </Card>
      )}

      {isFailed && (
        <Card className="p-4 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">AI extraction unavailable</p>
              <p className="text-sm text-amber-700 mt-1">
                You can try again or fill in the fields manually.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Extracting state */}
      {isExtracting && (
        <Card className="p-8 text-center">
          <Loader2 className="h-8 w-8 text-purple-600 mx-auto mb-3 animate-spin" />
          <p className="text-gray-600">AI is extracting insights from the brief...</p>
        </Card>
      )}

      {/* Extraction results */}
      {isExtracted && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FIELD_CONFIG.map(({ key, label, icon: Icon }) => {
            const rawValue = (brief as any)[key];
            const parsedValue = tryParseJson(rawValue);
            const confidence = confidenceScores[key];
            const isEditing = editingField === key;

            return (
              <Card key={key} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">{label}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {confidence != null && (
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${getConfidenceColor(confidence)}`} />
                        <span className="text-xs text-gray-500">
                          {Math.round(confidence * 100)}%
                        </span>
                      </div>
                    )}
                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(key, parsedValue)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div>
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingField(null)}>
                        <X className="h-3.5 w-3.5 mr-1" /> Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={updateMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {parsedValue == null
                      ? <span className="text-gray-400 italic">Not extracted</span>
                      : typeof parsedValue === 'string'
                        ? parsedValue
                        : Array.isArray(parsedValue)
                          ? parsedValue.map((item: any, i: number) => (
                              <div key={i} className="flex items-start gap-1.5 mb-1">
                                <span className="text-purple-500 mt-0.5">&#8226;</span>
                                <span>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</span>
                              </div>
                            ))
                          : typeof parsedValue === 'object'
                            ? Object.entries(parsedValue).map(([k, v]) => (
                                <div key={k} className="flex gap-2 mb-1">
                                  <span className="font-medium text-gray-600 capitalize">{k}:</span>
                                  <span>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                                </div>
                              ))
                            : String(parsedValue)
                    }
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Version History Accordion */}
      {brief && (
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => setShowVersions(!showVersions)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-900">Version History</span>
            </div>
            {showVersions ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
          </button>

          {showVersions && (
            <div className="border-t border-gray-200 p-4">
              {versions.length === 0 ? (
                <p className="text-sm text-gray-500">No previous versions</p>
              ) : (
                <div className="space-y-3">
                  {versions.map((v: BriefVersion) => (
                    <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <span className="text-sm font-medium text-gray-900">Version {v.versionNumber}</span>
                        {v.changedBy && (
                          <span className="text-xs text-gray-500 ml-2">by {v.changedBy}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(v.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
