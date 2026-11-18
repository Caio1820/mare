import { initializeApp } from '@firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  writeBatch,
} from '@firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Order } from '../types';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connected to Firestore database:', firebaseConfig.firestoreDatabaseId);
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val !== undefined) {
        out[key] = stripUndefinedDeep(val);
      }
    }
    return out as T;
  }
  return value;
}

export function sanitizeOrderForFirestore(order: Order): Record<string, unknown> {
  const safeId = String(order.id || '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 128);

  const safeItems = (Array.isArray(order.items) ? order.items : [])
    .slice(0, 100)
    .map((item) => stripUndefinedDeep(item));

  const payload: Record<string, unknown> = {
    id: safeId,
    orderNumber: String(order.orderNumber || '#000').slice(0, 32),
    customerName: String(order.customerName || 'Cliente').trim().slice(0, 120) || 'Cliente',
    orderType: order.orderType === 'viagem' ? 'viagem' : 'local',
    items: safeItems,
    subtotal: Number.isFinite(order.subtotal) ? Math.max(0, Number(order.subtotal)) : 0,
    total: Number.isFinite(order.total) ? Math.max(0, Number(order.total)) : 0,
    paymentMethod: String(order.paymentMethod || 'balcao').slice(0, 40),
    paymentStatus: String(order.paymentStatus || 'pendente_balcao').slice(0, 40),
    status: order.status || 'recebido',
    createdAt: Number.isFinite(order.createdAt) && order.createdAt > 0 ? order.createdAt : Date.now(),
    tableClosed: !!order.tableClosed,
    clearedFromKds: !!order.clearedFromKds,
    roundNumber: Number.isFinite(order.roundNumber) ? Number(order.roundNumber) : 1,
  };

  if (order.customerPhone && order.customerPhone.trim()) {
    payload.customerPhone = order.customerPhone.trim().slice(0, 40);
  }
  if (order.tableNumber && order.tableNumber.trim()) {
    payload.tableNumber = order.tableNumber.trim().slice(0, 32);
  }
  if (order.observations !== undefined) {
    payload.observations = String(order.observations || '').slice(0, 500);
  }
  if (order.formattedTime) {
    payload.formattedTime = String(order.formattedTime).slice(0, 20);
  }
  if (typeof order.estimatedMinutes === 'number') {
    payload.estimatedMinutes = order.estimatedMinutes;
  }
  if (typeof order.announcedAt === 'number') {
    payload.announcedAt = order.announcedAt;
  }
  if (typeof order.autoPrinted === 'boolean') {
    payload.autoPrinted = order.autoPrinted;
  }
  if (typeof order.closedAt === 'number') {
    payload.closedAt = order.closedAt;
  }
  if (typeof order.clearedAt === 'number') {
    payload.clearedAt = order.clearedAt;
  }
  if (typeof order.cancelledAt === 'number') {
    payload.cancelledAt = order.cancelledAt;
  }
  if (order.cancelReason && order.cancelReason.trim()) {
    payload.cancelReason = String(order.cancelReason).trim().slice(0, 200);
  }

  return payload;
}

export async function upsertOrderInFirestore(order: Order): Promise<void> {
  if (!order || !order.id || order.id.includes('seed')) return;
  const sanitized = sanitizeOrderForFirestore(order);
  const orderId = String(sanitized.id);
  const path = `orders/${orderId}`;

  try {
    await setDoc(doc(db, 'orders', orderId), sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateOrderPatchInFirestore(
  orderId: string,
  patch: Partial<Order>
): Promise<void> {
  if (!orderId || orderId.includes('seed')) return;
  const safeId = orderId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `orders/${safeId}`;
  const cleanPatch = stripUndefinedDeep(patch) as Record<string, unknown>;

  try {
    await updateDoc(doc(db, 'orders', safeId), cleanPatch);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchOrdersByRangeFromFirestore(
  startMs: number,
  endMs: number
): Promise<Order[]> {
  const path = 'orders';
  try {
    const q = query(
      collection(db, 'orders'),
      where('createdAt', '>=', startMs),
      where('createdAt', '<=', endMs),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((d) => d.data() as Order)
      .filter((o) => !!o && !!o.id && !o.id.includes('seed'));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteAllOrdersFromFirestore(): Promise<number> {
  const path = 'orders';
  try {
    const snapshot = await getDocs(collection(db, path));
    if (snapshot.empty) return 0;

    let deletedCount = 0;
    const docs = snapshot.docs;
    const CHUNK_SIZE = 450;

    for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + CHUNK_SIZE);
      for (const d of chunk) {
        batch.delete(d.ref);
        deletedCount++;
      }
      await batch.commit();
    }

    return deletedCount;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
