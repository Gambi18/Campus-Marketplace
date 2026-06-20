"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchInput } from "./SearchInput";
import { FilterActions } from "./FilterActions";

function Toolbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = searchQuery.trim();

    if (!q) {
      router.push("/", { scroll: false });
      return;
    }

    router.push(`/?q=${encodeURIComponent(q)}`, { scroll: false });
  };

  const handleFilterOpen = () => {
    // keep this for later if you add a real filter modal
  };

  return (
    <div className="w-full my-2">
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <form onSubmit={handleSubmit} className="w-full">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </form>

        <FilterActions
          onFilterClick={handleFilterOpen}
          onSortChange={() => {}}
        />
      </div>
    </div>
  );
}

export default Toolbar;