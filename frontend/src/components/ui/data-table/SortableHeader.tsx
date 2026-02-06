'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

interface SortableHeaderProps {
  label: string;
  field: string;
  currentSortField?: string;
  currentSortDirection?: 'asc' | 'desc';
  onSort: (field: string) => void;
  className?: string;
}

export function SortableHeader({
  label,
  field,
  currentSortField,
  currentSortDirection,
  onSort,
  className = '',
}: SortableHeaderProps) {
  const isActive = currentSortField === field;

  const getSortIcon = () => {
    if (!isActive) {
      return <ArrowUpDown className="h-4 w-4 ml-2 text-gray-400" />;
    }
    return currentSortDirection === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-2 text-purple-600" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-2 text-purple-600" />
    );
  };

  return (
    <th
      onClick={() => onSort(field)}
      className={`cursor-pointer hover:bg-gray-50 select-none transition-colors ${className}`}
    >
      <div className="flex items-center justify-start">
        <span className={isActive ? 'text-purple-600 font-semibold' : ''}>{label}</span>
        {getSortIcon()}
      </div>
    </th>
  );
}
