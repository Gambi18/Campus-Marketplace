"use client";

import { useRouter } from "next/navigation";
import { Icons } from "./Icons";

const CATEGORIES = [
  { id: 0, name: "All", icon: Icons.All },
  { id: 1, name: "Electronics", icon: Icons.Electronics },
  { id: 2, name: "Fashion", icon: Icons.Fashion },
  { id: 3, name: "Academic", icon: Icons.Academic },
  { id: 4, name: "Furniture", icon: Icons.Furniture },
  { id: 5, name: "Sports", icon: Icons.Gaming },
  { id: 6, name: "Others", icon: Icons.Kitchen },
];

export default function ItemCategory() {
  const router = useRouter();

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center space-x-2.5 min-w-max">
        {CATEGORIES.map((category) => {
          const IconComponent = category.icon;

          return (
            <button
              key={category.id}
              onClick={() => {
                if (category.id === 0) {
                  router.push("/");
                } else {
                  router.push(`/category/${category.id}`);
                }
              }}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg border text-xs font-semibold transition-all duration-150 active:scale-95 cursor-pointer bg-white text-gray-600 border-gray-100 hover:bg-gray-50 hover:border-gray-200"
            >
              <span className="text-gray-500">
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