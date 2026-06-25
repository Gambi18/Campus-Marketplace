'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TriangleAlert } from 'lucide-react';

export default function SoldToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sold = searchParams.get('sold');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sold) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      router.replace('/', { scroll: false });
    }, 6000);
    return () => clearTimeout(t);
  }, [sold, router]);

  if (!visible || !sold) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white shadow-xl"
      style={{ animation: 'slideDown 0.35s ease-out' }}
    >
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
        <TriangleAlert className="w-6 h-6 flex-shrink-0" />
        <div>
          <p className="font-bold text-base">
            &ldquo;{decodeURIComponent(sold)}&rdquo; has been sold already
          </p>
          <p className="text-sm text-red-100 mt-0.5">
            Browse other available items from the listings below.
          </p>
        </div>
      </div>
    </div>
  );
}