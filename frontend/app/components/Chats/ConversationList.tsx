


import { ConversationItem } from "@/types";


interface ConversationListProps {
  conversations: ConversationItem[];
  onSelectConversation: (id: string | number) => void;
  activeConversationId?: string | number;
}

export function ConversationList({ 
  conversations, 
  onSelectConversation,
  activeConversationId 
}: ConversationListProps) {
  return (
    <div className="w-full bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
      {conversations.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-sm">
          No conversations found.
        </div>
      ) : (
        conversations.map((chat) => {
          const isActive = chat.id === activeConversationId;
          
          return (
            <button
              key={chat.id}
              onClick={() => onSelectConversation(chat.id)}
              className={`w-full text-left p-4 flex items-start gap-3 transition-colors text-slate-100/0 ${
                isActive 
                  ? 'bg-blue-50/60' 
                  : 'hover:bg-gray-50 bg-white'
              }`}
            >
              {/* User Avatar */}
              <div className="relative flex-shrink-0">
                <img
                  src={chat.avatarUrl || "/api/placeholder/44/44"}
                  alt={chat.userName}
                  className="w-11 h-11 rounded-full object-cover border border-gray-100"
                />
                {chat.unread && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-blue-600 border-2 border-white rounded-full"></span>
                )}
              </div>

              {/* Conversation Meta Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className={`text-sm truncate ${chat.unread ? 'font-semibold text-gray-950' : 'font-medium text-gray-900'}`}>
                    {chat.itemTitle}
                  </h4>
                  <span className="text-xs text-gray-400 flex-shrink-0 font-light">
                    {chat.timestamp}
                  </span>
                </div>

                <p className="text-xs text-blue-600 font-medium truncate mt-0.5">
                  Re: {chat.itemTitle}
                </p>

                <p className={`text-sm truncate mt-1 ${chat.unread ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                  {chat.lastMessage}
                </p>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}