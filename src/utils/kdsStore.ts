import { Order, OrderStatus } from '../types';
import { playKitchenBell } from './sound';

const STORAGE_KEY = 'mare_kds_orders_v1';
const ORDER_COUNTER_KEY = 'mare_order_counter_v1';

const INITIAL_SEEDED_ORDERS: Order[] = [
  {
    id: 'ord-seed-01',
    orderNumber: 'A-038',
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
    subtotal: 64.30,
    total: 64.30,
    paymentMethod: 'pix',
    paymentStatus: 'pago',
    status: 'preparo',
    createdAt: Date.now() - 1000 * 60 * 7, // 7 min ago
    estimatedMinutes: 15,
  },
  {
    id: 'ord-seed-02',
    orderNumber: 'A-040',
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
        quantity: 2,
        customization: {
          meatDoneness: 'Bem passado',
          removedIngredients: [],
          selectedAddons: {},
          specialNotes: '',
        },
        unitPrice: 39.90,
        totalPrice: 79.80,
      },
    ],
    subtotal: 79.80,
    total: 79.80,
    paymentMethod: 'cartao_balcao',
    paymentStatus: 'pago',
    status: 'recebido',
    createdAt: Date.now() - 1000 * 60 * 2, // 2 min ago
    estimatedMinutes: 15,
  },
  {
    id: 'ord-seed-03',
    orderNumber: 'A-035',
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
        quantity: 1,
        customization: {
          meatDoneness: 'Ao ponto',
          removedIngredients: ['Picles artesanal'],
          selectedAddons: {},
          specialNotes: '',
        },
        unitPrice: 23.90,
        totalPrice: 23.90,
      },
    ],
    subtotal: 23.90,
    total: 23.90,
    paymentMethod: 'pix',
    paymentStatus: 'pago',
    status: 'pronto',
    createdAt: Date.now() - 1000 * 60 * 18,
    estimatedMinutes: 15,
  },
];

export function getStoredOrders(): Order[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEEDED_ORDERS));
      return INITIAL_SEEDED_ORDERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SEEDED_ORDERS;
  }
}

export function saveOrders(orders: Order[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('mare_kds_update', { detail: orders }));
  } catch (err) {
    console.error('Failed to save orders to localStorage', err);
  }
}

export function getNextOrderNumber(): string {
  if (typeof window === 'undefined') return 'A-042';
  try {
    const raw = localStorage.getItem(ORDER_COUNTER_KEY);
    let count = raw ? parseInt(raw, 10) : 41;
    count += 1;
    localStorage.setItem(ORDER_COUNTER_KEY, count.toString());
    const formatted = count < 100 ? `0${count}` : `${count}`;
    return `A-${formatted}`;
  } catch {
    return 'A-042';
  }
}

export function submitOrderToKds(order: Order): Order {
  const current = getStoredOrders();
  const updated = [order, ...current];
  saveOrders(updated);
  playKitchenBell();
  return order;
}

export function updateOrderStatus(orderId: string, nextStatus: OrderStatus) {
  const current = getStoredOrders();
  const updated = current.map((ord) => (ord.id === orderId ? { ...ord, status: nextStatus } : ord));
  saveOrders(updated);
}

export function clearFinishedOrders() {
  const current = getStoredOrders();
  const updated = current.filter((ord) => ord.status !== 'entregue');
  saveOrders(updated);
}
