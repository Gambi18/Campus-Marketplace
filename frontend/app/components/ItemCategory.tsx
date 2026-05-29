"use client";
import { Icons } from './Icons';

const CATEGORIES = [
  { id: 'all', name: 'All', icon: Icons.All },
  { id: 'electronics', name: 'Electronics', icon: Icons.Electronics },
  { id: 'furniture', name: 'Furniture', icon: Icons.Furniture },
  { id: 'kitchen', name: 'Kitchen', icon: Icons.Kitchen },
  { id: 'academic', name: 'Academic', icon: Icons.Academic },
  { id: 'fashion', name: 'Fashion', icon: Icons.Fashion },
  { id: 'gaming', name: 'Gaming', icon: Icons.Gaming }
];

interface CategoryFilterProps {
  selectedCategoryId?: string;
}

export default function ItemCategory({
  selectedCategoryId = 'all'
}: CategoryFilterProps) {
  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="flex items-center space-x-2.5 min-w-max px-1">
        {CATEGORIES.map((category) => {
          const isActive = selectedCategoryId === category.id;
          const IconComponent = category.icon;

          return (
            <button
              key={category.id}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg border text-xs font-semibold transition-all duration-150 active:scale-95 cursor-pointer ${
                isActive
                  ? 'bg-brand-neutral text-white border-brand-neutral shadow-xs'
                  : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50 hover:border-gray-200'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-gray-500'}>
                <IconComponent size={14} strokeWidth={2.2} />
              </span>
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}