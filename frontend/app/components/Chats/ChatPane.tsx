'use client';

import { useRouter } from "next/navigation";
import { ChatHeader } from "./ChatHeader";
import { ChatInputArea } from "./ChatInputArea";
import { MessageList } from "./MessageList";
import { ChatThread } from "@/types";

interface ChatPaneProps {
  conversationId: string;
  onBackAction?: () => void;
}

const MOCK_CHAT_DATA: Record<string, ChatThread> = {
  '1': {
    userName: 'Rose Sharon',
    item: { title: 'Advanced Calculus', price: '15,000 FCFA' },
    messages: [
      { id: 1, text: "Hi! I saw your listing for the Advanced Calculus textbook.", sender: 'seller', time: '10:45 AM' },
      { id: 2, text: "Is the textbook still 15,000 FCFA?", sender: 'seller', time: '10:45 AM' },
      { id: 3, text: "Yes the textbook is available.", sender: 'buyer', time: '10:45 AM' },
    ]
  },
};

export function ChatPane({ conversationId, onBackAction }: ChatPaneProps) {
 const router = useRouter();
const ReportUser = () =>{
router.push('/report')
}

    const currentChat = MOCK_CHAT_DATA[conversationId];

  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Select a message thread to view details
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50/30 h-full overflow-hidden">
      <div className="flex-shrink-0 bg-white z-10">
        <ChatHeader 
          sellerName={currentChat.userName} 
          itemTitle={currentChat.item.title}
          onBackAction={onBackAction}
          onReport={()=>ReportUser()}
        />
      </div>
      
      <div className="flex-1 overflow-y-auto min-h-0 bg-white">
        <MessageList 
          messages={currentChat.messages} 
          item={currentChat.item} 
        />
      </div>
      
      <div className="flex-shrink-0 bg-white border-t border-gray-100 p-3 z-10">
        <ChatInputArea 
          item={currentChat.item} 
          onSendMessage={(text) => console.log('Sending:', text)}
          onBuyAction={() => console.log('Checkout for:', conversationId)}
        />
      </div>
    </div>
  );
}