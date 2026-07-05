import { Plus } from 'lucide-react';
import Link from 'next/link'; 

export default function CreateListingCard() {
  return (
   
    <Link
      href="/sell" 
      className="w-full max-w-[320px] aspect-[4/5] bg-blue-50/40 hover:bg-blue-100/50 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all duration-200 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <div className="w-12 h-12 rounded-full bg-blue-100 text-slate-900 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all duration-200 shadow-sm">
        <Plus className="w-5 h-5" strokeWidth={2.5} />
      </div>
      <div className="mt-5 space-y-1">
        <h3 className="font-bold text-brand-neutral text-lg tracking-tight">
          List another item
        </h3>
        <p className="text-sm text-slate-500 max-w-[200px] leading-relaxed">
          Turn your extra gear into quick cash
        </p>
      </div>
    </Link>
  );
}