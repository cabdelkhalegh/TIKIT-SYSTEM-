'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  Film,
  FileCheck,
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2,
  X,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { contentService, type Content, type CreateContentRequest } from '@/services/content.service';
import { formatDate } from '@/lib/utils';

const approvalStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  internal_approved: 'bg-blue-100 text-blue-800',
  client_approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const approvalStatusLabels: Record<string, string> = {
  pending: 'Pending',
  internal_approved: 'Internal Approved',
  client_approved: 'Client Approved',
  rejected: 'Rejected',
};

const typeIcons: Record<string, any> = {
  script: FileText,
  draft: Film,
  final: FileCheck,
};

const typeLabels: Record<string, string> = {
  script: 'Script',
  draft: 'Draft',
  final: 'Final',
};

export default function CollaborationContentPage() {
  const params = useParams();
  const router = useRouter();
  const collaborationId = params.id as string;
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [feedbackContentId, setFeedbackContentId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState<'internal' | 'client'>('internal');
  const [formData, setFormData] = useState<CreateContentRequest>({
    type: 'script',
    description: '',
    collaborationId,
  });

  const { data: contentData, isLoading } = useQuery({
    queryKey: ['content', collaborationId],
    queryFn: () => contentService.getByCollaboration(collaborationId),
    enabled: !!collaborationId,
  });

  const allContent = contentData?.data || [];

  // Group content by type
  const scripts = allContent.filter((c: Content) => c.type === 'script');
  const drafts = allContent.filter((c: Content) => c.type === 'draft');
  const finals = allContent.filter((c: Content) => c.type === 'final');

  const createMutation = useMutation({
    mutationFn: (data: CreateContentRequest) => contentService.create(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', collaborationId] });
      toast.success('Content created successfully');
      setShowForm(false);
      setFormData({ type: 'script', description: '', collaborationId });
    },
    onError: () => {
      toast.error('Failed to create content');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Content> }) =>
      contentService.update(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', collaborationId] });
      toast.success('Content updated');
      setFeedbackContentId(null);
      setFeedbackText('');
    },
    onError: () => {
      toast.error('Failed to update content');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', collaborationId] });
      toast.success('Content deleted');
      setDeleteConfirmId(null);
    },
    onError: () => {
      toast.error('Failed to delete content');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type) {
      toast.error('Please select a content type');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleApproval = (contentId: string, approvalStatus: string) => {
    if (approvalStatus === 'rejected') {
      setFeedbackContentId(contentId);
      setFeedbackType('internal');
      return;
    }
    updateMutation.mutate({ id: contentId, data: { approvalStatus } as any });
  };

  const handleRejectWithFeedback = () => {
    if (!feedbackContentId) return;
    const feedbackField = feedbackType === 'internal' ? 'internalFeedback' : 'clientFeedback';
    updateMutation.mutate({
      id: feedbackContentId,
      data: {
        approvalStatus: 'rejected',
        [feedbackField]: feedbackText,
      } as any,
    });
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

  const renderContentGroup = (title: string, items: Content[], type: string) => {
    const Icon = typeIcons[type] || FileText;

    return (
      <div key={type} className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <span className="text-sm text-gray-500">({items.length})</span>
        </div>

        {items.length === 0 ? (
          <Card className="p-8 text-center">
            <Icon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No {title.toLowerCase()} content yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item: Content) => (
              <Card key={item.id} className="p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  {/* Content Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${approvalStatusColors[item.approvalStatus] || ''}`}>
                        {approvalStatusLabels[item.approvalStatus] || item.approvalStatus}
                      </span>
                      <span className="text-xs text-gray-500">v{item.version}</span>
                      <span className="text-xs text-gray-500">{formatDate(item.createdAt)}</span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-700 mt-1">{item.description}</p>
                    )}
                    {item.fileUrl && (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 mt-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View File
                      </a>
                    )}
                    {item.type === 'final' && item.livePostUrl && (
                      <a
                        href={item.livePostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 mt-1 ml-3"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Live Post
                      </a>
                    )}
                    {item.internalFeedback && (
                      <p className="text-xs text-orange-600 mt-1">Internal: {item.internalFeedback}</p>
                    )}
                    {item.clientFeedback && (
                      <p className="text-xs text-blue-600 mt-1">Client: {item.clientFeedback}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.approvalStatus === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproval(item.id, 'internal_approved')}
                          disabled={updateMutation.isPending}
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve Internal
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproval(item.id, 'rejected')}
                          disabled={updateMutation.isPending}
                          className="border-red-600 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {item.approvalStatus === 'internal_approved' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproval(item.id, 'client_approved')}
                          disabled={updateMutation.isPending}
                          className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve for Client
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproval(item.id, 'rejected')}
                          disabled={updateMutation.isPending}
                          className="border-red-600 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    {/* Live Post URL input for final content */}
                    {item.type === 'final' && item.approvalStatus === 'client_approved' && !item.livePostUrl && (
                      <div className="flex items-center gap-1">
                        <Input
                          placeholder="Live post URL..."
                          className="h-8 text-xs w-48"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const value = (e.target as HTMLInputElement).value;
                              if (value) {
                                updateMutation.mutate({ id: item.id, data: { livePostUrl: value } as any });
                              }
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Delete */}
                    {deleteConfirmId === item.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-600 hover:bg-red-50"
                          onClick={() => deleteMutation.mutate(item.id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Confirm'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => router.push(`/dashboard/collaborations/${collaborationId}`)}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Content Workflow</h1>
          </div>

          <Button onClick={() => setShowForm(!showForm)} variant="outline">
            {showForm ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                New Content
              </>
            )}
          </Button>
        </div>

        {/* Create Content Form */}
        {showForm && (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Content</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'script' | 'draft' | 'final' })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="script">Script</option>
                  <option value="draft">Draft</option>
                  <option value="final">Final</option>
                </select>
              </div>
              <div>
                <Label htmlFor="fileUrl">File URL</Label>
                <Input
                  id="fileUrl"
                  placeholder="https://..."
                  value={formData.fileUrl || ''}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Describe this content..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create Content
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Feedback Modal */}
        {feedbackContentId && (
          <Card className="p-6 mb-6 border-red-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject with Feedback</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="feedbackType">Feedback Type</Label>
                <select
                  id="feedbackType"
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value as 'internal' | 'client')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="internal">Internal Feedback</option>
                  <option value="client">Client Feedback</option>
                </select>
              </div>
              <div>
                <Label htmlFor="feedback">Feedback</Label>
                <Input
                  id="feedback"
                  placeholder="Enter feedback reason..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleRejectWithFeedback}
                  disabled={updateMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFeedbackContentId(null);
                    setFeedbackText('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Content Groups */}
        {allContent.length === 0 && !showForm ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No content yet</h3>
            <p className="text-gray-600">Create your first content item for this collaboration</p>
          </Card>
        ) : (
          <>
            {renderContentGroup('Scripts', scripts, 'script')}
            {renderContentGroup('Drafts', drafts, 'draft')}
            {renderContentGroup('Finals', finals, 'final')}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
