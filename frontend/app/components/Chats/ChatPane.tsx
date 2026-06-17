'use client';

import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { ChatHeader } from "./ChatHeader";
import { ChatInputArea } from "./ChatInputArea";
import { MessageList } from "./MessageList";
import { fetchAPI } from '../../utils/api';
import type { BackendMessage } from "@/types";

interface ChatPaneProps {
  productId: string;
  otherUserId: string;
  onBackAction?: () => void;
}

export function ChatPane({ productId, otherUserId, onBackAction }: ChatPaneProps) {
 const router = useRouter();
 const [messages, setMessages] = useState<BackendMessage[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
   if (!productId || !otherUserId) return;
   (async () => {
     try {
       const res = await fetchAPI<BackendMessage[]>(`/api/v1/conversations/${productId}/${otherUserId}`);
       setMessages(Array.isArray(res) ? res : []);
     } catch {
       setMessages([]);
     } finally {
       setLoading(false);
     }
   })();
 }, [productId, otherUserId]);

 const ReportUser = () => {
   router.push(`/report?sellerName=${encodeURIComponent(messages[0]?.sender_name || '')}&productId=${productId}`);
 };

 const chatMessages = messages.map((m, i) => ({
   id: i,
   text: m.content,
   sender: m.sender_id === otherUserId ? 'seller' as const : 'buyer' as const,
   time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
 }));

 const sellerName = messages.find(m => m.sender_id === otherUserId)?.sender_name || 'Seller';
 const itemTitle = '';

 if (!productId || !otherUserId) {
   return (
     <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
       Select a message thread to view details
     </div>
   );
 }

 if (loading) {
   return (
     <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
       Loading messages...
     </div>
   );
 }

 return (
   <div className="flex-1 flex flex-col bg-slate-50/30 h-full overflow-hidden">
     <div className="flex-shrink-0 bg-white z-10">
       <ChatHeader
         sellerName={sellerName}
         itemTitle={itemTitle}
         onBackAction={onBackAction}
         onReport={() => ReportUser()}
       />
     </div>

     <div className="flex-1 overflow-y-auto min-h-0 bg-white">
       <MessageList
         messages={chatMessages}
         item={{ title: itemTitle, price: '' }}
       />
     </div>

     <div className="flex-shrink-0 bg-white border-t border-gray-100 p-3 z-10">
       <ChatInputArea
         item={{ title: itemTitle, price: '' }}
         onSendMessage={(text) => console.log('Sending:', text)}
         onBuyAction={() => console.log('Checkout for:', productId)}
       />
     </div>
   </div>
 );
}
