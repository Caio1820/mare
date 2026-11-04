import { Order, OrderStatus } from '../types';
import { playKitchenBell } from './sound';

const STORAGE_KEY = 'mare_orders_v2';
const BROADCAST_CHANNEL_NAME = 'mare_restaurant_channel';

// BroadcastChannel for cross-tab multi-window instant communication
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch {
    // Ignore
  }
}

// In-memory cache
let cachedOrders: Order[] = [];
let isConnectedSSE = false;
let eventSource: EventSource | null = null;
const listeners: Set<(orders: Order[]) => void> = new Set();

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
          image: '/src/assets/images/hero_idle_burger_1793068213371.jpg',
          isBurger: true,
          defaultIngredients: ['Pão brioche', 'Blend 180g', 'Bacon caramelizado'],
          suggestedAddons: [],
        },
        quantity: 1,
        customization: {
          meatDoneness: 'Ao ponto',
          removedIngredients: ['Cebola roxa'],
          selectedAddons: { queijo_extra: 1 },
          specialNotes: 'Bacon bem tostadinho por favor',
        },
        unitPrice: 39.40,
        totalPrice: 39.40,
      },
      {
        cartItemId: 'item-seed-2',
        product: {
          id: 'batata_mare',
          name: 'Batata da Maré',
          categoryId: 'entradas',
          categoryLabel: 'Primeira Onda',
          price: 24.90,
          description: '',
          image: '/src/assets/images/mare_porcoes_batata_1793068213557.jpg',
          isBurger: false,
          defaultIngredients: ['Batatas rústicas'],
          suggestedAddons: [],
        },
        quantity: 1,
        unitPrice: 24.90,
        totalPrice: 24.90,
      },
    ],
    observations: 'Sem guardanapos plásticos, por favor.',
    subtotal: 64.30,
    total: 64.30,
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
          image: '/src/assets/images/mare_nobre_burger_1793068212982.jpg',
          isBurger: true,
          defaultIngredients: ['Pão australiano', 'Blend nobre 200g'],
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
          price: 23.90,
          description: '',
          image: '/src/assets/images/mare_smash_burger_1793068213279.jpg',
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

// Helper to notify all internal listeners and persistent storage
function notifyListeners(orders: Order[], isRemoteUpdate = false) {
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

  // Cross-tab broadcast
  if (!isRemoteUpdate && broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'ORDERS_UPDATED', orders });
    } catch {
      // Ignore
    }
  }
}

// Initialize SSE connection for Real-Time cross-device synchronization
function initSSE() {
  if (typeof window === 'undefined') return;
  if (eventSource) return;

  try {
    eventSource = new EventSource('/api/orders/stream');

    eventSource.onopen = () => {
      isConnectedSSE = true;
    };

    eventSource.onmessage = (event) => {
      try {
        const orders = JSON.parse(event.data);
        if (Array.isArray(orders)) {
          // Check if a new order arrived to trigger short chime
          if (cachedOrders.length > 0 && orders.length > cachedOrders.length) {
            playKitchenBell();
          }
          notifyListeners(orders, true);
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = () => {
      isConnectedSSE = false;
      // If server SSE fails or disconnects, retry in 5s
      eventSource?.close();
      eventSource = null;
      setTimeout(initSSE, 5000);
    };
  } catch (err) {
    console.error('Failed to init SSE:', err);
  }
}

// Listen to local BroadcastChannel (instant multi-tab sync)
if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    if (event.data?.type === 'ORDERS_UPDATED' && Array.isArray(event.data.orders)) {
      cachedOrders = event.data.orders;
      notifyListeners(event.data.orders, true);
    }
  };
}

// Initial cache load from localStorage or seeds
export function getStoredOrders(): Order[] {
  if (cachedOrders.length > 0) return cachedOrders;
  if (typeof window === 'undefined') return INITIAL_SEEDED_ORDERS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      cachedOrders = JSON.parse(raw);
      return cachedOrders;
    }
  } catch {
    // Ignore
  }

  cachedOrders = INITIAL_SEEDED_ORDERS;
  return cachedOrders;
}

// Fetch orders from backend API
export async function fetchOrdersFromApi(): Promise<Order[]> {
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
    // If backend isn't ready or offline, return local cache
  }
  return getStoredOrders();
}

// Create new order (from Kiosk)
export async function createOrder(orderPayload: {
  customerName: string;
  orderType: 'local' | 'viagem';
  tableNumber?: string;
  items: any[];
  observations?: string;
  subtotal: number;
  total: number;
  paymentMethod: 'pix' | 'cartao_balcao' | 'dinheiro_balcao';
  paymentStatus: 'pago' | 'pendente_balcao';
}): Promise<Order> {
  try {
    // Try sending to Express backend
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });

    if (res.ok) {
      const newOrder: Order = await res.json();
      return newOrder;
    }
  } catch (err) {
    console.warn('Backend POST /api/orders failed, using local offline fallback:', err);
  }

  // Offline fallback
  const current = getStoredOrders();
  const nextNum = current.length + 1;
  const numStr = String(nextNum).padStart(3, '0');
  const now = new Date();

  const fallbackOrder: Order = {
    id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    orderNumber: `#${numStr}`,
    customerName: orderPayload.customerName.trim(),
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
    formattedTime: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    estimatedMinutes: 15,
  };

  const updated = [fallbackOrder, ...current];
  notifyListeners(updated, false);
  return fallbackOrder;
}

// Update order status (from Kitchen)
export async function updateOrderStatus(orderId: string, nextStatus: OrderStatus): Promise<void> {
  try {
    // Try sending to Express backend
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (res.ok) {
      return;
    }
  } catch (err) {
    console.warn('Backend PATCH failed, updating local state:', err);
  }

  // Offline fallback
  const current = getStoredOrders();
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

  // Ensure SSE is active
  initSSE();

  return () => {
    listeners.delete(callback);
  };
}
