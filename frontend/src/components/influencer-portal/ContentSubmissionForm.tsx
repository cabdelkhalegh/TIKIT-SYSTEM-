'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Loader2, FileUp, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { influencerPortalService } from '@/services/influencer-portal.service';

const CONTENT_TYPES = [
  { value: 'script', label: 'Script' },
  { value: 'draft', label: 'Draft' },
  { value: 'video_draft', label: 'Video Draft' },
  { value: 'final', label: 'Final' },
];

interface ContentSubmissionFormProps {
  campaignId: string;
  briefAccepted: boolean;
}

export default function ContentSubmissionForm({ campaignId, briefAccepted }: ContentSubmissionFormProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState('script');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const submitMutation = useMutation({
    mutationFn: () => {
      if (!selectedFile) throw new Error('No file selected');
      return influencerPortalService.submitContent(campaignId, selectedFile, selectedType);
    },
    onSuccess: () => {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['influencer-portal'] });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  if (!briefAccepted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4 text-purple-600" />
            Submit Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">You must accept the brief before submitting content.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="h-4 w-4 text-purple-600" />
          Submit Content
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Content Type Selector */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">
            Content Type
          </label>
          <div className="flex flex-wrap gap-2">
            {CONTENT_TYPES.map((ct) => (
              <button
                key={ct.value}
                onClick={() => setSelectedType(ct.value)}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  selectedType === ct.value
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                }`}
              >
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">
            File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />
          {selectedFile ? (
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md">
              <div className="flex items-center gap-2 min-w-0">
                <FileUp className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <span className="text-sm text-gray-900 truncate">{selectedFile.name}</span>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-gray-400 hover:text-red-500 ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-purple-400 transition-colors"
            >
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click to select a file</p>
              <p className="text-xs text-gray-400 mt-1">Max file size: 1 GB</p>
            </button>
          )}
        </div>

        {/* Submit Button */}
        <Button
          onClick={() => submitMutation.mutate()}
          disabled={!selectedFile || submitMutation.isPending}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {submitMutation.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
          ) : (
            <><Upload className="h-4 w-4 mr-2" /> Submit {CONTENT_TYPES.find(t => t.value === selectedType)?.label}</>
          )}
        </Button>

        {submitMutation.isError && (
          <p className="text-sm text-red-600">
            {(submitMutation.error as any)?.response?.data?.error || 'Failed to submit content'}
          </p>
        )}

        {submitMutation.isSuccess && (
          <p className="text-sm text-green-600">Content submitted successfully!</p>
        )}
      </CardContent>
    </Card>
  );
}
