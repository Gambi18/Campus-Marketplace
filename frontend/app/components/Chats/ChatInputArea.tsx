'use client';

import React, { useState } from 'react';
import { Plus, Image, Send } from 'lucide-react';
import  Button  from '../Button';
import { ProductItem } from '@/types';

interface ChatInputAreaProps {
  item: ProductItem;
  onSendMessage: (text: string) => void;
  onBuyAction: () => void;
  onAddClick?: () => void;
  onImageClick?: () => void;
}

export function ChatInputArea({
  item,
  onSendMessage,
  onBuyAction,
  onAddClick,
  onImageClick
}: ChatInputAreaProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text);
    setText('');
  };

  return (
    <div className="p-4 border-t border-gray-100 bg-white space-y-3">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <button 
          type="button" 
          onClick={onAddClick}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition"
        >
          <Plus className="w-5 h-5" />
        </button>
        
        <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition">
          <input 
            type="text" 
            placeholder="Type a message..." 
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none"
          />
          <button 
            type="submit" 
            disabled={!text.trim()}
            className="text-blue-600 hover:text-blue-700 disabled:opacity-40 transition ml-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <button 
          type="button" 
          onClick={onImageClick}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition"
        >
          <Image className="w-5 h-5" />
        </button>
      </form>

      <Button 
        variant="primary"
        size="lg"
        fullWidth={true}
        onClick={onBuyAction}
        className="rounded-xl flex items-center justify-center gap-2 shadow-sm py-3"
      >
        <span>💳</span> Buy {item.title} for {item.price}
      </Button>
    </div>
  );
}