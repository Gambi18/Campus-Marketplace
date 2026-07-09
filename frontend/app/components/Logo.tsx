import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-2.5 group outline-none select-none">
      
      {/* Icon / Graduation Cap Container */}
      <div className="bg-blue-600 text-white w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-blue-500/20">
        {/* Crisp SVG Graduation Cap matching your brand mark */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className="w-5.5 h-5.5 text-blue-50"
        >
          <path d="M11.645 2.091a.75.75 0 0 1 .71 0l10.25 5.857a.75.75 0 0 1 0 1.304l-10.25 5.857a.75.75 0 0 1-.71 0L1.4 9.252a.75.75 0 0 1 0-1.304l10.25-5.857Z" />
          <path d="M12 15.356 2.743 10.07a.75.75 0 1 0-.745 1.3l9.645 5.514a.75.75 0 0 0 .714 0l9.645-5.514a.75.75 0 0 0-.746-1.3L12 15.356Z" />
          <path d="M3.25 12.13v3.62a2.25 2.25 0 0 0 1.084 1.933l5.5 3.25a2.25 2.25 0 0 0 2.332 0l5.5-3.25a2.25 2.25 0 0 0 1.084-1.933v-3.62l-6.145 3.511a2.25 2.25 0 0 1-2.21 0L3.25 12.13Z" />
        </svg>
      </div>
      
      {/* Brand Text styling using the rich Plus Jakarta Sans font */}
      <span className="font-logo text-xl tracking-wide sm:text-xl antialiased">
        <span className="text-blue-600 font-medium">Campus</span>
        <span className="text-blue-600 font-bold">
          Market
        </span>
      </span>
    </Link>
  );
}