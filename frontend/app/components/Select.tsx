import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  name: string;
  value?: string;
  placeholder?: string;
  options: SelectOption[];
  required?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function Select({
  label,
  name,
  value,
  placeholder = 'Select an option',
  options,
  required = false,
  onChange,
}: SelectProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-semibold text-brand-neutral">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full py-3 px-4 text-sm rounded-lg border border-gray-200 bg-white text-brand-neutral outline-none focus:border-brand-primary focus:ring-4 focus:ring-blue-100 transition-all appearance-none cursor-pointer"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
