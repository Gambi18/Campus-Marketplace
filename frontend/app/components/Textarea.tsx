import React from 'react';

interface TextareaProps {
  label: string;
  name?: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
  rows?: number;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export default function Textarea({
  label,
  name,
  placeholder,
  value,
  required = false,
  rows = 5,
  onChange,
}: TextareaProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-semibold text-brand-neutral">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full py-3 px-4 text-base md:text-sm rounded-lg border border-gray-200 bg-white text-brand-neutral placeholder-gray-400 outline-none focus:border-brand-primary focus:ring-4 focus:ring-blue-100 transition-all resize-y min-h-[120px]"
      />
    </div>
  );
}
