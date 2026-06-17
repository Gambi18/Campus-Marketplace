'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChatPane } from '@/components/Chats/ChatPane';
import { use, Suspense } from 'react';

interface PageProps {
  params: Promise<{ productId: string }>;
}

function ActiveChatContent({ params }: PageProps) {
  const { productId } = use(params);
  const searchParams = useSearchParams();
  const otherUserId = searchParams.get('user') || '';
  const otherUserName = searchParams.get('name') || '';
  const router = useRouter();

  return (
    <div className="w-full h-full bg-white">
      <ChatPane
        productId={productId}
        otherUserId={otherUserId}
        otherUserName={otherUserName}
        onBackAction={() => router.push('/conversations')}
      />
    </div>
  );
}

export default function ActiveChatPage(props: PageProps) {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading...</div>}>
      <ActiveChatContent {...props} />
    </Suspense>
  );
}
