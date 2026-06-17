
import Image from 'next/image';
import { MoreVertical, AlertCircle, ArrowLeft } from 'lucide-react'; // Added ArrowLeft

interface ChatHeaderProps {
  sellerName: string;
  itemTitle: string;
  avatarUrl?: string;
  isActive?: boolean;
  onReport?: () => void;
  onMoreActions?: () => void;
  onBackAction?: () => void; 
}

export function ChatHeader({
  sellerName,
  itemTitle,
  avatarUrl,
  isActive = false,
  onReport,
  onMoreActions,
  onBackAction
}: ChatHeaderProps) {
  const initial = (sellerName?.trim()?.[0] || '?').toUpperCase();
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
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-base">{sellerName}</h3>
          {itemTitle && <p className="text-xs text-gray-500">Re: {itemTitle}</p>}
          {isActive && <p className="text-xs text-green-600 font-medium mt-0.5">Active now</p>}
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-gray-500">
        <button 
          onClick={onReport}
          className="flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-600 transition"
        >
          <AlertCircle className="w-4 h-4" />
          Report
        </button>
        <button
          onClick={onMoreActions}
          aria-label="More actions"
          className="p-1 hover:bg-gray-100 rounded-full transition"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}