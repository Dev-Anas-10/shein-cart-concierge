import { Order } from './types';

const CLIENT_ORDERS_KEY = 'shein_concierge_client_orders';

export function getClientOrders(filterUserId?: string, filterEmail?: string): Order[] {
  if (typeof window === 'undefined') return [];
  // For privacy, if no user is specified, return nothing!
  if (!filterUserId && !filterEmail) return [];

  try {
    const raw = localStorage.getItem(CLIENT_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const lowerEmail = filterEmail?.toLowerCase().trim();
    return parsed.filter((o: Order) => {
      if (filterUserId && o.userId === filterUserId) return true;
      if (lowerEmail && o.userEmail && o.userEmail.toLowerCase().trim() === lowerEmail) return true;
      return false;
    });
  } catch (err) {
    console.warn('Error reading client orders:', err);
    return [];
  }
}

export function saveClientOrder(order: Order): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CLIENT_ORDERS_KEY);
    const current: Order[] = raw ? JSON.parse(raw) : [];
    const existingIdx = Array.isArray(current) ? current.findIndex((o) => o.id === order.id) : -1;
    let updated: Order[];
    if (existingIdx >= 0) {
      updated = [...current];
      updated[existingIdx] = order;
    } else {
      updated = [order, ...(Array.isArray(current) ? current : [])];
    }
    localStorage.setItem(CLIENT_ORDERS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Error saving client order:', err);
  }
}

export function mergeAndDeduplicateOrders(serverOrders: Order[], clientOrders: Order[]): Order[] {
  const map = new Map<string, Order>();

  // Add client orders first
  for (const o of clientOrders) {
    map.set(o.id, o);
  }

  // Server orders take precedence if they are newer or have updated status
  for (const o of serverOrders) {
    map.set(o.id, o);
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
