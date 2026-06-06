import React from 'react';
import * as LucideIcons from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  iconName: keyof typeof LucideIcons; 
  iconColorClass?: string;
  iconBgClass?: string;
}

export default function StatCard({
  label,
  value,
  iconName,
  iconColorClass = 'text-blue-600',
  iconBgClass = 'bg-blue-50',
}: StatCardProps) {
  const IconComponent = LucideIcons[iconName] as React.ComponentType<{ className?: string }>;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between w-full">
      <div className="space-y-3">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          {label}
        </span>
        <span className="text-2xl font-extrabold text-slate-800 block">
          {value}
        </span>
      </div>
      
      {/* Icon Wrapper box */}
      <div className={`p-2 rounded-xl ${iconBgClass} ${iconColorClass}`}>
        {IconComponent && <IconComponent className="w-5 h-5" />}
      </div>
    </div>
  );
}