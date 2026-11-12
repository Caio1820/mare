import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  KioskStep,
  OrderType,
  Product,
  CustomizationSelection,
  CartItem,
  PaymentMethod,
  Order,
  AppScreen,
} from './types';
import { Header } from './components/Header';
import { Step1Idle } from './components/Step1Idle';
import { Step2OrderType } from './components/Step2OrderType';
import { Step3Catalog } from './components/Step3Catalog';
import { CartDrawer } from './components/CartDrawer';
import { Step5Payment } from './components/Step5Payment';
import { Step6Confirmation } from './components/Step6Confirmation';
import { KdsView } from './components/KdsView';
import { TvPanel } from './components/TvPanel';
import { UpSellModal } from './components/UpSellModal';
import { OpenTablesModal } from './components/OpenTablesModal';
import { createOrder, subscribeToOrders, getOpenTablesMap } from './utils/kdsStore';

function getScreenFromUrl(): AppScreen {
  if (typeof window === 'undefined') return 'autoatendimento';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  if (
    path.includes('cozinha') ||
    hash.includes('cozinha') ||
    path.includes('painel-kds') ||
    hash.includes('painel-kds')
  ) {
    return 'cozinha';
  }
  if (path.includes('painel') || hash.includes('painel')) {
    return 'painel';
  }
  return 'autoatendimento';
}

function getTableFromUrl(): string {
  if (typeof window === 'undefined') return '01';
  try {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('mesa') || params.get('table') || params.get('m');
    if (m) {
      const num = parseInt(m, 10);
      return !isNaN(num) && num > 0 ? String(num).padStart(2, '0') : m.trim();
    }
    const hash = window.location.hash;
    const match = hash.match(/(?:mesa|table|m)=(\d+)/i);
    if (match && match[1]) {
      return String(parseInt(match[1], 10)).padStart(2, '0');
    }
  } catch {
    // ignore
  }
  return '01';
}

function getInitialOrderTypeFromUrl(): OrderType | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get('tipo') || params.get('type');
    if (tipo === 'viagem' || tipo === 'takeaway') return 'viagem';
    if (tipo === 'local' || params.has('mesa') || params.has('table') || params.has('m')) return 'local';
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('viagem')) return 'viagem';
    if (hash.includes('mesa=') || hash.includes('table=')) return 'local';
  } catch {
    // ignore
  }
  return null;
}

function getInitialStepFromUrl(): KioskStep {
  if (typeof window === 'undefined') return 'idle';
  try {
    const params = new URLSearchParams(window.location.search);
    if (
      params.has('mesa') ||
      params.has('table') ||
      params.has('m') ||
      params.has('qr') ||
      params.has('cardapio') ||
      params.has('menu')
    ) {
      return 'menu';
    }
  } catch {
    // ignore
  }
  return 'idle';
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<AppScreen>(getScreenFromUrl);
  const [currentStep, setCurrentStep] = useState<KioskStep>(getInitialStepFromUrl);
  const [orderType, setOrderType] = useState<OrderType | null>(getInitialOrderTypeFromUrl);
  const [tableNumber, setTableNumber] = useState<string>(getTableFromUrl);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [isUpSellModalOpen, setIsUpSellModalOpen] = useState<boolean>(false);
  const [hasDismissedUpSell, setHasDismissedUpSell] = useState<boolean>(false);
  const [lastConfirmedOrder, setLastConfirmedOrder] = useState<Order | null>(null);
  const [isTablesModalOpen, setIsTablesModalOpen] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([]);

  // Subscribe to real-time orders so Open Tables are always synced across Totem & QR Code
  useEffect(() => {
    const unsubscribe = subscribeToOrders((liveOrders) => {
      setOrders(liveOrders);
    });
    return () => unsubscribe();
  }, []);

  const openTablesMap = useMemo(() => getOpenTablesMap(orders), [orders]);
  const openTablesCount = useMemo(() => Object.keys(openTablesMap).length, [openTablesMap]);

  // Sync with browser URL changes (pathname or hash)
  useEffect(() => {
    const handleUrlChange = () => {
      setActiveScreen(getScreenFromUrl());
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const handleNavigateScreen = (screen: AppScreen) => {
    setActiveScreen(screen);
    const targetHash = screen === 'autoatendimento' ? '#/' : `#/${screen}`;
    try {
      window.location.hash = targetHash;
    } catch {
      // ignore
    }
  };

  // Cart Totals calculation
  const cartTotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.totalPrice, 0);
  }, [cartItems]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  // Step 1 -> Step 2
  const handleStartOrder = () => {
    setCurrentStep('order_type');
  };

  // Step 2 -> Step 3
  const handleSelectOrderType = (type: OrderType, table?: string) => {
    setOrderType(type);
    if (table) setTableNumber(table);
    setCurrentStep('menu');
  };

  // Select Table directly from OpenTablesModal (or from KDS "Pedir + Itens")
  const handleSelectTableForOrder = (tbl: string) => {
    setActiveScreen('autoatendimento');
    try {
      window.location.hash = '#/';
    } catch {
      // ignore
    }
    setOrderType('local');
    setTableNumber(tbl);
    setCurrentStep('menu');
  };

  // Step 3 Add To Cart
  const handleAddToCart = (
    product: Product,
    quantity: number,
    customization?: CustomizationSelection
  ) => {
    let unitPrice = product.price;

    if (customization && customization.selectedAddons) {
      const addonsSum = Object.entries(customization.selectedAddons).reduce(
        (acc, [addonId, qty]) => {
          const addonObj = product.suggestedAddons.find((a) => a.id === addonId);
          return acc + (addonObj ? addonObj.price * qty : 0);
        },
        0
      );
      unitPrice += addonsSum;
    }

    const newItem: CartItem = {
      cartItemId: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      product,
      quantity,
      customization,
      unitPrice,
      totalPrice: unitPrice * quantity,
    };

    setCartItems((prev) => [...prev, newItem]);
  };

  // Cart Item Modifications
  const handleUpdateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: item.unitPrice * newQuantity,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  // Proceed to Checkout: Opens Cart Drawer directly for review and counter confirmation
  const handleProceedToPayment = () => {
    if (cartItems.length === 0) return;
    setIsCartDrawerOpen(true);
  };

  const handleDismissUpSellAndPay = () => {
    setIsUpSellModalOpen(false);
    setHasDismissedUpSell(true);
    setIsCartDrawerOpen(true);
  };

  const handleAddUpSellItem = (product: Product) => {
    handleAddToCart(product, 1);
  };

  // Order Confirmed & Sent to KDS & Database with Counter Payment / Open Table
  const handleConfirmPayment = async (
    _method: PaymentMethod = 'balcao',
    _isPaidImmediately: boolean = false,
    customerName: string = 'Cliente Balcão',
    observations: string = '',
    customerPhone?: string
  ) => {
    try {
      const savedOrder = await createOrder({
        customerName: customerName.trim() || 'Cliente Balcão',
        customerPhone: customerPhone ? customerPhone.trim() : undefined,
        orderType: orderType || 'local',
        tableNumber: orderType === 'local' ? tableNumber : undefined,
        items: [...cartItems],
        observations: observations.trim(),
        subtotal: cartTotal,
        total: cartTotal,
        paymentMethod: 'balcao',
        paymentStatus: 'pendente_balcao',
      });

      setLastConfirmedOrder(savedOrder);
      setCartItems([]);
      setCurrentStep('confirmation');
    } catch (err) {
      console.error('Erro ao processar pedido:', err);
    }
  };

  // Reset to Step 1 Idle (Open Tables stay open in the store!)
  const handleResetToIdle = useCallback(() => {
    setCurrentStep('idle');
    setOrderType(null);
    setCartItems([]);
    setIsCartDrawerOpen(false);
    setIsUpSellModalOpen(false);
    setHasDismissedUpSell(false);
    setLastConfirmedOrder(null);
  }, []);

  // Handler to return to order type selection ("Comer no local" / "Para viagem")
  const handleChangeOrderType = () => {
    setCurrentStep('order_type');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* 1. TV CALL PANEL SCREEN (fullscreen, no header) */}
      {activeScreen === 'painel' ? (
        <TvPanel onBackToKiosk={() => handleNavigateScreen('autoatendimento')} />
      ) : activeScreen === 'cozinha' ? (
        /* 2. KITCHEN KDS SCREEN (protected by password) */
        <KdsView
          onBackToKiosk={() => handleNavigateScreen('autoatendimento')}
          onOrderForTable={(tbl) => handleSelectTableForOrder(tbl)}
        />
      ) : (
        /* 3. AUTOATENDIMENTO (KIOSK) SCREEN */
        <>
          <Header
            currentStep={currentStep}
            orderType={orderType}
            tableNumber={tableNumber}
            onReset={handleResetToIdle}
            activeScreen={activeScreen}
            onNavigateScreen={handleNavigateScreen}
            cartCount={cartCount}
            onChangeOrderType={handleChangeOrderType}
            onOpenTablesModal={() => setIsTablesModalOpen(true)}
            openTablesCount={openTablesCount}
          />

          <main className="flex-1 flex flex-col">
            {/* Step 1: Idle Attract Screen */}
            {currentStep === 'idle' && (
              <Step1Idle
                onStart={handleStartOrder}
                onOpenTablesModal={() => setIsTablesModalOpen(true)}
                openTablesCount={openTablesCount}
              />
            )}

            {/* Step 2: Order Type & Table Picker */}
            {currentStep === 'order_type' && (
              <Step2OrderType
                onSelectType={handleSelectOrderType}
                onBack={() => {
                  if (cartItems.length > 0) {
                    setCurrentStep('menu');
                  } else {
                    handleResetToIdle();
                  }
                }}
                initialType={orderType}
                initialTable={tableNumber}
                hasCartItems={cartItems.length > 0}
                openTablesMap={openTablesMap}
                onOpenTablesModal={() => setIsTablesModalOpen(true)}
              />
            )}

            {/* Step 3: Catalog & Customization */}
            {currentStep === 'menu' && (
              <Step3Catalog
                onAddToCart={handleAddToCart}
                cartItems={cartItems}
                cartTotal={cartTotal}
                onProceedToPayment={handleProceedToPayment}
                onOpenCartModal={() => setIsCartDrawerOpen(true)}
                orderType={orderType}
                tableNumber={tableNumber}
                onChangeOrderType={handleChangeOrderType}
                openTableSummary={
                  orderType === 'local' && tableNumber !== 'Balcão'
                    ? openTablesMap[tableNumber]
                    : undefined
                }
                onOpenTablesModal={() => setIsTablesModalOpen(true)}
              />
            )}

            {/* Step 5: Customer Name, Observations & Payment Screen */}
            {currentStep === 'payment' && (
              <Step5Payment
                orderType={orderType || 'local'}
                tableNumber={tableNumber}
                items={cartItems}
                cartTotal={cartTotal}
                onBack={() => setCurrentStep('menu')}
                onConfirmPayment={handleConfirmPayment}
                onChangeOrderType={handleChangeOrderType}
              />
            )}

            {/* Step 6: Confirmation & Order Number Announcement */}
            {currentStep === 'confirmation' && lastConfirmedOrder && (
              <Step6Confirmation
                order={lastConfirmedOrder}
                onResetToIdle={handleResetToIdle}
                openTableSummary={
                  lastConfirmedOrder.orderType === 'local' &&
                  lastConfirmedOrder.tableNumber &&
                  lastConfirmedOrder.tableNumber !== 'Balcão'
                    ? openTablesMap[lastConfirmedOrder.tableNumber]
                    : undefined
                }
                onOrderMoreOnSameTable={() => {
                  if (lastConfirmedOrder.tableNumber) {
                    handleSelectTableForOrder(lastConfirmedOrder.tableNumber);
                  }
                }}
                onOpenTablesModal={() => setIsTablesModalOpen(true)}
              />
            )}

            {/* Step 4: Cart Drawer modal with Order Type & Counter Checkout */}
            <CartDrawer
              isOpen={isCartDrawerOpen}
              onClose={() => setIsCartDrawerOpen(false)}
              items={cartItems}
              cartTotal={cartTotal}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              orderType={orderType}
              tableNumber={tableNumber}
              onSelectOrderType={handleSelectOrderType}
              onNavigateToOrderTypeScreen={handleChangeOrderType}
              onConfirmOrderAtCounter={(name, obs) =>
                handleConfirmPayment('balcao', false, name, obs)
              }
              openTablesMap={openTablesMap}
            />

            {/* Strategic Up-Sell Modal */}
            {isUpSellModalOpen && (
              <UpSellModal
                cartItems={cartItems}
                onAddUpSellItem={handleAddUpSellItem}
                onProceedToPayment={handleDismissUpSellAndPay}
                onClose={handleDismissUpSellAndPay}
              />
            )}

            {/* Open Tables Modal (Customer & Waiter View) */}
            <OpenTablesModal
              isOpen={isTablesModalOpen}
              onClose={() => setIsTablesModalOpen(false)}
              orders={orders}
              activeTableNumber={orderType === 'local' ? tableNumber : undefined}
              onSelectTableForOrder={(tbl) => handleSelectTableForOrder(tbl)}
              isStaffMode={false}
            />
          </main>
        </>
      )}
    </div>
  );
}

