import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center space-y-4 bg-[#f8fafc]">
      {/* Animated Tailwind Spinner */}
      <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
      
      {/* Text helper */}
      <p className="text-sm font-medium text-slate-500 animate-pulse">
        Loading marketplace items...
      </p>
    </div>
  );
}