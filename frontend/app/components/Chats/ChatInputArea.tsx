'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatInputAreaProps {
  // Returns true when the message was sent; the input is only cleared on success
  // so the user never loses text into a closed/reconnecting socket.
  onSendMessage: (text: string) => boolean;
}

export function ChatInputArea({
  onSendMessage
}: ChatInputAreaProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (onSendMessage(text)) {
      setText('');
    }
  };

  return (
    <div className="p-4 border-t border-gray-100 bg-white">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition">
          <input
            type="text"
            placeholder="Type a message..."
            aria-label="Message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 bg-transparent text-base md:text-sm text-gray-800 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            aria-label="Send message"
            className="flex items-center justify-center min-h-[44px] min-w-[44px] -mr-2 rounded-full text-brand-primary hover:text-brand-primary-strong hover:bg-brand-tertiary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
