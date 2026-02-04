'use client';

interface MetricsCardProps {
  title: string;
  value: number | string;
  format?: 'number' | 'percentage' | 'currency';
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'red' | 'purple';
  subtitle?: string;
}

export default function MetricsCard({
  title,
  value,
  format = 'number',
  icon,
  trend,
  color = 'blue',
  subtitle
}: MetricsCardProps) {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    
    if (format === 'percentage') {
      return `${val.toFixed(2)}%`;
    }
    
    if (format === 'currency') {
      return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    // Number formatting with K, M suffixes
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`;
    }
    return val.toLocaleString();
  };

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-2">{formatValue(value)}</p>
          {subtitle && (
            <p className="text-xs mt-1 opacity-60">{subtitle}</p>
          )}
        </div>
        
        {(icon || trend) && (
          <div className="text-2xl opacity-60">
            {icon || (trend && trendIcons[trend])}
          </div>
        )}
      </div>
      
      {trend && (
        <div className="mt-3">
          <span className={`text-xs px-2 py-1 rounded ${
            trend === 'up' ? 'bg-green-100 text-green-800' :
            trend === 'down' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {trend === 'up' ? '↑ Trending up' : 
             trend === 'down' ? '↓ Trending down' : 
             '→ Stable'}
          </span>
        </div>
      )}
    </div>
  );
}
