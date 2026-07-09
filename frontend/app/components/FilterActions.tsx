"use client";

import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";

interface FilterActionsProps {
  onFilterClick: () => void;
  onSortChange: (sortOrder: string) => void;
}

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
];

export function FilterActions({
  onFilterClick,
  onSortChange,
}: FilterActionsProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("newest");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const currentLabel =
    sortOptions.find((option) => option.value === selected)?.label ??
    "Newest First";

  const handleSelect = (value: string) => {
    setSelected(value);
    setOpen(false);
    onSortChange(value);
  };

  return (
    <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
      <button
        type="button"
        onClick={onFilterClick}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
      >
        <SlidersHorizontal className="h-4 w-4 text-gray-500" />
        <span>Filters</span>
      </button>

      <div className="relative w-full sm:w-auto" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
        >
          <span>{currentLabel}</span>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`block w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                  selected === option.value
                    ? "bg-gray-50 font-semibold text-gray-900"
                    : "text-gray-700"
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