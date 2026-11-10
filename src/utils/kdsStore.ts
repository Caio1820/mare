import { Order, OrderStatus, PaymentMethod } from '../types';
import { playKitchenBell } from './sound';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from '@firebase/firestore';

const STORAGE_KEY = 'mare_orders_v4';
const CLEARED_KEY = 'mare_cleared_before_v4';
const BROADCAST_CHANNEL_NAME = 'mare_restaurant_channel';

// 18 hours max retention for active kitchen display
const MAX_ACTIVE_ORDER_AGE_MS = 18 * 60 * 60 * 1000;

// Read timestamp before which all orders have been cleared by staff
export function getClearedBeforeTimestamp(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(CLEARED_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

// Validator to strictly filter out fictitious seeds, ancient history, and completed/cleared orders
export function isOrderActiveAndFresh(order: Order): boolean {
  if (!order || !order.id) return false;
  if (order.id.includes('seed')) return false;

  // Delivered orders are finished and must never clutter the active kitchen board
  if (order.status === 'entregue') return false;

  const clearedBefore = getClearedBeforeTimestamp();
  if (order.createdAt && order.createdAt <= clearedBefore) {
    return false;
  }

  const now = Date.now();
  if (order.createdAt && now - order.createdAt > MAX_ACTIVE_ORDER_AGE_MS) {
    return false;
  }

  return true;
}

// BroadcastChannel for instant cross-tab communication in the same browser (< 5ms)
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch {
    // Ignore
  }
}

// Helper to safely read active orders from localStorage
export function readFromStorage(): Order[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleanOrders = parsed.filter(isOrderActiveAndFresh);
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

// Known order IDs set to completely prevent repeated or false sound chimes
const knownOrderIds: Set<string> = new Set(readFromStorage().map((o) => o.id));
let lastBellTime = 0;
let isInitialSyncDone = false;

// In-memory cache
let cachedOrders: Order[] = typeof window !== 'undefined' ? readFromStorage() : [];
let eventSource: EventSource | null = null;
const listeners: Set<(orders: Order[]) => void> = new Set();

// Deduplicate order list by ID and sort newest first
function deduplicateAndSortOrders(orderList: Order[]): Order[] {
  const map = new Map<string, Order>();

  for (const ord of orderList) {
    if (!isOrderActiveAndFresh(ord)) continue;

    const existing = map.get(ord.id);
    if (!existing) {
      map.set(ord.id, ord);
    } else {
      // Keep whichever has a more advanced status or newer announcement
      const statusWeight: Record<OrderStatus, number> = {
        recebido: 1,
        preparo: 2,
        pronto: 3,
        entregue: 4,
      };

      const existingWeight = statusWeight[existing.status] || 0;
      const newWeight = statusWeight[ord.status] || 0;

      if (newWeight >= existingWeight) {
        map.set(ord.id, {
          ...existing,
          ...ord,
          announcedAt: Math.max(existing.announcedAt || 0, ord.announcedAt || 0) || undefined,
        });
      }
    }
  }

  // Sort newest first
  return Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// Helper to notify all internal listeners and persistent storage
function notifyListeners(rawOrders: Order[], isRemoteUpdate = false) {
  const cleanOrders = deduplicateAndSortOrders(rawOrders);
  const now = Date.now();

  // AUDIO CHIME: Only ring the kitchen bell if:
  // 1. Initial page load has already completed (no bell on refresh/mount)
  // 2. An order has status === 'recebido'
  // 3. The order ID was NOT previously known
  // 4. The order was freshly created within the last 45 seconds (never ring for historical orders)
  // 5. At least 3.0 seconds have elapsed since the last bell (debounce)
  if (isInitialSyncDone && now - lastBellTime > 3000) {
    const freshIncomingRecebido = cleanOrders.find(
      (o) =>
        o.status === 'recebido' &&
        !knownOrderIds.has(o.id) &&
        o.createdAt &&
        now - o.createdAt < 45000
    );

    if (freshIncomingRecebido) {
      try {
        playKitchenBell();
        lastBellTime = now;
      } catch {
        // Ignore audio errors
      }
    }
  }

  // Register all current IDs so they never trigger the bell again
  for (const o of cleanOrders) {
    knownOrderIds.add(o.id);
  }

  cachedOrders = cleanOrders;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanOrders));
    } catch {
      // Ignore
    }
  }

  for (const listener of listeners) {
    try {
      listener(cleanOrders);
    } catch (e) {
      console.error('Error in order listener:', e);
    }
  }

  // Cross-tab broadcast via BroadcastChannel
  if (!isRemoteUpdate && broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'ORDERS_UPDATED', orders: cleanOrders });
    } catch {
      // Ignore
    }
  }
}

// Initialize SSE connection for real-time push from backend (Node / Cloud Run)
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
          isInitialSyncDone = true;
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = () => {
      eventSource?.close();
      eventSource = null;
      setTimeout(initSSE, 3500);
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
    } else if (event.key === CLEARED_KEY) {
      // Another tab cleared orders
      cachedOrders = [];
      notifyListeners([], true);
    }
  });
}

// Initial cache load from localStorage
export function getStoredOrders(): Order[] {
  if (typeof window !== 'undefined') {
    const fromStorage = readFromStorage();
    if (fromStorage.length > 0) {
      cachedOrders = fromStorage;
      fromStorage.forEach((o) => knownOrderIds.add(o.id));
      return cachedOrders;
    }
  }
  return cachedOrders;
}

// Firestore real-time synchronization across devices
let firestoreUnsubscribe: (() => void) | null = null;

export function initFirestoreSync() {
  if (typeof window === 'undefined' || !db) return;
  if (firestoreUnsubscribe) return;

  try {
    const ordersCol = collection(db, 'orders');
    // Limit to 30 most recent documents
    const q = query(ordersCol, orderBy('createdAt', 'desc'), limit(30));

    firestoreUnsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteOrders: Order[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Order;
            // Strictly check if active, not delivered, not seed, not cleared
            if (isOrderActiveAndFresh(data)) {
              remoteOrders.push(data);
            }
          });

          // Merge cleanly with local cache without clobbering or resurrecting deleted orders
          const merged = deduplicateAndSortOrders([...remoteOrders, ...cachedOrders]);
          notifyListeners(merged, true);
          isInitialSyncDone = true;
        }
      },
      (err) => {
        console.warn('[Firestore] Realtime sync error, falling back to REST/SSE:', err);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Failed to attach realtime listener:', err);
  }
}

// Clear all orders (Called by Staff in Kitchen)
export async function clearAllOrders(deleteAll = false): Promise<void> {
  const now = Date.now();
  if (deleteAll) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CLEARED_KEY, String(now));
      } catch {
        // Ignore
      }
    }
    // Record current IDs as cleared
    cachedOrders.forEach((o) => knownOrderIds.add(o.id));
    cachedOrders = [];
    notifyListeners([], false);
  } else {
    const current = readFromStorage();
    const nextOrders = current.filter(isOrderActiveAndFresh);
    notifyListeners(nextOrders, false);
  }

  // Delete on server backend
  try {
    await fetch(`/api/orders/clear?all=${deleteAll ? 'true' : 'false'}`, {
      method: 'DELETE',
    });
  } catch {
    // Ignore offline errors
  }

  // If connected to Firestore and staff clicked clear all, archive or clean remote docs
  if (deleteAll && db) {
    try {
      const currentList = [...cachedOrders];
      for (const ord of currentList) {
        try {
          await deleteDoc(doc(db, 'orders', ord.id));
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  }
}

// Sync function called periodically: checks backend API
export async function syncOrders(): Promise<Order[]> {
  try {
    const res = await fetch(`/api/orders?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const orders = await res.json();
      if (Array.isArray(orders)) {
        notifyListeners(orders, true);
        isInitialSyncDone = true;
        return cachedOrders;
      }
    }
  } catch {
    // Backend API offline or static deploy
  }

  // Fallback: check localStorage for any cross-tab changes
  if (typeof window !== 'undefined') {
    const fromStorage = readFromStorage();
    if (fromStorage.length !== cachedOrders.length) {
      notifyListeners(fromStorage, true);
      isInitialSyncDone = true;
      return fromStorage;
    }
  }

  isInitialSyncDone = true;
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

  // Generate canonical ID on client
  const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  // Mark this ID as already known by this client so we don't play a bell sound for our own creation
  knownOrderIds.add(orderId);

  const localNewOrder: Order = {
    id: orderId,
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

  // 1. Immediately update local storage and notify local listeners
  const updatedList = [localNewOrder, ...current];
  notifyListeners(updatedList, false);

  // 2. Persist to Firestore in real time for cross-device sync (Mobile -> Kitchen tablet)
  try {
    const orderDocRef = doc(db, 'orders', localNewOrder.id);
    await setDoc(orderDocRef, localNewOrder);
  } catch (firestoreErr) {
    console.warn('[Firestore] Erro ao sincronizar com Firestore:', firestoreErr);
  }

  // 3. Send to backend server with the same ID
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...orderPayload,
        id: localNewOrder.id,
        createdAt: localNewOrder.createdAt,
      }),
    });

    if (res.ok) {
      const serverOrder: Order = await res.json();
      knownOrderIds.add(serverOrder.id);

      // Smoothly replace local order with server order (incorporating official daily sequence #001)
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
    return clean.toUpperCase() === 'MARE123';
  }
}

// Subscribe to real-time order updates
export function subscribeToOrders(callback: (orders: Order[]) => void): () => void {
  listeners.add(callback);

  // Send current cached orders immediately
  const initial = getStoredOrders();
  callback(initial);

  // Mark all initial orders as known so they never ring the bell on load
  initial.forEach((o) => knownOrderIds.add(o.id));

  // Attach Firestore real-time listener
  initFirestoreSync();

  // Ensure SSE is active
  initSSE();

  // Initial sync call
  syncOrders().then(() => {
    isInitialSyncDone = true;
  });

  // Safe background poll every 4 seconds (as fallback if SSE or Firestore hiccups)
  const pollTimer = setInterval(() => {
    syncOrders();
  }, 4000);

  return () => {
    listeners.delete(callback);
    clearInterval(pollTimer);
    if (listeners.size === 0 && firestoreUnsubscribe) {
      firestoreUnsubscribe();
      firestoreUnsubscribe = null;
    }
  };
}
