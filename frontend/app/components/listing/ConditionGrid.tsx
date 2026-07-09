'use client';

import type { ProductCondition } from '../../types';

const CONDITIONS: ProductCondition[] = ['Brand New', 'Like New', 'Good', 'Fair'];

interface ConditionGridProps {
  value: ProductCondition;
  onChange: (condition: ProductCondition) => void;
}

export default function ConditionGrid({ value, onChange }: ConditionGridProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-brand-neutral">
        Condition <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        {CONDITIONS.map((condition) => {
          const selected = value === condition;
          return (
            <button
              key={condition}
              type="button"
              onClick={() => onChange(condition)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${selected
                  ? 'border-brand-primary bg-blue-50/50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
            >
              <span
                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selected ? 'border-brand-primary' : 'border-gray-300'
                  }`}
              >
                {selected && <span className="w-2 h-2 rounded-full bg-brand-primary" />}
              </span>
              <span className="text-sm font-medium text-brand-neutral">{condition}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
