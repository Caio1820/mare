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
import { Burger3DBuilder } from './components/Burger3DBuilder';
import { UpSellModal } from './components/UpSellModal';
import { createOrder } from './utils/kdsStore';

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
  if (
    path.includes('montador') ||
    hash.includes('montador') ||
    path.includes('3d') ||
    hash.includes('3d')
  ) {
    return 'montador-3d';
  }
  return 'autoatendimento';
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<AppScreen>(getScreenFromUrl);
  const [currentStep, setCurrentStep] = useState<KioskStep>('idle');
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [tableNumber, setTableNumber] = useState<string>('01');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [isUpSellModalOpen, setIsUpSellModalOpen] = useState<boolean>(false);
  const [hasDismissedUpSell, setHasDismissedUpSell] = useState<boolean>(false);
  const [lastConfirmedOrder, setLastConfirmedOrder] = useState<Order | null>(null);

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

  // Proceed to Step 5 Payment (with Up-sell Strategic Intercept)
  const handleProceedToPayment = () => {
    if (cartItems.length === 0) return;
    setIsCartDrawerOpen(false);
    if (!hasDismissedUpSell) {
      setIsUpSellModalOpen(true);
    } else {
      setCurrentStep('payment');
    }
  };

  const handleDismissUpSellAndPay = () => {
    setIsUpSellModalOpen(false);
    setHasDismissedUpSell(true);
    setCurrentStep('payment');
  };

  const handleAddUpSellItem = (product: Product) => {
    handleAddToCart(product, 1);
  };

  // Step 5 -> Step 6 (Order Confirmed & Sent to KDS & Database)
  const handleConfirmPayment = async (
    method: PaymentMethod,
    isPaidImmediately: boolean,
    customerName: string,
    observations: string,
    customerPhone?: string
  ) => {
    try {
      const savedOrder = await createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone ? customerPhone.trim() : undefined,
        orderType: orderType || 'local',
        tableNumber: orderType === 'local' ? tableNumber : undefined,
        items: [...cartItems],
        observations: observations.trim(),
        subtotal: cartTotal,
        total: cartTotal,
        paymentMethod: method,
        paymentStatus: isPaidImmediately ? 'pago' : 'pendente_balcao',
      });

      setLastConfirmedOrder(savedOrder);
      setCartItems([]);
      setCurrentStep('confirmation');
    } catch (err) {
      console.error('Erro ao processar pedido:', err);
    }
  };

  // Reset to Step 1 Idle
  const handleResetToIdle = useCallback(() => {
    setCurrentStep('idle');
    setOrderType(null);
    setCartItems([]);
    setIsCartDrawerOpen(false);
    setIsUpSellModalOpen(false);
    setHasDismissedUpSell(false);
    setLastConfirmedOrder(null);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* 1. TV CALL PANEL SCREEN (fullscreen, no header) */}
      {activeScreen === 'painel' ? (
        <TvPanel onBackToKiosk={() => handleNavigateScreen('autoatendimento')} />
      ) : activeScreen === 'cozinha' ? (
        /* 2. KITCHEN KDS SCREEN (protected by password) */
        <KdsView onBackToKiosk={() => handleNavigateScreen('autoatendimento')} />
      ) : activeScreen === 'montador-3d' ? (
        /* 3. INTERACTIVE 3D BURGER BUILDER ("Monte o Seu Maré 3D") */
        <Burger3DBuilder
          onBack={() => handleNavigateScreen('autoatendimento')}
          onAddToCart={(customItem) => {
            setCartItems((prev) => [...prev, customItem]);
            handleNavigateScreen('autoatendimento');
            if (currentStep === 'idle') {
              setCurrentStep('menu');
            }
            setIsCartDrawerOpen(true);
          }}
        />
      ) : (
        /* 4. AUTOATENDIMENTO (KIOSK) SCREEN */
        <>
          <Header
            currentStep={currentStep}
            orderType={orderType}
            tableNumber={tableNumber}
            onReset={handleResetToIdle}
            activeScreen={activeScreen}
            onNavigateScreen={handleNavigateScreen}
            cartCount={cartCount}
          />

          <main className="flex-1 flex flex-col">
            {/* Step 1: Idle Attract Screen */}
            {currentStep === 'idle' && <Step1Idle onStart={handleStartOrder} />}

            {/* Step 2: Order Type & Table Picker */}
            {currentStep === 'order_type' && (
              <Step2OrderType
                onSelectType={handleSelectOrderType}
                onBack={handleResetToIdle}
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
                onOpen3DBuilder={() => handleNavigateScreen('montador-3d')}
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
              />
            )}

            {/* Step 6: Confirmation & Order Number Announcement */}
            {currentStep === 'confirmation' && lastConfirmedOrder && (
              <Step6Confirmation
                order={lastConfirmedOrder}
                onResetToIdle={handleResetToIdle}
              />
            )}

            {/* Step 4: Cart Drawer modal */}
            <CartDrawer
              isOpen={isCartDrawerOpen}
              onClose={() => setIsCartDrawerOpen(false)}
              items={cartItems}
              cartTotal={cartTotal}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onProceedToPayment={handleProceedToPayment}
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
          </main>
        </>
      )}
    </div>
  );
}
