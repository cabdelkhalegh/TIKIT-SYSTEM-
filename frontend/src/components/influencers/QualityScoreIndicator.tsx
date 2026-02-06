import { cn } from '@/lib/utils';

interface QualityScoreIndicatorProps {
  score: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function QualityScoreIndicator({ 
  score, 
  className, 
  showLabel = true,
  size = 'md' 
}: QualityScoreIndicatorProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Fair';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn(
        'inline-flex items-center rounded-full font-semibold',
        getScoreColor(score),
        sizeClasses[size]
      )}>
        {score}/100
      </span>
      {showLabel && (
        <span className="text-sm text-gray-600">
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  );
}
