'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ConversationList } from '@/components/Chats/ConversationList';
import Navbar from '@/components/Navbar';
import { fetchAPI, getWsUrl } from '../utils/api';
import { getMyPurchases, getMySales } from '../utils/paymentApi';
import type { BackendConversation } from '@/types';

interface ConversationItem {
  id: string;
  userName: string;
  itemTitle: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  unreadCount: number;
  otherUserId: string;
}

export default function ConversationsLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const [conversations, setConversations] = useState<BackendConversation[]>([]);
  const [paymentItems, setPaymentItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const [convRes, purchasesRes, salesRes] = await Promise.allSettled([
        fetchAPI<{ conversations: BackendConversation[] }>('/api/v1/conversations'),
        getMyPurchases(),
        getMySales(),
      ]);

      const messageConvs = convRes.status === 'fulfilled' ? convRes.value.conversations || [] : [];
      const purchases = purchasesRes.status === 'fulfilled' ? purchasesRes.value.purchases || [] : [];
      const sales = salesRes.status === 'fulfilled' ? salesRes.value.sales || [] : [];

      // Build a set of existing conversation keys: "productId|otherUserId"
      const covered = new Set<string>();
      for (const c of messageConvs) {
        covered.add(`${c.product_id}|${c.other_user_id}`);
      }

      // Create synthetic items from payments not already in conversations
      const paymentItems: ConversationItem[] = [];

      for (const p of purchases) {
        const key = `${p.product_id}|${p.seller_id}`;
        if (!covered.has(key) && (p.status === 'held' || p.status === 'released')) {
          covered.add(key);
          paymentItems.push({
            id: p.product_id,
            userName: p.seller_name || 'Seller',
            itemTitle: p.product_title || '',
            lastMessage: 'Payment confirmed — start chatting!',
            timestamp: new Date(p.created_at).toLocaleDateString(),
            unread: false,
            unreadCount: 0,
            otherUserId: p.seller_id,
          });
        }
      }

      for (const s of sales) {
        const key = `${s.product_id}|${s.buyer_id}`;
        if (!covered.has(key) && (s.status === 'held' || s.status === 'released')) {
          covered.add(key);
          paymentItems.push({
            id: s.product_id,
            userName: s.buyer_name || 'Buyer',
            itemTitle: s.product_title || '',
            lastMessage: 'Payment received — start chatting!',
            timestamp: new Date(s.created_at).toLocaleDateString(),
            unread: false,
            unreadCount: 0,
            otherUserId: s.buyer_id,
          });
        }
      }

      // Sort payment items by timestamp (most recent first)
      paymentItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setConversations(messageConvs);
      // Store payment-derived items for the items list
      setPaymentItems(paymentItems);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Route protection is handled centrally by middleware.ts (cookie-based).
    fetchConversations();

    // Layout-level WebSocket for real-time conversation list updates
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    let cancelled = false;

    // Coalesce bursts of incoming chat events into a single refetch.
    const scheduleRefetch = () => {
      if (refetchTimerRef.current) return;
      refetchTimerRef.current = setTimeout(() => {
        refetchTimerRef.current = null;
        fetchConversations();
      }, 500);
    };

    function connectWs() {
      if (cancelled) return;
      const ws = new WebSocket(`${getWsUrl()}?token=${token}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'chat') {
            scheduleRefetch();
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!cancelled) {
          reconnectRef.current = setTimeout(connectWs, 3000);
        }
      };
    }

    connectWs();

    return () => {
      cancelled = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [router, fetchConversations]);

  const activeId = params?.productId as string | undefined;

  const messageItems = conversations.map((c) => ({
    id: c.product_id,
    userName: c.other_user_name,
    itemTitle: c.product_title,
    lastMessage: c.content,
    timestamp: new Date(c.created_at).toLocaleDateString(),
    unread: (c.unread_count ?? 0) > 0,
    unreadCount: c.unread_count ?? 0,
    otherUserId: c.other_user_id,
  } satisfies ConversationItem));

  const items = [...messageItems, ...paymentItems]

  return (
    <div>
        <Navbar/>
        <div className="flex w-full max-w-7xl mx-auto md:border md:border-gray-100 md:rounded-xl md:shadow-sm bg-white h-[calc(100dvh-4rem)] md:h-[calc(100dvh-140px)] overflow-hidden">

      {/* LEFT PANEL: Always visible on desktop. On mobile, hides if a chat is active */}
      <div className={`w-full md:w-80 md:border-r border-gray-100 flex flex-col bg-white ${
        activeId ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="p-4 text-sm text-gray-400 text-center">Loading...</div>
          ) : (
            <ConversationList
              conversations={items}
              activeConversationId={activeId}
              onSelectConversation={(id) => {
                const conv = items.find(i => i.id === id);
                if (conv) {
                  router.push(`/conversations/${id}?user=${conv.otherUserId}&name=${encodeURIComponent(conv.userName || '')}`);
                }
              }}
            />
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Houses whatever sub-page is active */}
      <div className={`flex-1 h-full flex flex-col ${activeId ? 'flex' : 'hidden md:flex'}`}>
        {children}
      </div>

    </div>
    </div>
  );
}
