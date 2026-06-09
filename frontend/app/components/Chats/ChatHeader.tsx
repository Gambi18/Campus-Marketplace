
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
  avatarUrl = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150&auto=format&fit=crop&q=80",
  isActive = true,
  onReport,
  onMoreActions,
  onBackAction 
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
      <div className="flex items-center gap-3">
        
        {/* Mobile Back Button: Only visible on small screens when onBackAction is provided */}
        {onBackAction && (
          <button 
            onClick={onBackAction} 
            className="p-1 -ml-1 hover:bg-gray-100 rounded-full md:hidden transition text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="relative">
          <img 
            src={avatarUrl} 
            alt={sellerName} 
            className="w-12 h-12 rounded-full object-cover"
          />
          {isActive && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-base">{itemTitle}</h3>
          <p className="text-xs text-gray-500">Re: {sellerName}</p>
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
          className="p-1 hover:bg-gray-100 rounded-full transition"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}