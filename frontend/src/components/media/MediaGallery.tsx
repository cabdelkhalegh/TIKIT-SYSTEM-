'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Image as ImageIcon, FileText, Video, FolderOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import MediaCard from './MediaCard';
import MediaPreview from './MediaPreview';
import type { Media, MediaType } from '@/types/media.types';
import { getMediaType } from '@/types/media.types';

interface MediaGalleryProps {
  files: Media[];
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

const typeFilters: { label: string; value: MediaType | 'all'; icon: any }[] = [
  { label: 'All', value: 'all', icon: FolderOpen },
  { label: 'Images', value: 'image', icon: ImageIcon },
  { label: 'Documents', value: 'document', icon: FileText },
  { label: 'Videos', value: 'video', icon: Video },
];

export default function MediaGallery({ files, onDelete, isLoading }: MediaGalleryProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<MediaType | 'all'>('all');
  const [previewMedia, setPreviewMedia] = useState<Media | null>(null);

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.originalName.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || getMediaType(file.mimeType) === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDownload = (media: Media) => {
    window.open(media.url, '_blank');
  };

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {typeFilters.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.value}
                  onClick={() => setTypeFilter(filter.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    typeFilter === filter.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{filter.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredFiles.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredFiles.map((file) => (
              <div key={file.id} onClick={() => setPreviewMedia(file)} className="cursor-pointer">
                <MediaCard media={file} onDelete={onDelete} onDownload={handleDownload} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
            <p className="text-gray-600">
              {search || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Upload some files to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewMedia && (
        <MediaPreview media={previewMedia} onClose={() => setPreviewMedia(null)} />
      )}
    </>
  );
}
