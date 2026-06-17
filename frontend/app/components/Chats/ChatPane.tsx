'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from "next/navigation";
import { ChatHeader } from "./ChatHeader";
import { ChatInputArea } from "./ChatInputArea";
import { MessageList } from "./MessageList";
import { fetchAPI } from '../../utils/api';
import type { BackendMessage } from "@/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';

interface ChatPaneProps {
  productId: string;
  otherUserId: string;
  onBackAction?: () => void;
}

export function ChatPane({ productId, otherUserId, onBackAction }: ChatPaneProps) {
 const router = useRouter();
 const [messages, setMessages] = useState<BackendMessage[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [needsPayment, setNeedsPayment] = useState(false);
 const wsRef = useRef<WebSocket | null>(null);

 // Fetch existing messages via REST
 useEffect(() => {
   if (!productId || !otherUserId) return;
   setLoading(true);
   setError(null);
   setNeedsPayment(false);
   (async () => {
     try {
       const res = await fetchAPI<{ messages: BackendMessage[] }>(`/api/v1/conversations/${productId}/${otherUserId}`);
       setMessages(res.messages || (Array.isArray(res) ? res : []));
     } catch (err) {
       const msg = err instanceof Error ? err.message : '';
       if (msg.toLowerCase().includes('pay')) {
         setNeedsPayment(true);
       } else {
         setError(msg || 'Could not load messages');
       }
     } finally {
       setLoading(false);
     }
   })();
 }, [productId, otherUserId]);

 // WebSocket connection for real-time messaging
 useEffect(() => {
   if (!productId || !otherUserId) return;

   const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
   if (!token) return;

   const ws = new WebSocket(`${WS_URL}/api/v1/ws?token=${token}`);
   wsRef.current = ws;

   ws.onmessage = (event) => {
     try {
       const data = JSON.parse(event.data);
       if (data.type === 'chat' && data.product_id === productId) {
         setMessages((prev) => {
           if (prev.some((m) => m.id === data.id)) return prev;
           return [...prev, {
             id: data.id,
             sender_id: data.sender_id,
             sender_name: data.sender_name || '',
             receiver_id: data.receiver_id,
             product_id: data.product_id,
             content: data.content,
             is_read: data.is_read || false,
             created_at: data.created_at || new Date().toISOString(),
           }];
         });
       }
     } catch { /* ignore malformed messages */ }
   };

   return () => {
     ws.close();
     wsRef.current = null;
   };
 }, [productId, otherUserId]);

 const handleSendMessage = (text: string) => {
   const ws = wsRef.current;
   if (ws && ws.readyState === WebSocket.OPEN) {
     ws.send(JSON.stringify({
       type: 'chat',
       receiver_id: otherUserId,
       product_id: productId,
       content: text,
     }));
   }
 };

 const reportUser = () => {
   const seller = messages.find(m => m.sender_id === otherUserId);
   router.push(`/report?sellerName=${encodeURIComponent(seller?.sender_name || '')}&productId=${productId}`);
 };

 const chatMessages = messages.map((m, i) => ({
   id: i,
   text: m.content,
   sender: m.sender_id === otherUserId ? 'seller' as const : 'buyer' as const,
   time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
 }));

 const sellerName = messages.find(m => m.sender_id === otherUserId)?.sender_name || 'Seller';

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

 if (needsPayment) {
   return (
     <div className="flex-1 flex flex-col bg-slate-50/30 h-full overflow-hidden">
       <ChatHeader
         sellerName={sellerName}
         itemTitle=""
         onBackAction={onBackAction}
         onReport={reportUser}
       />
       <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
         <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
           <span className="text-2xl">🔒</span>
         </div>
         <h3 className="text-lg font-bold text-gray-900 mb-2">Payment Required</h3>
         <p className="text-sm text-gray-500 max-w-sm">
           You need to pay before you can access this conversation. Go back to the product page to initiate payment.
         </p>
       </div>
     </div>
   );
 }

 if (error) {
   return (
     <div className="flex-1 flex items-center justify-center text-gray-400 text-sm p-8 text-center">
       {error}
     </div>
   );
 }

 return (
   <div className="flex-1 flex flex-col bg-slate-50/30 h-full overflow-hidden">
     <div className="flex-shrink-0 bg-white z-10">
       <ChatHeader
         sellerName={sellerName}
         itemTitle=""
         onBackAction={onBackAction}
         onReport={reportUser}
       />
     </div>

     <div className="flex-1 overflow-y-auto min-h-0 bg-white">
       <MessageList
         messages={chatMessages}
         item={{ title: '', price: '' }}
       />
     </div>

     <div className="flex-shrink-0 bg-white border-t border-gray-100 p-3 z-10">
       <ChatInputArea
         item={{ title: '', price: '' }}
         onSendMessage={handleSendMessage}
         onBuyAction={() => router.push(`/details/${productId}`)}
       />
     </div>
   </div>
 );
}
