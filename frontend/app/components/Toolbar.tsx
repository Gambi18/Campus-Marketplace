"use client"
import { useState } from 'react';
import { SearchInput } from './SearchInput';
import { FilterActions } from './FilterActions';

function Toolbar() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleFilterOpen = () => {
    console.log("Open filter drawer/modal");
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        
        <SearchInput value={searchQuery} onChange={setSearchQuery} />
        
        <FilterActions onFilterClick={handleFilterOpen} onSortChange={() => {}} />

      </div>
    </div>
  );
}

export default Toolbar;