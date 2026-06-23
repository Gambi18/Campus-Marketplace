import type { AppNotification } from '../types/notifications';

export function notificationHref(n: AppNotification): string {
  const meta = (n.metadata ?? {}) as Record<string, unknown>;
  const productId = typeof meta.product_id === 'string' ? meta.product_id : '';
  const senderId = typeof meta.sender_id === 'string' ? meta.sender_id : '';

  switch (n.type) {
    case 'NEW_MESSAGE':
      if (productId && senderId) {
        return `/conversations/${productId}?user=${senderId}`;
      }
      break;

    case 'ACCOUNT_APPROVED':
    case 'ACCOUNT_REJECTED':
      return '/profile';

    case 'ACCOUNT_BLOCKED':
      return '#';

    case 'PAYMENT_RECEIVED':
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RELEASED':
      if (productId) {
        return `/details/${productId}`;
      }
      return '/my-sales';

    case 'ITEM_SOLD':
      return '/my-sales';

    case 'LISTING_APPROVED':
    case 'LISTING_REJECTED':
      return '/mylistings';
  }

  // Fallback: rewrite old-format 3-segment links to query-param form
  if (n.link) {
    const m = n.link.match(/^\/conversations\/([^/?#]+)\/([^/?#]+)$/);
    if (m) {
      return `/conversations/${m[1]}?user=${m[2]}`;
    }
    return n.link;
  }

  return '#';
}
