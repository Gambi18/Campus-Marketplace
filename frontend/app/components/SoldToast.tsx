'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Toast from './Toast';

/**
 * Thin wrapper over the shared Toast: reads the `?sold=` query param and shows
 * the red top banner. Kept as its own export so existing imports don't break.
 */
export default function SoldToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sold = searchParams.get('sold');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sold) return;
    setVisible(true);
  }, [sold]);

  if (!sold) return null;

  return (
    <Toast
      variant="banner"
      color="red"
      duration={6000}
      visible={visible}
      message={`“${decodeURIComponent(sold)}” has been sold already`}
      description="Browse other available items from the listings below."
      onClose={() => {
        setVisible(false);
        router.replace('/', { scroll: false });
      }}
    />
  );
}
