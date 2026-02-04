'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@/lib/supabase';
import { ContentVersion } from '@/types';

interface VersionHistoryProps {
  contentItemId: string;
  onClose: () => void;
}

export default function VersionHistory({ contentItemId, onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchVersions();
  }, [contentItemId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_versions')
        .select(`
          *,
          uploader:uploaded_by(
            id,
            email
          )
        `)
        .eq('content_item_id', contentItemId)
        .order('version_number', { ascending: false });

      if (error) throw error;

      setVersions(data || []);
    } catch (err: any) {
      console.error('Error fetching versions:', err);
      setError('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (fileType: string | null): string => {
    if (!fileType) return '📎';
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('presentation')) return '📊';
    return '📎';
  };

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading version history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Version History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {versions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📂</div>
              <p className="text-gray-500">No versions uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className={`border rounded-lg p-4 ${
                    index === 0
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="text-3xl">{getFileIcon(version.file_type)}</div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Version {version.version_number}
                          </h3>
                          {index === 0 && (
                            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          {version.file_name}
                        </p>
                        
                        {version.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {version.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                          <span>📏 {formatFileSize(version.file_size)}</span>
                          <span>📅 {formatDate(version.created_at)}</span>
                          {version.uploader && (
                            <span>👤 {(version.uploader as any).email}</span>
                          )}
                        </div>

                        {version.thumbnail_url && (
                          <div className="mt-3">
                            <img
                              src={version.thumbnail_url}
                              alt={`Version ${version.version_number} thumbnail`}
                              className="max-w-xs rounded border border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => window.open(version.file_url, '_blank')}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(version.file_url, version.file_name)}
                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>{versions.length} version{versions.length !== 1 ? 's' : ''} total</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
