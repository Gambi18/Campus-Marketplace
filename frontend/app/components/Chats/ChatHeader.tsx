
import Image from 'next/image';
import { MoreVertical, AlertCircle, Ban, ArrowLeft } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

interface ChatHeaderProps {
  sellerName: string;
  itemTitle: string;
  avatarUrl?: string;
  isActive?: boolean;
  onReport?: () => void;
  onCancelTransaction?: () => void;
  onBackAction?: () => void;
  showCancelOption?: boolean;
}

export function ChatHeader({
  sellerName,
  itemTitle,
  avatarUrl,
  isActive = false,
  onReport,
  onCancelTransaction,
  onBackAction,
  showCancelOption = false,
}: ChatHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const initial = (sellerName?.trim()?.[0] || '?').toUpperCase();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action?: () => void) => {
    setDropdownOpen(false);
    action?.();
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
      <div className="flex items-center gap-3">

        {/* Mobile Back Button: Only visible on small screens when onBackAction is provided */}
        {onBackAction && (
          <button
            onClick={onBackAction}
            aria-label="Back to conversations"
            className="p-1 -ml-1 hover:bg-gray-100 rounded-full md:hidden transition text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="relative w-12 h-12">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={sellerName}
              fill
              sizes="48px"
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
              {initial}
            </div>
          )}
          {/* Presence is only shown when we actually know the user is online. */}
          {isActive && (
            <>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" aria-hidden="true"></span>
              <span className="sr-only">Online</span>
            </>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-base">{sellerName}</h3>
          {itemTitle && <p className="text-xs text-gray-500">Re: {itemTitle}</p>}
          {isActive && <p className="text-xs text-green-600 font-medium mt-0.5">Active now</p>}
        </div>
      </div>
      
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-label="More actions"
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
          className="p-1 hover:bg-gray-100 rounded-full transition text-gray-500"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
            {onReport && (
              <button
                onClick={() => handleAction(onReport)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <AlertCircle className="w-4 h-4" />
                Report
              </button>
            )}
            {showCancelOption && onCancelTransaction && (
              <button
                onClick={() => handleAction(onCancelTransaction)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-orange-600 hover:bg-orange-50 transition-colors"
              >
                <Ban className="w-4 h-4" />
                Cancel Transaction
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}