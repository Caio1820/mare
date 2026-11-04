export type CategoryId = 'entradas' | 'artesanais' | 'prime' | 'combos' | 'smash';

export interface Product {
  id: string;
  name: string;
  categoryId: CategoryId;
  categoryLabel: string;
  price: number;
  description: string;
  image: string;
  isBurger: boolean;
  defaultIngredients: string[];
  suggestedAddons: AddonItem[];
  badge?: string;
  calories?: string;
}

export interface AddonItem {
  id: string;
  name: string;
  price: number;
}

export interface CustomizationSelection {
  meatDoneness: 'Ao ponto' | 'Bem passado' | 'Selado';
  removedIngredients: string[];
  selectedAddons: { [addonId: string]: number }; // addonId -> quantity
  specialNotes: string;
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  customization?: CustomizationSelection;
  unitPrice: number;
  totalPrice: number;
}

export type OrderType = 'local' | 'viagem';

export type PaymentMethod = 'pix' | 'cartao_balcao' | 'dinheiro_balcao';

export type OrderStatus = 'recebido' | 'preparo' | 'pronto' | 'entregue';

export interface Order {
  id: string;
  orderNumber: string; // e.g. "#001", "#002"
  customerName: string; // Mandatory customer name
  orderType: OrderType;
  tableNumber?: string; // 01 to 10
  items: CartItem[];
  observations?: string; // General order observations (e.g. "sem talher", "guardanapo extra")
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pago' | 'pendente_balcao';
  status: OrderStatus;
  createdAt: number;
  formattedTime?: string; // e.g. "14:32"
  estimatedMinutes?: number;
  announcedAt?: number; // timestamp when called on TV panel
}

export type KioskStep = 
  | 'idle'           // Step 1
  | 'order_type'     // Step 2
  | 'menu'           // Step 3
  | 'payment'        // Step 5
  | 'confirmation';  // Step 6

export type AppScreen = 'autoatendimento' | 'cozinha' | 'painel';
