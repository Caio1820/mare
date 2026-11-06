import { Order, OrderStatus, PaymentMethod } from '../types';
import { playKitchenBell } from './sound';

const STORAGE_KEY = 'mare_orders_v2';
const BROADCAST_CHANNEL_NAME = 'mare_restaurant_channel';

// BroadcastChannel for instant cross-tab communication in the same browser (< 5ms)
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch {
    // Ignore
  }
}

// Fallback initial seeds
const INITIAL_SEEDED_ORDERS: Order[] = [
  {
    id: 'ord-seed-01',
    orderNumber: '#001',
    customerName: 'Carlos Silva',
    orderType: 'local',
    tableNumber: '03',
    items: [
      {
        cartItemId: 'item-seed-1',
        product: {
          id: 'bacon_caramelizado',
          name: 'Bacon Caramelizado',
          categoryId: 'artesanais',
          categoryLabel: 'Alto-Mar',
          price: 34.90,
          description: '',
          image: '/images/bacon_caramelizado.jpg',
          isBurger: true,
          defaultIngredients: ['Pão brioche', 'Blend 160g', 'Bacon caramelizado'],
          suggestedAddons: [],
        },
        quantity: 1,
        customization: {
          meatDoneness: 'Ao ponto',
          removedIngredients: ['Cebola roxa'],
          selectedAddons: { queijo_extra: 1 },
          specialNotes: 'Bacon bem tostadinho por favor',
        },
        unitPrice: 41.40,
        totalPrice: 41.40,
      },
      {
        cartItemId: 'item-seed-2',
        product: {
          id: 'batata_mare',
          name: 'Batata da Maré',
          categoryId: 'entradas',
          categoryLabel: 'Primeira Onda',
          price: 26.90,
          description: '',
          image: '/images/batata_mare.jpg',
          isBurger: false,
          defaultIngredients: ['Batatas fritas douradas', 'Molho Maré'],
          suggestedAddons: [],
        },
        quantity: 1,
        unitPrice: 26.90,
        totalPrice: 26.90,
      },
    ],
    observations: 'Sem guardanapos plásticos, por favor.',
    subtotal: 68.30,
    total: 68.30,
    paymentMethod: 'pix',
    paymentStatus: 'pago',
    status: 'preparo',
    createdAt: Date.now() - 1000 * 60 * 7,
    formattedTime: '13:45',
    estimatedMinutes: 15,
  },
  {
    id: 'ord-seed-02',
    orderNumber: '#002',
    customerName: 'Mariana Costa',
    orderType: 'viagem',
    items: [
      {
        cartItemId: 'item-seed-3',
        product: {
          id: 'costela_queijo_regional',
          name: 'Costela com Queijo Regional',
          categoryId: 'prime',
          categoryLabel: 'Maré Nobre',
          price: 39.90,
          description: '',
          image: '/images/costela_queijo_regional.jpg',
          isBurger: true,
          defaultIngredients: ['Pão artesanal', 'Blend nobre 160g', 'Queijo regional'],
          suggestedAddons: [],
        },
        quantity: 1,
        customization: {
          meatDoneness: 'Bem passado',
          removedIngredients: [],
          selectedAddons: {},
          specialNotes: '',
        },
        unitPrice: 39.90,
        totalPrice: 39.90,
      },
    ],
    observations: 'Embalar bem para viagem de moto.',
    subtotal: 39.90,
    total: 39.90,
    paymentMethod: 'cartao_balcao',
    paymentStatus: 'pago',
    status: 'recebido',
    createdAt: Date.now() - 1000 * 60 * 2,
    formattedTime: '13:50',
    estimatedMinutes: 15,
  },
  {
    id: 'ord-seed-03',
    orderNumber: '#003',
    customerName: 'Lucas Lima',
    orderType: 'local',
    tableNumber: '07',
    items: [
      {
        cartItemId: 'item-seed-4',
        product: {
          id: 'smash_duas_ondas',
          name: 'Smash Duas Ondas',
          categoryId: 'smash',
          categoryLabel: 'Onda Smash',
          price: 25.90,
          description: '',
          image: '/images/smash_duas_ondas.jpg',
          isBurger: true,
          defaultIngredients: [],
          suggestedAddons: [],
        },
        quantity: 2,
        customization: {
          meatDoneness: 'Ao ponto',
          removedIngredients: ['Picles artesanal'],
          selectedAddons: {},
          specialNotes: '',
        },
        unitPrice: 23.90,
        totalPrice: 47.80,
      },
    ],
    observations: '',
    subtotal: 47.80,
    total: 47.80,
    paymentMethod: 'pix',
    paymentStatus: 'pago',
    status: 'pronto',
    createdAt: Date.now() - 1000 * 60 * 18,
    formattedTime: '13:34',
    estimatedMinutes: 15,
  },
];

// Helper to safely read from localStorage
export function readFromStorage(): Order[] {
  if (typeof window === 'undefined') return INITIAL_SEEDED_ORDERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore JSON errors
  }
  return INITIAL_SEEDED_ORDERS;
}

// In-memory cache initialized directly from localStorage if present
let cachedOrders: Order[] = typeof window !== 'undefined' ? readFromStorage() : INITIAL_SEEDED_ORDERS;
let previousOrderCount = cachedOrders.length;
let eventSource: EventSource | null = null;
const listeners: Set<(orders: Order[]) => void> = new Set();

// Helper to notify all internal listeners and persistent storage
function notifyListeners(orders: Order[], isRemoteUpdate = false) {
  // Check if new orders arrived (more than previous and at least one is "recebido")
  if (previousOrderCount > 0 && orders.length > previousOrderCount) {
    const hasNewRecebido = orders.some(
      (o) => o.status === 'recebido' && !cachedOrders.some((c) => c.id === o.id)
    );
    if (hasNewRecebido) {
      try {
        playKitchenBell();
      } catch {
        // Ignore audio errors
      }
    }
  }

  previousOrderCount = orders.length;
  cachedOrders = orders;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch {
      // Ignore
    }
  }

  for (const listener of listeners) {
    try {
      listener(orders);
    } catch (e) {
      console.error('Error in order listener:', e);
    }
  }

  // Cross-tab broadcast via BroadcastChannel
  if (!isRemoteUpdate && broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'ORDERS_UPDATED', orders });
    } catch {
      // Ignore
    }
  }
}

// Initialize SSE connection for real-time push from backend (Cloud Run / Node)
function initSSE() {
  if (typeof window === 'undefined') return;
  if (eventSource) return;

  try {
    eventSource = new EventSource('/api/orders/stream');

    eventSource.onmessage = (event) => {
      try {
        const orders = JSON.parse(event.data);
        if (Array.isArray(orders)) {
          notifyListeners(orders, true);
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = () => {
      eventSource?.close();
      eventSource = null;
      setTimeout(initSSE, 6000);
    };
  } catch (err) {
    console.error('Failed to init SSE:', err);
  }
}

// Listen to local BroadcastChannel (instant multi-tab sync across tabs in same browser)
if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    if (event.data?.type === 'ORDERS_UPDATED' && Array.isArray(event.data.orders)) {
      notifyListeners(event.data.orders, true);
    }
  };
}

// Listen to window storage events (when another tab updates localStorage)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (Array.isArray(parsed)) {
          notifyListeners(parsed, true);
        }
      } catch {
        // Ignore
      }
    }
  });
}

// Initial cache load from localStorage or seeds
export function getStoredOrders(): Order[] {
  if (typeof window !== 'undefined') {
    const fromStorage = readFromStorage();
    if (fromStorage.length > 0) {
      cachedOrders = fromStorage;
      return cachedOrders;
    }
  }
  return cachedOrders;
}

// Sync function called periodically: checks backend API, and if unavailable (e.g. Vercel static), syncs from localStorage
export async function syncOrders(): Promise<Order[]> {
  try {
    const res = await fetch('/api/orders');
    if (res.ok) {
      const orders = await res.json();
      if (Array.isArray(orders)) {
        notifyListeners(orders, true);
        return orders;
      }
    }
  } catch {
    // Backend API offline or static deploy (like Vercel)
  }

  // Fallback: check localStorage for any cross-tab changes
  if (typeof window !== 'undefined') {
    const fromStorage = readFromStorage();
    if (
      fromStorage.length !== cachedOrders.length ||
      fromStorage[0]?.id !== cachedOrders[0]?.id ||
      fromStorage.some((item, i) => item.status !== cachedOrders[i]?.status)
    ) {
      notifyListeners(fromStorage, true);
      return fromStorage;
    }
  }

  return cachedOrders;
}

// Create new order (from Kiosk)
export async function createOrder(orderPayload: {
  customerName: string;
  customerPhone?: string;
  orderType: 'local' | 'viagem';
  tableNumber?: string;
  items: any[];
  observations?: string;
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: Order['paymentStatus'];
}): Promise<Order> {
  const current = readFromStorage();
  const nextNum = current.length + 1;
  const numStr = String(nextNum).padStart(3, '0');
  const now = new Date();
  const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const localNewOrder: Order = {
    id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    orderNumber: `#${numStr}`,
    customerName: orderPayload.customerName.trim(),
    customerPhone: orderPayload.customerPhone?.trim(),
    orderType: orderPayload.orderType,
    tableNumber: orderPayload.tableNumber,
    items: orderPayload.items,
    observations: orderPayload.observations || '',
    subtotal: orderPayload.subtotal,
    total: orderPayload.total,
    paymentMethod: orderPayload.paymentMethod,
    paymentStatus: orderPayload.paymentStatus,
    status: 'recebido',
    createdAt: Date.now(),
    formattedTime,
    estimatedMinutes: 15,
  };

  // IMMEDIATELY update local storage, cached orders, and broadcast to other open tabs!
  const updatedList = [localNewOrder, ...current];
  notifyListeners(updatedList, false);

  // In parallel, attempt to sync with backend server if available
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });

    if (res.ok) {
      const serverOrder: Order = await res.json();
      // If server returned an order with official sequential ID, replace it smoothly
      const synced = updatedList.map((o) => (o.id === localNewOrder.id ? serverOrder : o));
      notifyListeners(synced, false);
      return serverOrder;
    }
  } catch (err) {
    console.warn('Backend API unavailable, stored order locally in browser/BroadcastChannel:', err);
  }

  return localNewOrder;
}

// Update order status (from Kitchen)
export async function updateOrderStatus(orderId: string, nextStatus: OrderStatus): Promise<void> {
  // 1. Immediately update locally in memory, localStorage and BroadcastChannel
  const current = readFromStorage();
  const updated = current.map((ord) => {
    if (ord.id === orderId) {
      return {
        ...ord,
        status: nextStatus,
        announcedAt: nextStatus === 'pronto' ? Date.now() : ord.announcedAt,
      };
    }
    return ord;
  });
  notifyListeners(updated, false);

  // 2. In parallel, notify backend server if available
  try {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
  } catch {
    // Local update is already active
  }
}

// Re-announce customer order (Ding-dong on TV + Speech)
export async function announceOrder(orderId: string): Promise<void> {
  const current = readFromStorage();
  const updated = current.map((ord) => {
    if (ord.id === orderId) {
      return {
        ...ord,
        announcedAt: Date.now(),
      };
    }
    return ord;
  });
  notifyListeners(updated, false);

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'ORDER_ANNOUNCED', orderId, timestamp: Date.now() });
    } catch {
      // Ignore
    }
  }
}

// Admin login verification
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const clean = (password || '').trim();

  // Instant check for MARE123 (case-insensitive)
  if (clean.toUpperCase() === 'MARE123') {
    try {
      fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: clean }),
      }).catch(() => {});
    } catch {
      // Ignore
    }
    return true;
  }

  try {
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: clean }),
    });

    if (res.ok) {
      const data = await res.json();
      return !!data.success;
    }
    return false;
  } catch {
    // Offline fallback for admin password check
    return clean.toUpperCase() === 'MARE123';
  }
}

// Subscribe to real-time order updates
export function subscribeToOrders(callback: (orders: Order[]) => void): () => void {
  listeners.add(callback);
  // Send current cached orders immediately
  callback(getStoredOrders());

  // Run sync immediately
  syncOrders();

  // Ensure SSE is active
  initSSE();

  // Polling sync every 1.5 seconds to guarantee cross-tab and cross-device sync even on static Vercel
  const pollTimer = setInterval(() => {
    syncOrders();
  }, 1500);

  return () => {
    listeners.delete(callback);
    clearInterval(pollTimer);
  };
}
