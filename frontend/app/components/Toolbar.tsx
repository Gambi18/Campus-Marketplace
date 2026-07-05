"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SearchInput } from "./SearchInput";
import { FilterActions } from "./FilterActions";

function Toolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");

  // Merge param changes into the current URL, preserving everything else.
  // A null/empty value removes that param. Scroll is preserved so the grid
  // refreshes in place. This is what makes sort + filters shareable via URL.
  const updateParams = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value == null || value === "") params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateParams({ q: searchQuery.trim() || null });
  };

  return (
    <div className="w-full my-2">
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <form onSubmit={handleSubmit} autoComplete="off" className="w-full">
          <SearchInput value={searchQuery} onChange={setSearchQuery} />
        </form>

        <FilterActions
          sort={searchParams.get("sort") ?? "newest"}
          condition={searchParams.get("condition") ?? ""}
          minPrice={searchParams.get("min_price") ?? ""}
          maxPrice={searchParams.get("max_price") ?? ""}
          onSortChange={(value) =>
            updateParams({ sort: value === "newest" ? null : value })
          }
          onApplyFilters={(f) =>
            updateParams({
              condition: f.condition || null,
              min_price: f.minPrice || null,
              max_price: f.maxPrice || null,
            })
          }
        />
      </div>
    </div>
  );
}

export default Toolbar;
