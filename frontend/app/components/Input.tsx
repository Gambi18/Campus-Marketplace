

interface InputProps{
  label: string,
  type?: string,
  placeholder?: string,
  name: string,
  value?: string,
  error?: string,
  disabled?: boolean,
  onChange?: () => void;
}
function Input({label, placeholder, type='input', name, value, error, disabled = false,onChange}:InputProps ) {

  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input type={type} placeholder={placeholder} name={name} value={value} disabled={disabled} onChange={onChange}
      className={`
            w-full py-3 pl-4 text-sm rounded-lg border transition-all duration-200 outline-none
            bg-white text-brand-neutral placeholder-gray-400
            ${error ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-brand-primary focus:ring-4 focus:ring-blue-100'}
            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
          `}
      />
    </div>
  )
}

export default Input
