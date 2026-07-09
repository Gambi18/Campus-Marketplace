'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from "next/navigation";
import { Lock } from 'lucide-react';
import { ChatHeader } from "./ChatHeader";
import { ChatInputArea } from "./ChatInputArea";
import { MessageList } from "./MessageList";
import { fetchAPI, getWsUrl } from '../../utils/api';
import { checkPaymentStatus, rejectDelivery } from '../../utils/paymentApi';
import type { BackendMessage } from "@/types";

interface ProductDetail {
  id: string;
  title: string;
  description: string;
  price: string;
  image_url_1: string;
}

interface ChatPaneProps {
  productId: string;
  otherUserId: string;
  /** Conversation partner's display name, passed from the list/product page. */
  otherUserName?: string;
  paymentId?: string;
  onBackAction?: () => void;
}

export function ChatPane({ productId, otherUserId, otherUserName, paymentId, onBackAction }: ChatPaneProps) {
 const router = useRouter();
 const [messages, setMessages] = useState<BackendMessage[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
  const [needsPayment, setNeedsPayment] = useState(false);
  const [connected, setConnected] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelPreset, setCancelPreset] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  const cancelPresets = [
    { value: 'seller_no_response', label: "Seller didn't respond" },
    { value: 'not_as_described', label: 'Item not as described' },
    { value: 'changed_mind', label: 'Changed mind' },
    { value: 'better_price', label: 'Found better price' },
    { value: 'other', label: 'Other (specify)' },
  ];

  // Check payment status for cancel eligibility
  useEffect(() => {
    if (!paymentId) return;
    (async () => {
      try {
        const res = await checkPaymentStatus(paymentId);
        setPaymentStatus(res.status);
      } catch {
        setPaymentStatus(null);
      }
    })();
  }, [paymentId]);

  const handleCancelTransaction = () => {
    setShowCancelModal(true);
    setCancelPreset('');
    setCancelReason('');
  };

  const getCancelReasonText = () => {
    if (cancelPreset === 'other') return cancelReason.trim();
    const preset = cancelPresets.find(p => p.value === cancelPreset);
    return preset ? preset.label : '';
  };

  const handleConfirmCancel = async () => {
    const reason = getCancelReasonText();
    if (!reason || cancelling || !paymentId) return;
    setCancelling(true);
    try {
      await rejectDelivery(paymentId, reason);
      setShowCancelModal(false);
      setPaymentStatus('refunded');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel transaction');
    } finally {
      setCancelling(false);
    }
  };

  // Fetch product details
  useEffect(() => {
    if (!productId) return;
    (async () => {
      try {
        setProduct(await fetchAPI<ProductDetail>(`/api/v1/products/${productId}`));
      } catch {
        // product details are non-critical
      }
    })();
  }, [productId]);

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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket connection for real-time messaging
  useEffect(() => {
    if (!productId || !otherUserId) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    let cancelled = false;

    function connect() {
      if (cancelled) return;
      const ws = new WebSocket(`${getWsUrl()}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) { ws.close(); return; }
        setConnected(true);
        setSendError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Only accept messages for THIS conversation: same product AND the
          // other participant must be the person this thread is with. The socket
          // receives every message for the logged-in user across all threads.
          const belongsToThread =
            data.type === 'chat' &&
            data.product_id === productId &&
            (data.sender_id === otherUserId || data.receiver_id === otherUserId);
          if (belongsToThread) {
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

      ws.onerror = () => {
        // onerror will be followed by onclose
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        if (!cancelled) {
          reconnectTimeoutRef.current = setTimeout(connect, 2000);
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional close
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnected(false);
    };
  }, [productId, otherUserId]);

  // Returns true if the message was actually sent, so the input only clears on
  // success and the user never loses text into a closed socket.
  const handleSendMessage = (text: string): boolean => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setSendError('Not connected — reconnecting. Your message was not sent.');
      return false;
    }
    ws.send(JSON.stringify({
      type: 'chat',
      receiver_id: otherUserId,
      product_id: productId,
      content: text,
    }));
    setSendError(null);
    return true;
  };

 // Prefer the name passed in; fall back to the partner's name pulled from any
 // message they've sent, then a neutral label. Works whether the partner is the
 // buyer or the seller — the thread no longer assumes one role.
 const partnerName =
   otherUserName ||
   messages.find(m => m.sender_id === otherUserId)?.sender_name ||
   'User';

 const reportUser = () => {
   router.push(`/report?sellerName=${encodeURIComponent(partnerName)}&productId=${productId}`);
 };

  const chatMessages = messages.map((m) => ({
    id: m.id,
    text: m.content,
    sender: m.sender_id === otherUserId ? 'other' as const : 'self' as const,
    time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

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
         sellerName={partnerName}
         itemTitle=""
         onBackAction={onBackAction}
         onReport={reportUser}
       />
       <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
         <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
           <Lock className="w-7 h-7 text-amber-600" aria-hidden="true" />
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
    <>
      <div className="flex-1 flex flex-col bg-slate-50/30 h-full overflow-hidden">
        <div className="flex-shrink-0 bg-white z-10">
          {!connected && (
            <div className="px-4 py-1.5 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              Reconnecting...
            </div>
          )}
          <ChatHeader
            sellerName={partnerName}
            itemTitle={product?.title || ''}
            onBackAction={onBackAction}
            onReport={reportUser}
            onCancelTransaction={handleCancelTransaction}
            showCancelOption={paymentStatus === 'held'}
          />
          {sendError && (
            <div className="px-4 py-1.5 bg-red-50 border-b border-red-100 text-xs text-red-600">
              {sendError}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 bg-white">
          <MessageList
            messages={chatMessages}
            item={{
              title: product?.title || '',
              price: product?.price || '',
              imageUrl: product?.image_url_1 || undefined,
            }}
            onItemClick={() => router.push(`/details/${productId}`)}
          />
          <div ref={messagesEndRef} />
        </div>

        <div className="flex-shrink-0 bg-white border-t border-gray-100 p-3 z-10">
          <ChatInputArea
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>

      {/* Cancel Transaction Modal */}
      {showCancelModal && (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
       <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
         <h3 className="text-lg font-bold text-brand-neutral mb-2">Cancel Transaction</h3>
         <p className="text-sm text-text-muted mb-4">
           A 1% platform fee applies on refunds. Please tell us why you&apos;re cancelling:
         </p>
         <div className="space-y-2 mb-4">
           {cancelPresets.map((preset) => (
             <label
               key={preset.value}
               className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                 cancelPreset === preset.value
                   ? 'border-brand-primary bg-brand-primary/5'
                   : 'border-gray-200 hover:border-gray-300'
               }`}
             >
               <input
                 type="radio"
                 name="cancelReason"
                 value={preset.value}
                 checked={cancelPreset === preset.value}
                 onChange={(e) => setCancelPreset(e.target.value)}
                 className="accent-brand-primary"
               />
               <span className="text-sm font-medium text-brand-neutral">{preset.label}</span>
             </label>
           ))}
         </div>
         {cancelPreset === 'other' && (
           <textarea
             placeholder="Please specify your reason..."
             value={cancelReason}
             onChange={(e) => setCancelReason(e.target.value)}
             rows={3}
             className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
           />
         )}
         <div className="flex gap-3 mt-4">
           <button
             onClick={() => setShowCancelModal(false)}
             className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-brand-neutral hover:bg-gray-50 transition disabled:opacity-50"
             disabled={cancelling}
           >
             Go Back
           </button>
           <button
             onClick={handleConfirmCancel}
             className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
             disabled={cancelling || !getCancelReasonText()}
           >
             {cancelling ? 'Processing\u2026' : 'Confirm Refund'}
           </button>
         </div>
          </div>
      </div>
      )}
    </>
  );
}
