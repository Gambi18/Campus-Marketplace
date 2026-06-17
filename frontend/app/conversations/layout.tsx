'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ConversationList } from '@/components/Chats/ConversationList';
import Navbar from '@/components/Navbar';
import { fetchAPI } from '../utils/api';
import type { BackendConversation } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';

export default function ConversationsLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const [conversations, setConversations] = useState<BackendConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchConversations = async () => {
    try {
      const res = await fetchAPI<{ conversations: BackendConversation[] }>('/api/v1/conversations');
      setConversations(res.conversations || []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      router.replace("/login");
      return;
    }

    fetchConversations();

    // Layout-level WebSocket for real-time conversation list updates
    const token = localStorage.getItem('token');
    if (!token) return;

    let cancelled = false;

    function connectWs() {
      if (cancelled) return;
      const ws = new WebSocket(`${WS_URL}/api/v1/ws?token=${token}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'chat') {
            fetchConversations();
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!cancelled) {
          setTimeout(connectWs, 3000);
        }
      };
    }

    connectWs();

    return () => {
      cancelled = true;
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [router]);

  const activeId = params?.productId as string | undefined;

  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;

  const items = conversations.map((c) => ({
    id: c.product_id,
    userName: c.sender_name,
    itemTitle: c.product_title,
    lastMessage: c.content,
    timestamp: new Date(c.created_at).toLocaleDateString(),
    unread: !c.is_read,
    otherUserId: c.sender_id === currentUserId ? c.receiver_id : c.sender_id,
  }));

  return (
    <div>
        <Navbar/>
        <div className="flex w-full max-w-7xl mx-auto md:border md:border-gray-100 md:rounded-xl md:shadow-sm bg-white h-screen md:h-[calc(100vh-140px)] overflow-hidden">

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
                  router.push(`/conversations/${id}?user=${conv.otherUserId}`);
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
