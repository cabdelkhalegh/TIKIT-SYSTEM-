'use client';

interface FilePreviewProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
  thumbnailUrl?: string;
}

export default function FilePreview({
  fileUrl,
  fileName,
  fileType,
  thumbnailUrl,
}: FilePreviewProps) {
  const isImage = fileType.startsWith('image/');
  const isVideo = fileType.startsWith('video/');
  const isPDF = fileType === 'application/pdf';

  if (isImage) {
    return (
      <div className="relative">
        <img
          src={thumbnailUrl || fileUrl}
          alt={fileName}
          className="w-full h-auto rounded-lg shadow-md max-h-96 object-contain bg-gray-100"
        />
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 bg-white bg-opacity-90 hover:bg-opacity-100 px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 shadow"
        >
          View Full Size
        </a>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="relative">
        <video
          controls
          className="w-full h-auto rounded-lg shadow-md max-h-96 bg-gray-900"
          poster={thumbnailUrl}
        >
          <source src={fileUrl} type={fileType} />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  if (isPDF) {
    return (
      <div className="border-2 border-gray-300 rounded-lg p-6 text-center bg-gray-50">
        <div className="text-6xl mb-4">📄</div>
        <p className="text-lg font-medium text-gray-900 mb-2">{fileName}</p>
        <p className="text-sm text-gray-600 mb-4">PDF Document</p>
        <div className="flex justify-center space-x-3">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Open PDF
          </a>
          <a
            href={fileUrl}
            download={fileName}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Download
          </a>
        </div>
      </div>
    );
  }

  // Document or other file types
  return (
    <div className="border-2 border-gray-300 rounded-lg p-6 text-center bg-gray-50">
      <div className="text-6xl mb-4">
        {fileType.includes('word') ? '📝' : fileType.includes('presentation') ? '📊' : '📎'}
      </div>
      <p className="text-lg font-medium text-gray-900 mb-2">{fileName}</p>
      <p className="text-sm text-gray-600 mb-4">
        {fileType.includes('word')
          ? 'Word Document'
          : fileType.includes('presentation')
          ? 'Presentation'
          : 'Document'}
      </p>
      <div className="flex justify-center space-x-3">
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Open
        </a>
        <a
          href={fileUrl}
          download={fileName}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Download
        </a>
      </div>
    </div>
  );
}
