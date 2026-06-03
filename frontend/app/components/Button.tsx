
interface ButtonProps {
 children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'form' | 'outlined' | 'formLightBlue' 
  size?: 'sm' | 'md' | 'lg',
  type?: 'button' | 'submit',
  disabled?: boolean,
  onClick?: () => void}


function Button({children, variant = 'primary', size='md', type='button', disabled = false, onClick}: ButtonProps) {
const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
 const variantStyles = {
    primary: 'bg-brand-primary text-white hover:bg-blue-700 focus:ring-brand-primary',  
    secondary: 'bg-white text-brand-primary border border-gray-300 hover:bg-brand-primary hover:text-white focus:ring-slate-400',
    outlined: 'border border-gray-300 bg-transparent text-white hover:bg-slate-50 focus:ring-slate-400',
    form: 'bg-brand-primary text-white hover:bg-blue-700 focus:ring-brand-primary w-full font-semibold shadow-sm',
    formLightBlue: 'bg-blue-200 text-white hover:bg-blue-300 focus:ring-brand-primary w-full font-semibold shadow-sm'
  };
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-6 py-3 text-base rounded-lg',
  };
return (
    <button 
    type={type}
     className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`}
     disabled={disabled}
     onClick={onClick}
     >
      {children}
    </button>
  )
}

export default Button;
