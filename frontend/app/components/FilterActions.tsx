"use client";

import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";

export interface FilterValues {
  condition: string;
  minPrice: string;
  maxPrice: string;
}

interface FilterActionsProps {
  sort: string;
  condition: string;
  minPrice: string;
  maxPrice: string;
  onSortChange: (sortOrder: string) => void;
  onApplyFilters: (filters: FilterValues) => void;
}

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
];

const conditionOptions = [
  { value: "", label: "Any condition" },
  { value: "brand_new", label: "Brand New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export function FilterActions({
  sort,
  condition,
  minPrice,
  maxPrice,
  onSortChange,
  onApplyFilters,
}: FilterActionsProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Draft state for the filter popover — applied to the URL only on "Apply".
  const [draftCondition, setDraftCondition] = useState(condition);
  const [draftMin, setDraftMin] = useState(minPrice);
  const [draftMax, setDraftMax] = useState(maxPrice);

  // Re-sync drafts whenever the applied (URL) values change.
  useEffect(() => {
    setDraftCondition(condition);
    setDraftMin(minPrice);
    setDraftMax(maxPrice);
  }, [condition, minPrice, maxPrice]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) setSortOpen(false);
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentSortLabel =
    sortOptions.find((o) => o.value === sort)?.label ?? "Newest First";
  const activeFilterCount =
    (condition ? 1 : 0) + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0);

  const applyDraft = () => {
    onApplyFilters({ condition: draftCondition, minPrice: draftMin, maxPrice: draftMax });
    setFilterOpen(false);
  };

  const clearDraft = () => {
    setDraftCondition("");
    setDraftMin("");
    setDraftMax("");
    onApplyFilters({ condition: "", minPrice: "", maxPrice: "" });
    setFilterOpen(false);
  };

  return (
    <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
      {/* Filters */}
      <div className="relative w-full sm:w-auto" ref={filterRef}>
        <button
          type="button"
          onClick={() => setFilterOpen((prev) => !prev)}
          aria-expanded={filterOpen}
          aria-haspopup="dialog"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer sm:w-auto"
        >
          <SlidersHorizontal className="h-4 w-4 text-gray-500" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-primary text-white text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {filterOpen && (
          <div
            role="dialog"
            aria-label="Filter products"
            className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg text-left"
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="filter-condition" className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Condition
                </label>
                <select
                  id="filter-condition"
                  value={draftCondition}
                  onChange={(e) => setDraftCondition(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-base md:text-sm text-gray-700 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {conditionOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-600 mb-1.5">Price range (XAF)</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="Min"
                    aria-label="Minimum price"
                    value={draftMin}
                    onChange={(e) => setDraftMin(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base md:text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <span className="text-gray-400">–</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="Max"
                    aria-label="Maximum price"
                    value={draftMax}
                    onChange={(e) => setDraftMax(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base md:text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={clearDraft}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={applyDraft}
                  className="flex-1 rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sort */}
      <div className="relative w-full sm:w-auto" ref={sortRef}>
        <button
          type="button"
          onClick={() => setSortOpen((prev) => !prev)}
          aria-expanded={sortOpen}
          aria-haspopup="listbox"
          className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer sm:w-auto"
        >
          <span>{currentSortLabel}</span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
        </button>

        {sortOpen && (
          <div role="listbox" className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={sort === option.value}
                onClick={() => {
                  onSortChange(option.value);
                  setSortOpen(false);
                }}
                className={`block w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 cursor-pointer ${
                  sort === option.value ? "bg-gray-50 font-semibold text-gray-900" : "text-gray-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
