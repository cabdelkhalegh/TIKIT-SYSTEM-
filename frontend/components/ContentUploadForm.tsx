'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@/lib/supabase';

interface ContentUploadFormProps {
  contentItemId: string;
  campaignId: string;
  currentVersion: number;
  onUploadSuccess?: () => void;
  onUploadComplete?: () => void; // Alias for compatibility
  onCancel: () => void;
}

const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  document: 25 * 1024 * 1024, // 25MB
};

const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
};

export default function ContentUploadForm({
  contentItemId,
  campaignId,
  currentVersion,
  onUploadSuccess,
  onUploadComplete,
  onCancel,
}: ContentUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const supabase = createClientComponentClient();

  const getFileCategory = (fileType: string): 'image' | 'video' | 'document' | null => {
    if (ALLOWED_FILE_TYPES.image.includes(fileType)) return 'image';
    if (ALLOWED_FILE_TYPES.video.includes(fileType)) return 'video';
    if (ALLOWED_FILE_TYPES.document.includes(fileType)) return 'document';
    return null;
  };

  const validateFile = (selectedFile: File): string | null => {
    const category = getFileCategory(selectedFile.type);
    
    if (!category) {
      return 'File type not supported. Please upload an image, video, or document.';
    }

    const maxSize = MAX_FILE_SIZES[category];
    if (selectedFile.size > maxSize) {
      return `File too large. Maximum size for ${category}s is ${Math.round(maxSize / 1024 / 1024)}MB.`;
    }

    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError('');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const newVersion = currentVersion + 1;
      const fileExt = file.name.split('.').pop();
      const fileName = `v${newVersion}_${timestamp}_${file.name}`;
      const filePath = `${campaignId}/${contentItemId}/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('content-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      setProgress(50);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('content-files')
        .getPublicUrl(filePath);

      setProgress(75);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create content version record
      const { error: versionError } = await supabase
        .from('content_versions')
        .insert({
          content_item_id: contentItemId,
          version_number: newVersion,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          description: description || null,
          uploaded_by: user.id,
        });

      if (versionError) {
        throw versionError;
      }

      setProgress(90);

      // Update content item's current version
      const { error: updateError } = await supabase
        .from('content_items')
        .update({
          current_version: newVersion,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contentItemId);

      if (updateError) {
        throw updateError;
      }

      setProgress(100);
      
      // Success
      setTimeout(() => {
        if (onUploadSuccess) onUploadSuccess();
        if (onUploadComplete) onUploadComplete();
      }, 500);
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Upload New Version (v{currentVersion + 1})
      </h3>

      {/* Drag & Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="space-y-2">
            <div className="text-4xl">📄</div>
            <p className="font-medium text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">📁</div>
            <p className="text-gray-700 font-medium">
              Drag and drop your file here
            </p>
            <p className="text-sm text-gray-500">or</p>
            <label className="inline-block">
              <input
                type="file"
                onChange={handleFileInputChange}
                className="hidden"
                accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi,.webm,.pdf,.doc,.docx,.ppt,.pptx"
              />
              <span className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors inline-block">
                Browse Files
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Supported: Images (10MB), Videos (100MB), Documents (25MB)
            </p>
          </div>
        )}
      </div>

      {/* Description Field */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Version Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what changed in this version..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          disabled={uploading}
        />
      </div>

      {/* Progress Bar */}
      {uploading && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={uploading}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload Version'}
        </button>
      </div>
    </div>
  );
}
