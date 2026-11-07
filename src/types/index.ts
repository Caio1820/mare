export type CategoryId = 'entradas' | 'artesanais' | 'smash' | 'prime' | 'combos' | 'petiscos' | 'bebidas';

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
  subtitle?: string;
  price: number;
  group?: string;
}

export interface CustomizationSelection {
  meatDoneness: 'Ao ponto' | 'Bem passado' | 'Selado';
  removedIngredients: string[];
  selectedAddons: { [addonId: string]: number }; // addonId -> quantity
  specialNotes: string;
}

export interface CustomBurger3DConfig {
  bunType: 'brioche' | 'australiano' | 'gergelim';
  bunLabel: string;
  pattiesCount: 1 | 2 | 3;
  meatDoneness: 'Ao ponto' | 'Bem passado' | 'Selado';
  cheeseType: 'cheddar_cremoso' | 'queijo_prato' | 'queijo_regional';
  cheeseLabel: string;
  selectedAddons: {
    bacon: boolean;
    cebola_caram: boolean;
    picles: boolean;
    salada_mare: boolean;
  };
  sauce: 'molho_mare' | 'maionese_verde' | 'barbecue' | 'tartaro';
  sauceLabel: string;
  specialNotes?: string;
  totalPrice: number;
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  customization?: CustomizationSelection;
  burger3DConfig?: CustomBurger3DConfig;
  unitPrice: number;
  totalPrice: number;
}

export type OrderType = 'local' | 'viagem';

export type PaymentMethod = 'balcao' | 'pix' | 'cartao_balcao' | 'dinheiro_balcao';

export type OrderStatus = 'recebido' | 'preparo' | 'pronto' | 'entregue';

export interface Order {
  id: string;
  orderNumber: string; // e.g. "#001", "#002"
  customerName: string; // Mandatory customer name
  customerPhone?: string; // Optional phone for WhatsApp notification
  orderType: OrderType;
  tableNumber?: string; // 01 to 10
  items: CartItem[];
  observations?: string; // General order observations
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pago' | 'pendente_balcao' | 'pendente';
  status: OrderStatus;
  createdAt: number;
  formattedTime?: string; // e.g. "14:32"
  estimatedMinutes?: number;
  announcedAt?: number; // timestamp when called on TV panel
  autoPrinted?: boolean; // whether thermal ticket was sent to print
}

export type KioskStep = 
  | 'idle'           // Step 1
  | 'order_type'     // Step 2
  | 'menu'           // Step 3
  | 'payment'        // Step 5
  | 'confirmation';  // Step 6

export type AppScreen = 'autoatendimento' | 'cozinha' | 'painel';

export interface UpSellItem {
  id: string;
  name: string;
  category: 'porcao' | 'bebida' | 'sobremesa';
  price: number;
  description: string;
  image: string;
  badge?: string;
}
