
import { Message } from "@/types";

interface ItemDetails {
  title: string;
  price: string;
  imageUrl?: string;
}

interface MessageListProps {
  messages: Message[];
  item: ItemDetails;
  onItemClick?: () => void;
}

export function MessageList({ messages, item, onItemClick }: MessageListProps) {
  return (
    <div className="flex-1 p-4 bg-gray-50/50 min-h-[400px] overflow-y-auto space-y-6">
      
      {/* Mini Product Showcase Card */}
      <div 
        onClick={onItemClick}
        className="flex items-center justify-between p-3 bg-blue-50/40 border border-blue-100/50 rounded-xl hover:bg-blue-50 transition cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <img 
            src={item.imageUrl || "/api/placeholder/56/56"} 
            alt={item.title} 
            className="w-14 h-14 rounded-lg object-cover border border-gray-200"
          />
          <div>
            <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase">Item For Sale</span>
            <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
            <p className="text-sm font-bold text-blue-600 mt-0.5">{item.price}</p>
          </div>
        </div>
        <span className="text-gray-400 font-bold text-lg px-2">&gt;</span>
      </div>

      {/* Date Divider */}
      <div className="flex justify-center">
        <span className="text-xs bg-gray-200/70 text-gray-600 px-3 py-1 rounded-full font-medium">
          Today
        </span>
      </div>

      {/* Message Stream */}
      <div className="space-y-4">
        {messages.map((msg) => {
          const isBuyer = msg.sender === 'buyer';
          return (
            <div 
              key={msg.id} 
              className={`flex flex-col ${isBuyer ? 'items-end' : 'items-start'}`}
            >
              <div 
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                  isBuyer 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-sm'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 px-1">
                {msg.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}