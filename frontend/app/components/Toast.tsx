'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, TriangleAlert, X } from 'lucide-react';

type ToastColor = 'green' | 'red';

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
  duration?: number;
  color?: ToastColor;
  /** 'bottom' = dismissible pill (default); 'banner' = full-width top alert. */
  variant?: 'bottom' | 'banner';
  /** Secondary line, used by the banner variant. */
  description?: string;
}

const COLOR_BG: Record<ToastColor, string> = {
  green: 'bg-green-600',
  red: 'bg-red-600',
};

export default function Toast({
  message,
  visible,
  onClose,
  duration = 3000,
  color = 'green',
  variant = 'bottom',
  description,
}: ToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setMounted(true);
    const timer = setTimeout(() => {
      setMounted(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onClose]);

  if (!visible && !mounted) return null;

  if (variant === 'banner') {
    return (
      <div
        className={`fixed top-0 left-0 right-0 z-50 ${COLOR_BG[color]} text-white shadow-xl`}
        style={{ animation: 'slideDown 0.35s ease-out' }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <TriangleAlert className="w-6 h-6 flex-shrink-0" />
          <div>
            <p className="font-bold text-base">{message}</p>
            {description && <p className="text-sm text-red-100 mt-0.5">{description}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className={`flex items-center gap-3 ${COLOR_BG[color]} text-white px-5 py-3 rounded-xl shadow-lg`}>
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
