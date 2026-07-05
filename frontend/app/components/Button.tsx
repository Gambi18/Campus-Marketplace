import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'form' | 'outlined' | 'formLightBlue';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  /** Shows a spinner and disables the button while an async action is in flight. */
  loading?: boolean;
}

function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  className = '',
  fullWidth = false,
  loading = false,
  ...rest
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed';
  const variantStyles = {
    primary: 'bg-brand-primary text-white hover:bg-blue-700 focus:ring-brand-primary',
    secondary: 'bg-surface-admin text-text-body hover:bg-slate-200 focus:ring-slate-400',
    outlined: 'border border-gray-300 bg-white text-text-body hover:bg-slate-50 focus:ring-slate-400',
    form: 'bg-brand-primary text-white hover:bg-blue-700 focus:ring-brand-primary w-full font-semibold shadow-sm',
    formLightBlue: 'bg-blue-50 text-brand-primary border border-blue-100 hover:bg-blue-100 focus:ring-brand-primary w-full font-semibold',
  };
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-6 py-3 text-base rounded-lg',
  };

  return (
    <button
      // Forwarded props (onClick, aria-*, title, etc.) reach the DOM via {...rest},
      // so icon-only controls keep their accessible name. `type` is destructured
      // out first so it can't be overridden to a non-literal value.
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

export default Button;
