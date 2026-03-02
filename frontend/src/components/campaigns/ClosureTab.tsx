'use client';

// T113: ClosureTab — 5-section checklist, CX survey, post-mortem, AI learnings, close campaign button
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle, Circle, Lock, Loader2, Brain, FileText, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import CXSurveyCard from '@/components/closure/CXSurveyCard';
import PostMortemCard from '@/components/closure/PostMortemCard';
import { closureService, type CXSurveyData, type PostMortemData, type AILearnings } from '@/services/closure.service';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { toast } from 'sonner';

interface ClosureTabProps {
  campaignId: string;
  campaign: any;
}

export default function ClosureTab({ campaignId, campaign }: ClosureTabProps) {
  const queryClient = useQueryClient();
  const { isDirector, isCampaignManager } = useRoleAccess();
  const [aiLearnings, setAiLearnings] = useState<AILearnings | null>(null);

  // ─── Queries ──────────────────────────────────────────────────────────────
  const { data: closureData, isLoading } = useQuery({
    queryKey: ['campaign-closure', campaignId],
    queryFn: () => closureService.getClosureStatus(campaignId),
    staleTime: 10000,
  });

  const closure = closureData?.data;
  const checklist = closure?.checklist;

  // ─── Mutations ────────────────────────────────────────────────────────────
  const cxSurveyMutation = useMutation({
    mutationFn: (data: CXSurveyData) => closureService.saveCXSurvey(campaignId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-closure', campaignId] });
      toast.success('CX Survey saved');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save CX survey');
    },
  });

  const postMortemMutation = useMutation({
    mutationFn: (data: PostMortemData) => closureService.savePostMortem(campaignId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-closure', campaignId] });
      toast.success('Post-mortem saved');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save post-mortem');
    },
  });

  const aiLearningsMutation = useMutation({
    mutationFn: () => closureService.generateLearnings(campaignId),
    onSuccess: (result) => {
      setAiLearnings(result.data);
      queryClient.invalidateQueries({ queryKey: ['campaign-closure', campaignId] });
      toast.success('AI learnings generated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to generate AI learnings');
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => closureService.closeCampaign(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-closure', campaignId] });
      toast.success('Campaign closed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to close campaign');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (campaign.status === 'closed') {
    return (
      <Card className="p-8 text-center">
        <Lock className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Campaign Closed</h3>
        <p className="text-gray-600">
          This campaign was closed on{' '}
          {campaign.closedAt
            ? new Date(campaign.closedAt).toLocaleDateString()
            : 'a previous date'}
          . All data is now immutable.
        </p>
      </Card>
    );
  }

  const CHECKLIST_ITEMS = [
    { key: 'reportApproved', label: 'Report Approved', done: checklist?.reportApproved },
    { key: 'allInvoicesSettled', label: 'All Invoices Paid', done: checklist?.allInvoicesSettled },
    { key: 'cxSurveyCompleted', label: 'CX Survey Completed', done: checklist?.cxSurveyCompleted },
    { key: 'postMortemCompleted', label: 'Post-Mortem Completed', done: checklist?.postMortemCompleted },
    { key: 'aiLearningsGenerated', label: 'AI Learnings Generated', done: checklist?.aiLearningsGenerated },
  ];

  return (
    <div className="space-y-6">
      {/* Closure Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Closure Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {CHECKLIST_ITEMS.map((item) => (
              <div key={item.key} className="flex items-center gap-3">
                {item.done ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    item.done ? 'text-green-700 font-medium' : 'text-gray-600'
                  }`}
                >
                  {item.label}
                </span>
                {item.done && (
                  <Badge className="bg-green-100 text-green-800 text-xs">Done</Badge>
                )}
              </div>
            ))}
          </div>

          {closure?.unmetRequirements && closure.unmetRequirements.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Remaining Requirements:</p>
                  <ul className="text-xs text-amber-700 mt-1 space-y-0.5">
                    {closure.unmetRequirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CX Survey */}
      <CXSurveyCard
        onSave={(data) => cxSurveyMutation.mutate(data)}
        isSaving={cxSurveyMutation.isPending}
        isCompleted={!!checklist?.cxSurveyCompleted}
      />

      {/* Post-Mortem */}
      <PostMortemCard
        onSave={(data) => postMortemMutation.mutate(data)}
        isSaving={postMortemMutation.isPending}
        isCompleted={!!checklist?.postMortemCompleted}
      />

      {/* AI Learnings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Campaign Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checklist?.aiLearningsGenerated || aiLearnings ? (
            <div className="space-y-4">
              {aiLearnings && (
                <>
                  {aiLearnings.learnings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Key Learnings</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                        {aiLearnings.learnings.map((l, i) => (
                          <li key={i}>{l}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {aiLearnings.bestPractices.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Best Practices</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                        {aiLearnings.bestPractices.map((bp, i) => (
                          <li key={i}>{bp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {aiLearnings.intelligenceDocument && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        Intelligence Document
                      </h4>
                      <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                        {aiLearnings.intelligenceDocument}
                      </div>
                    </div>
                  )}
                </>
              )}
              {!aiLearnings && (
                <p className="text-sm text-green-700">AI learnings have been generated.</p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-3">
                {checklist?.cxSurveyCompleted && checklist?.postMortemCompleted
                  ? 'CX survey and post-mortem are complete. Generate AI learnings.'
                  : 'Complete the CX survey and post-mortem first to generate AI learnings.'}
              </p>
              <Button
                onClick={() => aiLearningsMutation.mutate()}
                disabled={
                  !checklist?.cxSurveyCompleted ||
                  !checklist?.postMortemCompleted ||
                  aiLearningsMutation.isPending
                }
              >
                {aiLearningsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-1.5" />
                )}
                Generate AI Learnings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Close Campaign Button */}
      {(isDirector || isCampaignManager) && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Close Campaign</h4>
                <p className="text-xs text-gray-500">
                  This action is irreversible. All campaign data becomes immutable.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => closeMutation.mutate()}
                disabled={!closure?.canClose || closeMutation.isPending}
              >
                {closeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4 mr-1.5" />
                )}
                Close Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
