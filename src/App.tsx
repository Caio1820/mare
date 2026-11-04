import { useState, useMemo, useCallback } from 'react';
import { KioskStep, OrderType, Product, CustomizationSelection, CartItem, PaymentMethod, Order } from './types';
import { Header } from './components/Header';
import { Step1Idle } from './components/Step1Idle';
import { Step2OrderType } from './components/Step2OrderType';
import { Step3Catalog } from './components/Step3Catalog';
import { CartDrawer } from './components/CartDrawer';
import { Step5Payment } from './components/Step5Payment';
import { Step6Confirmation } from './components/Step6Confirmation';
import { KdsView } from './components/KdsView';
import { getNextOrderNumber, submitOrderToKds } from './utils/kdsStore';

export default function App() {
  const [currentStep, setCurrentStep] = useState<KioskStep>('idle');
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [tableNumber, setTableNumber] = useState<string>('01');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [lastConfirmedOrder, setLastConfirmedOrder] = useState<Order | null>(null);
  const [isKdsViewActive, setIsKdsViewActive] = useState<boolean>(false);

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

  // Proceed to Step 5 Payment
  const handleProceedToPayment = () => {
    if (cartItems.length === 0) return;
    setIsCartDrawerOpen(false);
    setCurrentStep('payment');
  };

  // Step 5 -> Step 6 (Order Confirmed & Sent to KDS)
  const handleConfirmPayment = (method: PaymentMethod, isPaidImmediately: boolean) => {
    const orderNumber = getNextOrderNumber();

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      orderType: orderType || 'local',
      tableNumber: orderType === 'local' ? tableNumber : undefined,
      items: [...cartItems],
      subtotal: cartTotal,
      total: cartTotal,
      paymentMethod: method,
      paymentStatus: isPaidImmediately ? 'pago' : 'pendente_balcao',
      status: 'recebido',
      createdAt: Date.now(),
      estimatedMinutes: 15,
    };

    // Push into KDS Kitchen System with sound
    submitOrderToKds(newOrder);

    setLastConfirmedOrder(newOrder);
    setCartItems([]);
    setCurrentStep('confirmation');
  };

  // Reset to Step 1 Idle
  const handleResetToIdle = useCallback(() => {
    setCurrentStep('idle');
    setOrderType(null);
    setCartItems([]);
    setIsCartDrawerOpen(false);
    setLastConfirmedOrder(null);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* Top Header */}
      <Header
        currentStep={currentStep}
        orderType={orderType}
        tableNumber={tableNumber}
        onReset={handleResetToIdle}
        isKdsActive={isKdsViewActive}
        onToggleKds={() => setIsKdsViewActive(!isKdsViewActive)}
        cartCount={cartCount}
        onOpenCart={() => setIsCartDrawerOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        {isKdsViewActive ? (
          <KdsView onBackToKiosk={() => setIsKdsViewActive(false)} />
        ) : (
          <>
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
              />
            )}

            {/* Step 5: Payment Screen */}
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

            {/* Step 6: Confirmation & Order Number */}
            {currentStep === 'confirmation' && lastConfirmedOrder && (
              <Step6Confirmation
                order={lastConfirmedOrder}
                onResetToIdle={handleResetToIdle}
              />
            )}

            {/* Step 4 Cart Drawer modal */}
            <CartDrawer
              isOpen={isCartDrawerOpen}
              onClose={() => setIsCartDrawerOpen(false)}
              items={cartItems}
              cartTotal={cartTotal}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onProceedToPayment={handleProceedToPayment}
            />
          </>
        )}
      </main>
    </div>
  );
}
