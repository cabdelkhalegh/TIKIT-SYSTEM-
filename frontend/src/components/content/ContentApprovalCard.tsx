'use client';

import { useState } from 'react';
import {
  CheckCircle, XCircle, Clock, FileText, Film, Video, Send,
  AlertTriangle, Lock, Unlock, ExternalLink, MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogTrigger, DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// ─── Props ───────────────────────────────────────────────────────────────────

interface ContentApprovalCardProps {
  content: any;
  onApproveInternal: () => void;
  onApproveClient: () => void;
  onRequestChanges: (feedback: string) => void;
  onSubmitLiveUrl: (url: string) => void;
  onRequestException?: (exceptionType: string, evidence: string) => void;
  userRole: string;
  isLoading?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const APPROVAL_STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  internal_approved: { label: 'Internal Approved', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  client_approved: { label: 'Client Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  changes_requested: { label: 'Changes Requested', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const CONTENT_TYPE_ICONS: Record<string, any> = {
  script: FileText,
  draft: Film,
  video_draft: Film,
  final: Video,
};

const EXCEPTION_TYPES = [
  { value: 'urgent_posting', label: 'Urgent Posting' },
  { value: 'client_timeout', label: 'Client Timeout' },
  { value: 'verbal_approval', label: 'Verbal Approval' },
];

const STAGES = ['script', 'draft', 'final', 'live'];

function getStageIndex(content: any): number {
  if (content.livePostUrl) return 3;
  if (content.type === 'final') return 2;
  if (content.type === 'draft' || content.type === 'video_draft') return 1;
  return 0;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ContentApprovalCard({
  content,
  onApproveInternal,
  onApproveClient,
  onRequestChanges,
  onSubmitLiveUrl,
  onRequestException,
  userRole,
  isLoading = false,
}: ContentApprovalCardProps) {
  const [feedbackText, setFeedbackText] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [exceptionType, setExceptionType] = useState('urgent_posting');
  const [exceptionEvidence, setExceptionEvidence] = useState('');
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [showLiveUrlDialog, setShowLiveUrlDialog] = useState(false);
  const [showExceptionDialog, setShowExceptionDialog] = useState(false);

  const statusConfig = APPROVAL_STATUS_CONFIG[content.approvalStatus] || APPROVAL_STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const TypeIcon = CONTENT_TYPE_ICONS[content.type] || FileText;
  const currentStage = getStageIndex(content);

  const canApproveInternal = ['director', 'campaign_manager'].includes(userRole) &&
    (content.approvalStatus === 'pending' || content.approvalStatus === 'changes_requested');
  const canApproveClient = ['director', 'campaign_manager', 'client'].includes(userRole) &&
    content.approvalStatus === 'internal_approved';
  const canRequestChanges = ['director', 'campaign_manager', 'client'].includes(userRole) &&
    content.approvalStatus !== 'client_approved';
  const canSubmitLiveUrl = ['director', 'campaign_manager', 'influencer'].includes(userRole) &&
    !content.postingBlocked && !content.livePostUrl;
  const canRequestException = userRole === 'director' && content.postingBlocked;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TypeIcon className="h-4 w-4 text-gray-500" />
            <CardTitle className="text-sm font-medium capitalize">
              {content.type?.replace('_', ' ')} — v{content.version || content.versionNumber || 1}
            </CardTitle>
          </div>
          <Badge className={`${statusConfig.color} text-xs`}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
        {content.fileName && (
          <p className="text-xs text-gray-500 mt-1">{content.fileName}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Two-stage flow visualization */}
        <div className="flex items-center gap-1">
          {STAGES.map((stage, idx) => (
            <div key={stage} className="flex items-center gap-1 flex-1">
              <div
                className={`h-2 flex-1 rounded-full ${
                  idx <= currentStage ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
              {idx < STAGES.length - 1 && (
                <div className="w-1" />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-gray-500">
          {STAGES.map((s) => (
            <span key={s} className="capitalize">{s}</span>
          ))}
        </div>

        {/* Gate indicators */}
        <div className="flex gap-3 text-xs">
          <div className="flex items-center gap-1">
            {content.filmingBlocked ? (
              <Lock className="h-3 w-3 text-red-500" />
            ) : (
              <Unlock className="h-3 w-3 text-green-500" />
            )}
            <span>Filming</span>
          </div>
          <div className="flex items-center gap-1">
            {content.postingBlocked ? (
              <Lock className="h-3 w-3 text-red-500" />
            ) : (
              <Unlock className="h-3 w-3 text-green-500" />
            )}
            <span>Posting</span>
          </div>
        </div>

        {/* Feedback display */}
        {content.approvalStatus === 'changes_requested' && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs">
            <div className="flex items-center gap-1 font-medium text-red-700 mb-1">
              <MessageSquare className="h-3 w-3" /> Feedback
            </div>
            {content.internalFeedback && (
              <p className="text-red-600"><span className="font-medium">Internal:</span> {content.internalFeedback}</p>
            )}
            {content.clientFeedback && (
              <p className="text-red-600 mt-1"><span className="font-medium">Client:</span> {content.clientFeedback}</p>
            )}
          </div>
        )}

        {/* Exception info */}
        {content.exceptionType && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs">
            <div className="flex items-center gap-1 font-medium text-amber-700 mb-1">
              <AlertTriangle className="h-3 w-3" /> Exception: {content.exceptionType.replace('_', ' ')}
            </div>
            {content.exceptionEvidence && (
              <p className="text-amber-600">{content.exceptionEvidence}</p>
            )}
          </div>
        )}

        {/* Live post URL */}
        {content.livePostUrl && (
          <a
            href={content.livePostUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> View Live Post
          </a>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {canApproveInternal && (
            <Button size="sm" variant="outline" onClick={onApproveInternal} disabled={isLoading}>
              <CheckCircle className="mr-1 h-3 w-3" /> Approve Internal
            </Button>
          )}

          {canApproveClient && (
            <Button size="sm" variant="outline" onClick={onApproveClient} disabled={isLoading}
              className="border-green-300 text-green-700 hover:bg-green-50">
              <CheckCircle className="mr-1 h-3 w-3" /> Approve Client
            </Button>
          )}

          {canRequestChanges && (
            <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                  <XCircle className="mr-1 h-3 w-3" /> Request Changes
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Changes</DialogTitle>
                </DialogHeader>
                <Textarea
                  placeholder="Describe the required changes..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={4}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    disabled={!feedbackText.trim() || isLoading}
                    onClick={() => {
                      onRequestChanges(feedbackText.trim());
                      setFeedbackText('');
                      setShowFeedbackDialog(false);
                    }}
                  >
                    Submit Feedback
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {canSubmitLiveUrl && (
            <Dialog open={showLiveUrlDialog} onOpenChange={setShowLiveUrlDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                  <Send className="mr-1 h-3 w-3" /> Submit Live URL
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Live Post URL</DialogTitle>
                </DialogHeader>
                <Input
                  placeholder="https://instagram.com/p/..."
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    disabled={!liveUrl.trim() || isLoading}
                    onClick={() => {
                      onSubmitLiveUrl(liveUrl.trim());
                      setLiveUrl('');
                      setShowLiveUrlDialog(false);
                    }}
                  >
                    Submit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {canRequestException && onRequestException && (
            <Dialog open={showExceptionDialog} onOpenChange={setShowExceptionDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                  <AlertTriangle className="mr-1 h-3 w-3" /> Exception
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Exception</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Exception Type</label>
                    <select
                      className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
                      value={exceptionType}
                      onChange={(e) => setExceptionType(e.target.value)}
                    >
                      {EXCEPTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Evidence / Justification</label>
                    <Textarea
                      placeholder="Provide evidence or justification..."
                      value={exceptionEvidence}
                      onChange={(e) => setExceptionEvidence(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    disabled={!exceptionEvidence.trim() || isLoading}
                    onClick={() => {
                      onRequestException(exceptionType, exceptionEvidence.trim());
                      setExceptionEvidence('');
                      setShowExceptionDialog(false);
                    }}
                  >
                    Submit Exception
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
