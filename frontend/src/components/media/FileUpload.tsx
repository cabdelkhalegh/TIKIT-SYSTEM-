'use client';

import { useState, useCallback } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UploadProgress } from '@/types/media.types';
import { ALL_ALLOWED_TYPES, MAX_FILE_SIZE } from '@/types/media.types';

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  maxFiles?: number;
  accept?: string;
}

export default function FileUpload({ onUpload, maxFiles = 5, accept }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (!ALL_ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large (max 10MB)`);
        continue;
      }
      valid.push(file);
    }

    if (valid.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      return { valid: valid.slice(0, maxFiles), errors };
    }

    return { valid, errors };
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const { valid, errors } = validateFiles(fileArray);

    if (errors.length > 0) {
      errors.forEach((error) => {
        setUploads((prev) => [
          ...prev,
          { filename: error, progress: 0, status: 'error', error },
        ]);
      });
    }

    if (valid.length > 0) {
      // Initialize upload progress
      const initialProgress: UploadProgress[] = valid.map((file) => ({
        filename: file.name,
        progress: 0,
        status: 'pending',
      }));
      setUploads((prev) => [...prev, ...initialProgress]);

      try {
        await onUpload(valid);
        
        // Mark as success
        setUploads((prev) =>
          prev.map((upload) =>
            valid.some((f) => f.name === upload.filename)
              ? { ...upload, progress: 100, status: 'success' }
              : upload
          )
        );

        // Clear after delay
        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.status !== 'success'));
        }, 3000);
      } catch (error) {
        // Mark as error
        setUploads((prev) =>
          prev.map((upload) =>
            valid.some((f) => f.name === upload.filename)
              ? { ...upload, status: 'error', error: 'Upload failed' }
              : upload
          )
        );
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeUpload = (filename: string) => {
    setUploads((prev) => prev.filter((u) => u.filename !== filename));
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          type="file"
          multiple
          onChange={handleChange}
          accept={accept || ALL_ALLOWED_TYPES.join(',')}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <Upload className={`mx-auto h-12 w-12 mb-4 ${dragActive ? 'text-purple-600' : 'text-gray-400'}`} />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {dragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-gray-600 mb-4">or click to browse</p>
        <p className="text-xs text-gray-500">
          Supports images, PDFs, videos • Max {maxFiles} files • 10MB per file
        </p>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploads.map((upload, index) => (
            <div
              key={`${upload.filename}-${index}`}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{upload.filename}</p>
                {upload.status === 'uploading' && (
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-purple-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
                {upload.error && (
                  <p className="text-xs text-red-600 mt-1">{upload.error}</p>
                )}
              </div>

              <div className="flex-shrink-0">
                {upload.status === 'success' && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                {upload.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                {(upload.status === 'success' || upload.status === 'error') && (
                  <button
                    onClick={() => removeUpload(upload.filename)}
                    className="ml-2 p-1 hover:bg-gray-200 rounded"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
