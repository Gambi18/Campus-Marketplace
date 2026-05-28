
import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-2 group outline-none">
     
      <div className="bg-brand-primary text-white w-8 h-8 rounded-md flex items-center justify-center font-bold text-lg transition-transform duration-200 group-hover:scale-105 shadow-sm">
        M
      </div>
      
      <span className="text-xl font-bold font-heading text-brand-neutral tracking-tight">
        CampusMarket
      </span>
    </Link>
  );
}