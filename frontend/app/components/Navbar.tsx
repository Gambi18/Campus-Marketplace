import Link from 'next/link';
import Logo from './Logo';
import Button from './Button';

interface NavbarProps {
  showBuyerSwitch?: boolean;
}

export default function Navbar({ showBuyerSwitch = false }: NavbarProps) {
  return (
    <nav className="w-full h-16 bg-white border-b border-gray-100 px-6 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Logo />

          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className="relative text-brand-primary h-16 flex items-center after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-brand-primary font-semibold"
            >
              Browse
            </Link>

            <Link
              href="/listings/my"
              className="text-text-muted hover:text-brand-neutral transition-colors h-16 flex items-center"
            >
              My Listings
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {showBuyerSwitch && (
            <Link
              href="/"
              className="hidden sm:inline text-sm text-text-muted hover:text-brand-primary transition-colors"
            >
              Switch to Buyer
            </Link>
          )}

          <Link href="/sell">
            <Button variant="primary" size="md">
              <span className="flex items-center gap-1.5 font-semibold">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Sell Item
              </span>
            </Button>
          </Link>

          <button
            type="button"
            className="p-2 text-text-muted hover:text-brand-neutral hover:bg-gray-50 rounded-full transition-colors relative outline-none"
            aria-label="View notifications"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5.5 h-5.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
          </button>

          <div className="w-8 h-8 rounded-full border border-gray-200 cursor-pointer overflow-hidden hover:ring-2 hover:ring-offset-2 hover:ring-brand-primary transition-all duration-150">
            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-text-muted">
              JD
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
