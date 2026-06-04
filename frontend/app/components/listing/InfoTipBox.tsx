import React from 'react';

interface InfoTipBoxProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function InfoTipBox({ icon, title, description }: InfoTipBoxProps) {
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-blue-50/80 border border-blue-100">
      <div className="flex-shrink-0 text-brand-primary mt-0.5">{icon}</div>
      <div>
        <h3 className="text-sm font-semibold text-brand-neutral">{title}</h3>
        <p className="text-sm text-text-muted mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
