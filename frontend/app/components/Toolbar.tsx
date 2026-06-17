"use client"
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SearchInput } from './SearchInput';
import { FilterActions } from './FilterActions';

function Toolbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }, [router, searchQuery]);

  const handleFilterOpen = () => {
    console.log("Open filter drawer/modal");
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        
        <div onKeyDown={handleKeyDown} className="w-full">
          <SearchInput value={searchQuery} onChange={handleSearch} />
        </div>
        
        <FilterActions onFilterClick={handleFilterOpen} onSortChange={() => {}} />

      </div>
    </div>
  );
}

export default Toolbar;
