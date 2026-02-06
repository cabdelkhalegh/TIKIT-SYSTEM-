import { formatDistanceToNow } from 'date-fns';
import { FileText, Image as ImageIcon, Video, Download, Trash2 } from 'lucide-react';
import type { Media } from '@/types/media.types';
import { getMediaType } from '@/types/media.types';

interface MediaCardProps {
  media: Media;
  onDelete?: (id: string) => void;
  onDownload?: (media: Media) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const typeIcons = {
  image: ImageIcon,
  video: Video,
  document: FileText,
};

export default function MediaCard({ media, onDelete, onDownload }: MediaCardProps) {
  const mediaType = getMediaType(media.mimeType);
  const Icon = typeIcons[mediaType];

  return (
    <div className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Preview */}
      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
        {mediaType === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.url} alt={media.originalName} className="w-full h-full object-cover" />
        ) : (
          <Icon className="h-16 w-16 text-gray-400" />
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-900 truncate" title={media.originalName}>
          {media.originalName}
        </h3>
        <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
          <span>{formatFileSize(media.size)}</span>
          <span>{formatDistanceToNow(new Date(media.uploadedAt), { addSuffix: true })}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onDownload && (
          <button
            onClick={() => onDownload(media)}
            className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            title="Download"
          >
            <Download className="h-4 w-4 text-gray-700" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(media.id)}
            className="p-2 bg-white rounded-lg shadow-sm hover:bg-red-50 text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
