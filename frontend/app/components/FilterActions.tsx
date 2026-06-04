import { SlidersHorizontal, ChevronDown } from 'lucide-react';

interface FilterActionsProps {
  onFilterClick: () => void;
  onSortChange: (sortOrder: string) => void;
}

export function FilterActions({ onFilterClick, onSortChange: _onSortChange }: FilterActionsProps) {
  return (
    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
      <button
        onClick={onFilterClick}
        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer w-full sm:w-auto"
      >
        <SlidersHorizontal className="w-4 h-4 text-gray-500" />
        <span>Filters</span>
      </button>

      <button className="flex items-center justify-center gap-4 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap w-full sm:w-auto">
        <span>Newest First</span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
}