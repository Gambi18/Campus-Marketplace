'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ConversationList } from '@/components/Chats/ConversationList';
import Navbar from '@/components/Navbar';
import { Conversation } from '@/types';


const MOCK_CONVERSATIONS : Conversation[] = [
  { id: '1', userName: 'Rose Sharon', itemTitle: 'Advanced Calculus', lastMessage: "Is the textbook still 15,000 FCFA?", timestamp: '10:45 AM' },
  { id: '2', userName: 'Theclaire', itemTitle: 'Study Desk', lastMessage: 'I can pick up the desk at 4pm.', timestamp: 'Yesterday' }
];

export default function ConversationsLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  
  // If conversationId exists in the URL, we are looking at a specific chat thread
  const activeId = params?.conversationId as string | undefined;

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
          <ConversationList 
            conversations={MOCK_CONVERSATIONS} 
            activeConversationId={activeId}
            onSelectConversation={(id) => router.push(`/conversations/${id}`)}
          />
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