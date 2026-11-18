import { CartItem, Order, OrderStatus, PaymentMethod } from '../types';
import { playKitchenBell } from './sound';
import {
  upsertOrderInFirestore,
  updateOrderPatchInFirestore,
  fetchOrdersByRangeFromFirestore,
  deleteAllOrdersFromFirestore,
} from '../lib/firebase';

const STORAGE_KEY = 'mare_orders_v5';
const HISTORY_STORAGE_KEY = 'mare_orders_history_v1';
const CLEARED_KEY = 'mare_cleared_before_v5';
const BROADCAST_CHANNEL_NAME = 'mare_restaurant_channel';

// 18 hours max retention for active kitchen display
const MAX_ACTIVE_ORDER_AGE_MS = 18 * 60 * 60 * 1000;

function readHistoryFromStorage(): Order[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((o) => !!o && !!o.id && !String(o.id).includes('seed'));
    }
  } catch {
    // Ignore storage read errors
  }
  return [];
}

function upsertOrdersIntoLocalHistory(incoming: Order[]): void {
  if (typeof window === 'undefined' || !Array.isArray(incoming) || incoming.length === 0) return;
  try {
    const existing = readHistoryFromStorage();
    const map = new Map<string, Order>();
    for (const o of existing) {
      map.set(o.id, o);
    }
    for (const o of incoming) {
      if (!o || !o.id || String(o.id).includes('seed')) continue;
      const prev = map.get(o.id);
      map.set(o.id, prev ? mergeOrderRecords(prev, o) : o);
    }
    const sorted = Array.from(map.values())
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 3000);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(sorted));
  } catch {
    // Ignore storage quota errors
  }
}

function mergeOrderRecords(a: Order, b: Order): Order {
  const statusWeight: Record<OrderStatus, number> = {
    recebido: 1,
    preparo: 2,
    pronto: 3,
    entregue: 4,
    cancelado: 5,
  };
  const weightA = statusWeight[a.status] || 0;
  const weightB = statusWeight[b.status] || 0;
  const primary = weightB >= weightA ? b : a;
  const secondary = primary === b ? a : b;

  return {
    ...secondary,
    ...primary,
    orderNumber: primary.orderNumber || secondary.orderNumber,
    tableClosed: !!(a.tableClosed || b.tableClosed),
    closedAt: Math.max(a.closedAt || 0, b.closedAt || 0) || undefined,
    clearedFromKds: !!(a.clearedFromKds || b.clearedFromKds),
    clearedAt: Math.max(a.clearedAt || 0, b.clearedAt || 0) || undefined,
    cancelledAt: Math.max(a.cancelledAt || 0, b.cancelledAt || 0) || undefined,
    cancelReason: primary.cancelReason || secondary.cancelReason,
    paymentStatus:
      a.paymentStatus === 'pago' || b.paymentStatus === 'pago'
        ? 'pago'
        : primary.paymentStatus,
    roundNumber: Math.max(a.roundNumber || 1, b.roundNumber || 1),
    announcedAt: Math.max(a.announcedAt || 0, b.announcedAt || 0) || undefined,
  };
}

// Helper for non-blocking fetch with strict timeout so requests NEVER hang the browser
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 3500): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

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

export function isNumberedTableOrder(order: Order): boolean {
  if (!order || order.orderType !== 'local' || !order.tableNumber) return false;
  const tbl = order.tableNumber.trim().toLowerCase();
  return tbl !== '' && tbl !== 'balcão' && tbl !== 'balcao';
}

export interface PartitionedOrderItems {
  localItems: CartItem[];
  takeawayItems: CartItem[];
  hasMixedConsumption: boolean;
}

export function partitionOrderItems(order: Order): PartitionedOrderItems {
  const items = Array.isArray(order.items) ? order.items : [];
  if (order.orderType === 'viagem') {
    return {
      localItems: [],
      takeawayItems: items,
      hasMixedConsumption: false,
    };
  }

  const localItems = items.filter((item) => !item.isTakeaway);
  const takeawayItems = items.filter((item) => !!item.isTakeaway);

  return {
    localItems,
    takeawayItems,
    hasMixedConsumption: localItems.length > 0 && takeawayItems.length > 0,
  };
}

// Validator to strictly filter out fictitious seeds, ancient history, and closed/completed orders
export function isOrderActiveAndFresh(order: Order): boolean {
  if (!order || !order.id) return false;
  if (order.id.includes('seed')) return false;

  // Cancelled orders leave active KDS, TV, and open tables immediately (kept in audit history)
  if (order.status === 'cancelado') return false;

  // Closed table tabs are completely finished
  if (order.tableClosed) return false;

  // For takeaway or counter orders, once delivered they leave the active store.
  // For numbered tables (01..11), delivered rounds stay in the open table tab until the table is closed!
  if (order.status === 'entregue' && !isNumberedTableOrder(order)) {
    return false;
  }

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
      const statusWeight: Record<OrderStatus, number> = {
        recebido: 1,
        preparo: 2,
        pronto: 3,
        entregue: 4,
        cancelado: 5,
      };

      const existingWeight = statusWeight[existing.status] || 0;
      const newWeight = statusWeight[ord.status] || 0;

      if (newWeight >= existingWeight) {
        map.set(ord.id, {
          ...existing,
          ...ord,
          tableClosed: !!(existing.tableClosed || ord.tableClosed),
          roundNumber: ord.roundNumber || existing.roundNumber || 1,
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

  // AUDIO CHIME: Only ring the kitchen bell for genuinely new orders
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

// Clear all orders (Called by Staff in Kitchen)
// Historical archive (local + Firestore + server) is NEVER deleted so reports remain complete.
export async function clearAllOrders(deleteAll = false): Promise<void> {
  const now = Date.now();
  const currentActive = readFromStorage();
  const archivedBatch = currentActive
    .filter((o) => !!o && !!o.id && !o.id.includes('seed'))
    .filter((o) => deleteAll || (o.status === 'entregue' && !o.tableClosed))
    .map((o) => ({ ...o, clearedFromKds: true, clearedAt: now }));

  if (archivedBatch.length > 0) {
    upsertOrdersIntoLocalHistory(archivedBatch);
    Promise.allSettled(
      archivedBatch.map((o) =>
        updateOrderPatchInFirestore(o.id, { clearedFromKds: true, clearedAt: now })
      )
    ).catch(() => {});
  }

  if (deleteAll) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CLEARED_KEY, String(now));
      } catch {
        // Ignore
      }
    }
    cachedOrders.forEach((o) => knownOrderIds.add(o.id));
    cachedOrders = [];
    notifyListeners([], false);
  } else {
    const nextOrders = currentActive.filter(isOrderActiveAndFresh);
    notifyListeners(nextOrders, false);
  }

  try {
    await fetchWithTimeout(`/api/orders/clear?all=${deleteAll ? 'true' : 'false'}`, {
      method: 'DELETE',
    });
  } catch {
    // Ignore offline errors
  }
}

// Sync function called periodically: fast stateless REST check with timeout
let isSyncing = false;
export async function syncOrders(): Promise<Order[]> {
  if (isSyncing) return cachedOrders;
  isSyncing = true;

  try {
    const res = await fetchWithTimeout(`/api/orders?t=${Date.now()}`, { cache: 'no-store' }, 3000);
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
  } finally {
    isSyncing = false;
  }

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

  const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  knownOrderIds.add(orderId);

  const isNumberedTable =
    orderPayload.orderType === 'local' &&
    orderPayload.tableNumber &&
    orderPayload.tableNumber.toLowerCase() !== 'balcão' &&
    orderPayload.tableNumber.toLowerCase() !== 'balcao';

  const existingTableOrders = isNumberedTable
    ? current
        .filter(
          (o) =>
            o.orderType === 'local' &&
            o.tableNumber === orderPayload.tableNumber &&
            !o.tableClosed &&
            o.status !== 'cancelado'
        )
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    : [];

  const resolvedOrderNumber =
    isNumberedTable && existingTableOrders.length > 0
      ? existingTableOrders[0].orderNumber
      : `#${numStr}`;

  const localNewOrder: Order = {
    id: orderId,
    orderNumber: resolvedOrderNumber,
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
    tableClosed: false,
    roundNumber: isNumberedTable ? existingTableOrders.length + 1 : 1,
  };

  // 1. Immediately update local active storage, permanent local history, and notify listeners
  upsertOrdersIntoLocalHistory([localNewOrder]);
  const updatedList = [localNewOrder, ...current];
  notifyListeners(updatedList, false);

  // 2. Send to backend server with timeout so UI never freezes
  let finalOrder = localNewOrder;
  try {
    const res = await fetchWithTimeout(
      '/api/orders',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderPayload,
          id: localNewOrder.id,
          createdAt: localNewOrder.createdAt,
        }),
      },
      4000
    );

    if (res.ok) {
      const serverOrder: Order = await res.json();
      knownOrderIds.add(serverOrder.id);
      finalOrder = serverOrder;
      upsertOrdersIntoLocalHistory([serverOrder]);

      const synced = updatedList.map((o) => (o.id === localNewOrder.id ? serverOrder : o));
      notifyListeners(synced, false);
    }
  } catch (err) {
    console.warn('Backend API indisponível, pedido mantido localmente:', err);
  }

  // 3. Mirror order in Firestore cloud archive (non-blocking for offline resilience)
  upsertOrderInFirestore(finalOrder).catch((err) => {
    console.warn('Firestore indisponível no momento, mantendo histórico local:', err);
  });

  return finalOrder;
}

// Update order status (from Kitchen)
export async function updateOrderStatus(orderId: string, nextStatus: OrderStatus): Promise<void> {
  const current = readFromStorage();
  const announcedAt = nextStatus === 'pronto' ? Date.now() : undefined;
  let updatedOrder: Order | undefined;

  const updated = current.map((ord) => {
    if (ord.id === orderId) {
      updatedOrder = {
        ...ord,
        status: nextStatus,
        announcedAt: announcedAt ?? ord.announcedAt,
      };
      return updatedOrder;
    }
    return ord;
  });

  if (updatedOrder) {
    upsertOrdersIntoLocalHistory([updatedOrder]);
  }
  notifyListeners(updated, false);

  const firestorePatch: Partial<Order> = { status: nextStatus };
  if (announcedAt) {
    firestorePatch.announcedAt = announcedAt;
  }
  updateOrderPatchInFirestore(orderId, firestorePatch).catch(() => {});

  try {
    await fetchWithTimeout(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
  } catch {
    // Local update is already active
  }
}

// Cancel order from Kitchen (removes from active queue/TV/table balance and excludes from revenue)
export async function cancelOrder(orderId: string, cancelReason?: string): Promise<void> {
  const current = readFromStorage();
  const nowMs = Date.now();
  const cleanReason = (cancelReason || '').trim().slice(0, 200) || undefined;

  const target =
    current.find((o) => o.id === orderId) ||
    readHistoryFromStorage().find((o) => o.id === orderId);

  if (target) {
    const cancelledOrder: Order = {
      ...target,
      status: 'cancelado',
      cancelledAt: nowMs,
      cancelReason: cleanReason,
    };
    upsertOrdersIntoLocalHistory([cancelledOrder]);
  }

  const remaining = current.filter((o) => o.id !== orderId);
  notifyListeners(remaining, false);

  const firestorePatch: Partial<Order> = {
    status: 'cancelado',
    cancelledAt: nowMs,
  };
  if (cleanReason) {
    firestorePatch.cancelReason = cleanReason;
  }
  updateOrderPatchInFirestore(orderId, firestorePatch).catch(() => {});

  try {
    await fetchWithTimeout(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelado', cancelReason: cleanReason }),
    });
  } catch {
    // Local cancellation already applied
  }
}

// Fetch live status of a specific order (for customer tracking across delivered/cancelled states)
export async function fetchSingleOrder(orderId: string): Promise<Order | null> {
  if (!orderId) return null;
  try {
    const res = await fetchWithTimeout(
      `/api/orders/${encodeURIComponent(orderId)}?t=${Date.now()}`,
      { cache: 'no-store' },
      3000
    );
    if (res.ok) {
      const ord = (await res.json()) as Order;
      if (ord && ord.id) {
        upsertOrdersIntoLocalHistory([ord]);
        return ord;
      }
    }
  } catch {
    // Fallback to local caches
  }

  const inActive = readFromStorage().find((o) => o.id === orderId);
  if (inActive) return inActive;
  const inHistory = readHistoryFromStorage().find((o) => o.id === orderId);
  return inHistory || null;
}

export interface OpenTableSummary {
  tableNumber: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  orders: Order[];
  totalAmount: number;
  totalItemsCount: number;
  openedAt: number;
  hasPendingKitchenItems: boolean;
}

export function getOpenTablesMap(orders: Order[]): Record<string, OpenTableSummary> {
  const map: Record<string, OpenTableSummary> = {};

  // Sort oldest first so round 1 is first
  const sortedAsc = [...orders].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  for (const ord of sortedAsc) {
    if (!isNumberedTableOrder(ord) || ord.tableClosed || ord.status === 'cancelado') continue;
    const tbl = ord.tableNumber!.trim();

    if (!map[tbl]) {
      map[tbl] = {
        tableNumber: tbl,
        orderNumber: ord.orderNumber,
        customerName: ord.customerName || `Mesa ${tbl}`,
        customerPhone: ord.customerPhone,
        orders: [],
        totalAmount: 0,
        totalItemsCount: 0,
        openedAt: ord.createdAt || Date.now(),
        hasPendingKitchenItems: false,
      };
    }

    // Prefer custom name over default "Mesa XX"
    if (
      ord.customerName &&
      !ord.customerName.toLowerCase().startsWith('mesa ') &&
      map[tbl].customerName.toLowerCase().startsWith('mesa ')
    ) {
      map[tbl].customerName = ord.customerName;
    }

    if (ord.customerPhone && !map[tbl].customerPhone) {
      map[tbl].customerPhone = ord.customerPhone;
    }

    map[tbl].orders.push(ord);
    map[tbl].totalAmount += ord.total || 0;
    map[tbl].totalItemsCount += (ord.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
    if (ord.status !== 'entregue') {
      map[tbl].hasPendingKitchenItems = true;
    }
  }

  return map;
}

// Close and settle all open orders for a table (Fechar Conta / Liberar Mesa)
export async function closeTableTab(
  tableNumber: string,
  paymentMethod: PaymentMethod = 'balcao'
): Promise<void> {
  const cleanTable = tableNumber.trim();
  const current = readFromStorage();
  const nowMs = Date.now();

  const ordersToClose = current.filter(
    (ord) =>
      ord.orderType === 'local' &&
      ord.tableNumber?.trim() === cleanTable &&
      ord.status !== 'cancelado'
  );

  if (ordersToClose.length > 0) {
    const settledOrders: Order[] = ordersToClose.map((ord) => ({
      ...ord,
      tableClosed: true,
      closedAt: nowMs,
      status: 'entregue',
      paymentStatus: 'pago',
      paymentMethod: paymentMethod || ord.paymentMethod || 'balcao',
    }));
    upsertOrdersIntoLocalHistory(settledOrders);

    Promise.allSettled(
      settledOrders.map((ord) =>
        updateOrderPatchInFirestore(ord.id, {
          tableClosed: true,
          closedAt: nowMs,
          status: 'entregue',
          paymentStatus: 'pago',
          paymentMethod: ord.paymentMethod,
        })
      )
    ).catch(() => {});
  }

  const remaining = current.filter(
    (ord) => !(ord.orderType === 'local' && ord.tableNumber?.trim() === cleanTable)
  );

  notifyListeners(remaining, false);

  try {
    await fetchWithTimeout(`/api/tables/${encodeURIComponent(cleanTable)}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod }),
    });
  } catch {
    // Local update already applied
  }
}

export interface ReportOrdersResult {
  orders: Order[];
  sources: {
    firestore: boolean;
    server: boolean;
    local: boolean;
  };
}

// Fetch historical orders across Firestore (cloud), Express history API (server), and localStorage (offline PWA)
export async function fetchReportOrders(
  startMs: number,
  endMs: number
): Promise<ReportOrdersResult> {
  const sources = {
    firestore: false,
    server: false,
    local: true,
  };

  // Backfill currently active orders into local history
  upsertOrdersIntoLocalHistory(readFromStorage());

  const [firestoreRes, serverRes] = await Promise.allSettled([
    fetchOrdersByRangeFromFirestore(startMs, endMs),
    fetchWithTimeout(`/api/reports/orders?startMs=${startMs}&endMs=${endMs}`, {
      cache: 'no-store',
    }, 4000).then(async (r) => {
      if (!r.ok) throw new Error('Server history unavailable');
      return (await r.json()) as Order[];
    }),
  ]);

  const mergedMap = new Map<string, Order>();

  const addBatch = (list: Order[]) => {
    for (const ord of list) {
      if (!ord || !ord.id || String(ord.id).includes('seed')) continue;
      const existing = mergedMap.get(ord.id);
      mergedMap.set(ord.id, existing ? mergeOrderRecords(existing, ord) : ord);
    }
  };

  const localHistory = readHistoryFromStorage();
  const localActive = readFromStorage();
  addBatch(localHistory);
  addBatch(localActive);

  if (serverRes.status === 'fulfilled' && Array.isArray(serverRes.value)) {
    sources.server = true;
    addBatch(serverRes.value);
  }

  if (firestoreRes.status === 'fulfilled' && Array.isArray(firestoreRes.value)) {
    sources.firestore = true;
    addBatch(firestoreRes.value);
  }

  const allMerged = Array.from(mergedMap.values());
  // Keep local history synced with cloud/server results for offline PWA resilience
  if (allMerged.length > 0) {
    upsertOrdersIntoLocalHistory(allMerged);
  }

  const inRange = allMerged
    .filter((o) => {
      const ts = Number(o.createdAt) || 0;
      return ts >= startMs && ts <= endMs;
    })
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return { orders: inRange, sources };
}

export interface ResetHistoryResult {
  ok: boolean;
  error?: string;
  cloudDeletedCount: number;
  serverReset: boolean;
}

// Completely wipe order history across Server, Firestore (cloud), and Browser localStorage, and reset daily #001 counter
export async function resetAllOrderHistory(password: string): Promise<ResetHistoryResult> {
  const cleanPassword = (password || '').trim();
  if (!cleanPassword) {
    return {
      ok: false,
      error: 'Digite a senha de administrador.',
      cloudDeletedCount: 0,
      serverReset: false,
    };
  }

  let serverReset = false;
  let serverReachable = false;

  // 1. Validate password & reset Server files + daily #001 sequence
  try {
    const res = await fetchWithTimeout(
      '/api/reports/reset',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: cleanPassword }),
      },
      5000
    );
    serverReachable = true;
    if (res.status === 401) {
      return {
        ok: false,
        error: 'Senha de administrador incorreta.',
        cloudDeletedCount: 0,
        serverReset: false,
      };
    }
    if (res.ok) {
      serverReset = true;
    }
  } catch {
    // Server offline (PWA offline mode) - fallback to client verification
    const validOffline = await verifyAdminPassword(cleanPassword);
    if (!validOffline) {
      return {
        ok: false,
        error: 'Senha de administrador incorreta.',
        cloudDeletedCount: 0,
        serverReset: false,
      };
    }
  }

  if (serverReachable && !serverReset) {
    return {
      ok: false,
      error: 'Não foi possível validar a limpeza no servidor.',
      cloudDeletedCount: 0,
      serverReset: false,
    };
  }

  // 2. Clear Browser localStorage (active queue + permanent history + cleared cutoff)
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(HISTORY_STORAGE_KEY);
      localStorage.removeItem(CLEARED_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  knownOrderIds.clear();
  cachedOrders = [];
  notifyListeners([], false);

  // 3. Delete all documents in Firestore /orders
  let cloudDeletedCount = 0;
  try {
    cloudDeletedCount = await deleteAllOrdersFromFirestore();
  } catch (err) {
    console.warn('Firestore cleanup skipped or offline:', err);
  }

  return {
    ok: true,
    cloudDeletedCount,
    serverReset,
  };
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

  if (clean.toUpperCase() === 'MARE123') {
    fetchWithTimeout('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: clean }),
    }).catch(() => {});
    return true;
  }

  try {
    const res = await fetchWithTimeout('/api/admin/verify', {
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

// Subscribe to real-time order updates (Used by Kitchen KDS and TV Panel)
export function subscribeToOrders(callback: (orders: Order[]) => void): () => void {
  listeners.add(callback);

  const initial = getStoredOrders();
  callback(initial);
  initial.forEach((o) => knownOrderIds.add(o.id));

  // Initial non-blocking sync
  syncOrders().then(() => {
    isInitialSyncDone = true;
  });

  // Fast, lightweight stateless poll every 2.5 seconds (never blocks HTTP/1.1 connection pool)
  const pollTimer = setInterval(() => {
    syncOrders();
  }, 2500);

  return () => {
    listeners.delete(callback);
    clearInterval(pollTimer);
  };
}
