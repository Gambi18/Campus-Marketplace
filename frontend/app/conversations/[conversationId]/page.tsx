'use client';


import { useRouter } from 'next/navigation';
import { ChatPane } from '@/components/Chats/ChatPane';
import { use } from 'react';


interface PageProps {
  params: Promise<{ conversationId: string }>;
}

export default function ActiveChatPage({ params }: PageProps) {
  const { conversationId } = use(params);
  const router = useRouter();

  return (
    <div className="w-full h-full bg-white">
      <ChatPane 
        conversationId={conversationId} 
        // Mobile back button pushes back to root list view route
        onBackAction={() => router.push('/conversations')} 
      />
    </div>
  );
}