'use client';

import { Button } from '@/components/ui/button';
import { X, Filter as FilterIcon } from 'lucide-react';

interface FilterTag {
  key: string;
  label: string;
  value: string;
}

interface FilterBarProps {
  filters: FilterTag[];
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
}

export function FilterBar({ filters, onRemoveFilter, onClearAll }: FilterBarProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap py-2">
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <FilterIcon className="h-4 w-4" />
        <span>Active filters:</span>
      </div>
      {filters.map((filter) => (
        <div
          key={filter.key}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
        >
          <span className="font-medium">{filter.label}:</span>
          <span>{filter.value}</span>
          <button
            onClick={() => onRemoveFilter(filter.key)}
            className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-7 text-xs text-gray-600 hover:text-gray-900"
      >
        Clear all
      </Button>
    </div>
  );
}
