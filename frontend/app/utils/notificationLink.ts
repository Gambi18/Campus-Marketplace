import type { AppNotification } from '../types/notifications';

// Builds the in-app href for a notification, preferring structured `metadata`
// over the stored `link`. This rescues legacy NEW_MESSAGE notifications whose
// `link` used the old 3-segment `/conversations/{productId}/{senderId}` shape,
// which 404s against the `/conversations/[productId]?user=...` route.
export function notificationHref(n: AppNotification): string {
  const meta = (n.metadata ?? {}) as Record<string, unknown>;
  const productId = typeof meta.product_id === 'string' ? meta.product_id : '';
  const senderId = typeof meta.sender_id === 'string' ? meta.sender_id : '';

  if (n.type === 'NEW_MESSAGE' && productId && senderId) {
    return `/conversations/${productId}?user=${senderId}`;
  }

  // Rewrite a stored old-format conversation link into the query-param form.
  if (n.link) {
    const m = n.link.match(/^\/conversations\/([^/?#]+)\/([^/?#]+)$/);
    if (m) {
      return `/conversations/${m[1]}?user=${m[2]}`;
    }
    return n.link;
  }

  return '#';
}
