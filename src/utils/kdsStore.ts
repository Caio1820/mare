import { Order, OrderStatus, PaymentMethod } from '../types';
import { playKitchenBell } from './sound';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from '@firebase/firestore';

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

// Initial state is empty for clean production without fictitious orders
const INITIAL_SEEDED_ORDERS: Order[] = [];

// Helper to safely read from localStorage
export function readFromStorage(): Order[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out any fictitious seeds that were previously stored in this browser
        const cleanOrders = parsed.filter((o: Order) => !o.id?.includes('seed'));
        if (cleanOrders.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanOrders));
        }
        return cleanOrders;
      }
    }
  } catch {
    // Ignore JSON errors
  }
  return [];
}

// In-memory cache initialized directly from localStorage if present
let cachedOrders: Order[] = typeof window !== 'undefined' ? readFromStorage() : [];
let previousOrderCount = cachedOrders.length;
let eventSource: EventSource | null = null;
const listeners: Set<(orders: Order[]) => void> = new Set();

// Helper to notify all internal listeners and persistent storage
function notifyListeners(orders: Order[], isRemoteUpdate = false) {
  // Check if new orders with status 'recebido' arrived that were not in cachedOrders
  if (cachedOrders.length > 0) {
    const hasIncomingRecebido = orders.some(
      (o) => o.status === 'recebido' && !cachedOrders.some((c) => c.id === o.id)
    );
    if (hasIncomingRecebido) {
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
      setTimeout(initSSE, 2500);
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

// Firestore real-time synchronization across ALL devices and networks
let firestoreUnsubscribe: (() => void) | null = null;

export function initFirestoreSync() {
  if (typeof window === 'undefined' || !db) return;
  if (firestoreUnsubscribe) return;

  try {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, orderBy('createdAt', 'desc'), limit(100));
    firestoreUnsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteOrders: Order[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Order;
            // Discard any seeds in remote Firestore as well
            if (!data.id?.includes('seed')) {
              remoteOrders.push(data);
            }
          });
          notifyListeners(remoteOrders, true);
        } else {
          // If Firestore is empty, ensure clean state
          notifyListeners([], true);
        }
      },
      (err) => {
        console.warn('[Firestore] Realtime sync error, falling back to REST/polling:', err);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Failed to attach realtime listener:', err);
  }
}

// Clear all orders or purge fictitious seeds (Called by Staff in Kitchen)
export async function clearAllOrders(deleteAll = false): Promise<void> {
  const current = readFromStorage();
  const nextOrders = deleteAll ? [] : current.filter((o) => !o.id?.includes('seed'));
  notifyListeners(nextOrders, false);

  try {
    await fetch(`/api/orders/clear?all=${deleteAll ? 'true' : 'false'}`, {
      method: 'DELETE',
    });
  } catch {
    // Ignore offline errors
  }
}

// Sync function called periodically: checks backend API, and if unavailable (e.g. Vercel static), syncs from localStorage
export async function syncOrders(): Promise<Order[]> {
  try {
    const res = await fetch(`/api/orders?t=${Date.now()}`, { cache: 'no-store' });
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

// Create new order (from Kiosk or Mobile QR scan)
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

  // 1. IMMEDIATELY update local storage, cached orders, and broadcast to other open tabs!
  const updatedList = [localNewOrder, ...current];
  notifyListeners(updatedList, false);

  // 2. Persist to Firestore in real time for cross-device synchronization (Customer Phone -> Kitchen Tablet)
  try {
    const orderDocRef = doc(db, 'orders', localNewOrder.id);
    await setDoc(orderDocRef, localNewOrder);
    console.log('[Firestore] Pedido sincronizado em tempo real na nuvem:', localNewOrder.orderNumber);
  } catch (firestoreErr) {
    console.warn('[Firestore] Erro ao sincronizar com Firestore:', firestoreErr);
  }

  // 3. In parallel, attempt to sync with backend server if available
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
      try {
        await setDoc(doc(db, 'orders', serverOrder.id), serverOrder);
      } catch {
        // ignore
      }
      return serverOrder;
    } else {
      const errText = await res.text();
      console.error('Falha ao enviar pedido ao servidor (/api/orders):', res.status, errText);
    }
  } catch (err) {
    console.warn('Backend API indisponível, pedido mantido localmente:', err);
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

  // 2. Update Firestore in real time for all devices (Kitchen -> TV Panel / Customer Screen)
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    const updatePayload: any = { status: nextStatus };
    if (nextStatus === 'pronto') {
      updatePayload.announcedAt = Date.now();
    }
    await updateDoc(orderDocRef, updatePayload);
  } catch (e) {
    console.warn('[Firestore] Erro ao atualizar status no Firestore:', e);
  }

  // 3. In parallel, notify backend server if available
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
  const now = Date.now();
  const updated = current.map((ord) => {
    if (ord.id === orderId) {
      return {
        ...ord,
        announcedAt: now,
      };
    }
    return ord;
  });
  notifyListeners(updated, false);

  try {
    const orderDocRef = doc(db, 'orders', orderId);
    await updateDoc(orderDocRef, { announcedAt: now });
  } catch {
    // Ignore
  }

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'ORDER_ANNOUNCED', orderId, timestamp: now });
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

  // Attach Firestore real-time listener (works across different phones, tablets, networks)
  initFirestoreSync();

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
    if (listeners.size === 0 && firestoreUnsubscribe) {
      firestoreUnsubscribe();
      firestoreUnsubscribe = null;
    }
  };
}
