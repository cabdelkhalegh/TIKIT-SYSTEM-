'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { AlertTriangle, Shield, ShieldCheck } from 'lucide-react';

interface RiskBreakdownItem {
  field: string;
  points: number;
  reason: string;
}

interface RiskBadgeProps {
  score: number;
  level: 'low' | 'medium' | 'high';
  showScore?: boolean;
  showBreakdown?: boolean;
  breakdown?: RiskBreakdownItem[];
}

const levelConfig = {
  low: {
    icon: ShieldCheck,
    label: 'Low Risk',
    className: 'bg-green-100 text-green-800 border-green-200',
    dotColor: 'bg-green-500',
  },
  medium: {
    icon: Shield,
    label: 'Medium Risk',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    dotColor: 'bg-amber-500',
  },
  high: {
    icon: AlertTriangle,
    label: 'High Risk',
    className: 'bg-red-100 text-red-800 border-red-200',
    dotColor: 'bg-red-500',
  },
};

export default function RiskBadge({
  score,
  level,
  showScore = false,
  showBreakdown = false,
  breakdown = [],
}: RiskBadgeProps) {
  const [expanded, setExpanded] = useState(false);
  const config = levelConfig[level] || levelConfig.low;
  const Icon = config.icon;

  return (
    <div className="inline-flex flex-col">
      <button
        onClick={() => showBreakdown && setExpanded(!expanded)}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
          config.className,
          showBreakdown && breakdown.length > 0 && 'cursor-pointer hover:opacity-80'
        )}
      >
        <Icon className="h-3 w-3" />
        {config.label}
        {showScore && <span className="font-bold">({score})</span>}
      </button>

      {expanded && breakdown.length > 0 && (
        <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm text-xs space-y-1.5 min-w-[200px]">
          <div className="font-semibold text-gray-700 mb-2">Risk Breakdown</div>
          {breakdown.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2">
              <span className="text-gray-600">{item.reason}</span>
              <span className="font-medium text-gray-900 whitespace-nowrap">+{item.points}</span>
            </div>
          ))}
          <div className="border-t pt-1.5 mt-1.5 flex items-center justify-between font-semibold">
            <span className="text-gray-700">Total</span>
            <span className="text-gray-900">{score}</span>
          </div>
        </div>
      )}
    </div>
  );
}
