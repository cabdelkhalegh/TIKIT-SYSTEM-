'use client';

import { X } from 'lucide-react';
import type { Media } from '@/types/media.types';
import { getMediaType } from '@/types/media.types';

interface MediaPreviewProps {
  media: Media;
  onClose: () => void;
}

export default function MediaPreview({ media, onClose }: MediaPreviewProps) {
  const mediaType = getMediaType(media.mimeType);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-6xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="bg-white rounded-lg overflow-hidden">
          {mediaType === 'image' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media.url} alt={media.originalName} className="w-full h-auto max-h-[80vh] object-contain" />
          )}
          {mediaType === 'video' && (
            <video src={media.url} controls className="w-full h-auto max-h-[80vh]">
              Your browser does not support the video tag.
            </video>
          )}
          {mediaType === 'document' && (
            <div className="p-8 text-center">
              <p className="text-gray-900 font-medium mb-4">{media.originalName}</p>
              <a
                href={media.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Open Document
              </a>
            </div>
          )}
        </div>

        <div className="mt-4 bg-white rounded-lg p-4">
          <h3 className="font-medium text-gray-900">{media.originalName}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {media.mimeType} • {(media.size / 1024).toFixed(1)} KB
          </p>
        </div>
      </div>
    </div>
  );
}
