import Link from 'next/link';

interface ListingBackLinkProps {
  href: string;
  label?: string;
}

export default function ListingBackLink({ href, label = 'Back' }: ListingBackLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-brand-primary transition-colors mb-6"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
      </svg>
      {label}
    </Link>
  );
}
