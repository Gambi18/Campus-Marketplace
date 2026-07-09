import React from 'react';

interface InputProps {
  label: string;
  type?: string;
  placeholder?: string;
  name: string;
  value?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  autoComplete?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

function Input({
  label,
  placeholder,
  type = 'text',
  name,
  value,
  error,
  disabled = false,
  required = false,
  helperText,
  autoComplete,
  onChange,
  className = '',
}: InputProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={name} className="block text-sm font-semibold text-brand-neutral">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        name={name}
        value={value}
        disabled={disabled}
        autoComplete={autoComplete}
        onChange={onChange}
        className={`
          w-full py-3 px-4 text-sm rounded-lg border transition-all duration-200 outline-none
          bg-white text-brand-neutral placeholder-gray-400
          ${error ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-brand-primary focus:ring-4 focus:ring-blue-100'}
          disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
        `}
      />
      {helperText && !error && (
        <p className="text-xs text-text-muted italic">{helperText}</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default Input;
