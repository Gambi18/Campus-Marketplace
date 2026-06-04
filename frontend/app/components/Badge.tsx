import React from 'react';

type BadgeVariant = 'good' | 'new' | 'like-new' | 'fair' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  'like-new': 'bg-sky-50 text-sky-700 border-sky-200',
  fair: 'bg-amber-50 text-amber-700 border-amber-200',
  neutral: 'bg-gray-100 text-gray-600 border-gray-200',
};

function conditionToVariant(condition: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    'Brand New': 'new',
    'Like New': 'like-new',
    Good: 'good',
    Fair: 'fair',
    New: 'new',
    Excellent: 'like-new',
  };
  return map[condition] ?? 'good';
}

export default function Badge({ children, variant }: BadgeProps) {
  const resolved = variant ?? conditionToVariant(String(children));
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${variantStyles[resolved]}`}
    >
      {children}
    </span>
  );
}
