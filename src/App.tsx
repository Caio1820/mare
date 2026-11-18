import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, UtensilsCrossed, X } from 'lucide-react';
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
import {
  createOrder,
  subscribeToOrders,
  getOpenTablesMap,
  verifyAdminPassword,
} from './utils/kdsStore';
import { playTouchSound } from './utils/sound';

const STAFF_AUTH_STORAGE_KEY = 'mare_kitchen_auth_session';

function isQrTableLockedFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('mesa') || params.has('table') || params.has('m')) {
      return true;
    }
    const hash = window.location.hash;
    if (/(?:mesa|table|m)=/i.test(hash)) {
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

function getScreenFromUrl(qrLocked: boolean): AppScreen {
  if (qrLocked) return 'autoatendimento';
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
  const isQrTableLocked = useMemo(() => isQrTableLockedFromUrl(), []);
  const lockedQrTable = useMemo(
    () => (isQrTableLocked ? getTableFromUrl() : undefined),
    [isQrTableLocked]
  );

  const [activeScreen, setActiveScreen] = useState<AppScreen>(() =>
    getScreenFromUrl(isQrTableLocked)
  );
  const [currentStep, setCurrentStep] = useState<KioskStep>(getInitialStepFromUrl);
  const [orderType, setOrderType] = useState<OrderType | null>(() =>
    isQrTableLocked ? 'local' : getInitialOrderTypeFromUrl()
  );
  const [tableNumber, setTableNumber] = useState<string>(getTableFromUrl);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [isUpSellModalOpen, setIsUpSellModalOpen] = useState<boolean>(false);
  const [hasDismissedUpSell, setHasDismissedUpSell] = useState<boolean>(false);
  const [lastConfirmedOrder, setLastConfirmedOrder] = useState<Order | null>(null);
  const [isTablesModalOpen, setIsTablesModalOpen] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([]);

  // Staff / Balcão authentication state for viewing all open tables
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(STAFF_AUTH_STORAGE_KEY) === 'true';
  });
  const [isStaffLoginModalOpen, setIsStaffLoginModalOpen] = useState<boolean>(false);
  const [staffPasswordInput, setStaffPasswordInput] = useState<string>('');
  const [staffLoginError, setStaffLoginError] = useState<string>('');
  const [showStaffPassword, setShowStaffPassword] = useState<boolean>(false);
  const [isVerifyingStaff, setIsVerifyingStaff] = useState<boolean>(false);

  // Sync staff authentication whenever returning from Cozinha/KDS
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsStaffAuthenticated(sessionStorage.getItem(STAFF_AUTH_STORAGE_KEY) === 'true');
  }, [activeScreen]);

  // Subscribe to real-time orders so Open Tables and live tracking stay synced
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
      setActiveScreen(getScreenFromUrl(isQrTableLocked));
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [isQrTableLocked]);

  const handleNavigateScreen = (screen: AppScreen) => {
    if (isQrTableLocked && screen !== 'autoatendimento') {
      return;
    }
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

  // Open Tables Modal (Staff-gated on totem; single-table locked on QR Code)
  const handleOpenTablesModal = () => {
    if (isQrTableLocked) {
      setIsTablesModalOpen(true);
      return;
    }
    const authedNow =
      isStaffAuthenticated ||
      (typeof window !== 'undefined' &&
        sessionStorage.getItem(STAFF_AUTH_STORAGE_KEY) === 'true');
    if (authedNow) {
      setIsStaffAuthenticated(true);
      setIsTablesModalOpen(true);
      return;
    }
    setStaffPasswordInput('');
    setStaffLoginError('');
    setShowStaffPassword(false);
    setIsStaffLoginModalOpen(true);
  };

  const handleStaffLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffPasswordInput.trim()) {
      setStaffLoginError('Digite a senha do balcão/cozinha.');
      return;
    }
    setIsVerifyingStaff(true);
    setStaffLoginError('');
    try {
      const ok = await verifyAdminPassword(staffPasswordInput);
      if (ok) {
        sessionStorage.setItem(STAFF_AUTH_STORAGE_KEY, 'true');
        setIsStaffAuthenticated(true);
        setIsStaffLoginModalOpen(false);
        setStaffPasswordInput('');
        setIsTablesModalOpen(true);
      } else {
        setStaffLoginError('Senha incorreta. Acesso exclusivo do balcão.');
      }
    } catch {
      setStaffLoginError('Erro ao validar senha. Tente novamente.');
    } finally {
      setIsVerifyingStaff(false);
    }
  };

  // Step 1 -> Step 2
  const handleStartOrder = () => {
    if (isQrTableLocked) {
      setOrderType('local');
      setTableNumber(lockedQrTable || tableNumber);
      setCurrentStep('menu');
      return;
    }
    setCurrentStep('order_type');
  };

  // Step 2 -> Step 3
  const handleSelectOrderType = (type: OrderType, table?: string) => {
    if (isQrTableLocked) {
      setOrderType('local');
      setTableNumber(lockedQrTable || tableNumber);
      setCurrentStep('menu');
      return;
    }
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
    setTableNumber(isQrTableLocked ? lockedQrTable || tbl : tbl);
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

  const handleToggleCartItemTakeaway = (cartItemId: string, isTakeaway: boolean) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, isTakeaway } : item
      )
    );
  };

  const handleSetAllItemsTakeaway = (isTakeaway: boolean) => {
    setCartItems((prev) => prev.map((item) => ({ ...item, isTakeaway })));
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
    const effectiveOrderType: OrderType = isQrTableLocked ? 'local' : orderType || 'local';
    const effectiveTable = isQrTableLocked
      ? lockedQrTable || tableNumber
      : effectiveOrderType === 'local'
      ? tableNumber
      : undefined;

    try {
      const savedOrder = await createOrder({
        customerName: customerName.trim() || 'Cliente Balcão',
        customerPhone: customerPhone ? customerPhone.trim() : undefined,
        orderType: effectiveOrderType,
        tableNumber: effectiveTable,
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

  // Reset to Idle (Or back to locked QR table menu)
  const handleResetToIdle = useCallback(() => {
    if (isQrTableLocked) {
      setCurrentStep('menu');
      setOrderType('local');
      if (lockedQrTable) setTableNumber(lockedQrTable);
    } else {
      setCurrentStep('idle');
      setOrderType(null);
    }
    setCartItems([]);
    setIsCartDrawerOpen(false);
    setIsUpSellModalOpen(false);
    setHasDismissedUpSell(false);
    setLastConfirmedOrder(null);
  }, [isQrTableLocked, lockedQrTable]);

  // Handler to return to order type selection ("Comer no local" / "Para viagem")
  const handleChangeOrderType = () => {
    if (isQrTableLocked) return;
    setCurrentStep('order_type');
  };

  // Determine which single table (if any) a non-staff user is allowed to view in OpenTablesModal
  const modalLockedTableNumber = useMemo(() => {
    if (isQrTableLocked) return lockedQrTable || tableNumber;
    if (isStaffAuthenticated) return undefined;
    if (
      lastConfirmedOrder?.orderType === 'local' &&
      lastConfirmedOrder.tableNumber &&
      lastConfirmedOrder.tableNumber !== 'Balcão'
    ) {
      return lastConfirmedOrder.tableNumber;
    }
    return undefined;
  }, [isQrTableLocked, lockedQrTable, tableNumber, isStaffAuthenticated, lastConfirmedOrder]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* 1. TV CALL PANEL SCREEN (fullscreen, no header; blocked in QR mode) */}
      {activeScreen === 'painel' && !isQrTableLocked ? (
        <TvPanel onBackToKiosk={() => handleNavigateScreen('autoatendimento')} />
      ) : activeScreen === 'cozinha' && !isQrTableLocked ? (
        /* 2. KITCHEN KDS SCREEN (protected by password; blocked in QR mode) */
        <KdsView
          onBackToKiosk={() => handleNavigateScreen('autoatendimento')}
          onOrderForTable={(tbl) => handleSelectTableForOrder(tbl)}
        />
      ) : (
        /* 3. AUTOATENDIMENTO (KIOSK OR QR CODE) SCREEN */
        <>
          <Header
            currentStep={currentStep}
            orderType={orderType}
            tableNumber={tableNumber}
            onReset={handleResetToIdle}
            activeScreen={activeScreen}
            onNavigateScreen={handleNavigateScreen}
            cartCount={cartCount}
            onChangeOrderType={isQrTableLocked ? undefined : handleChangeOrderType}
            onOpenTablesModal={isQrTableLocked ? undefined : handleOpenTablesModal}
            openTablesCount={openTablesCount}
            isQrTableLocked={isQrTableLocked}
          />

          <main className="flex-1 flex flex-col">
            {/* Step 1: Idle Attract Screen */}
            {currentStep === 'idle' && (
              <Step1Idle
                onStart={handleStartOrder}
                onOpenTablesModal={isStaffAuthenticated ? handleOpenTablesModal : undefined}
                openTablesCount={openTablesCount}
              />
            )}

            {/* Step 2: Order Type & Table Picker (disabled in QR mode) */}
            {currentStep === 'order_type' && !isQrTableLocked && (
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
                onOpenTablesModal={isStaffAuthenticated ? handleOpenTablesModal : undefined}
                isStaffMode={isStaffAuthenticated}
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
                onChangeOrderType={isQrTableLocked ? undefined : handleChangeOrderType}
                openTableSummary={
                  orderType === 'local' && tableNumber !== 'Balcão'
                    ? openTablesMap[tableNumber]
                    : undefined
                }
                onOpenTablesModal={
                  isQrTableLocked || isStaffAuthenticated ? () => setIsTablesModalOpen(true) : undefined
                }
                isQrTableLocked={isQrTableLocked}
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
                onChangeOrderType={isQrTableLocked ? undefined : handleChangeOrderType}
                isQrTableLocked={isQrTableLocked}
              />
            )}

            {/* Step 6: Confirmation, Order Tracking & Table Continuation */}
            {currentStep === 'confirmation' && lastConfirmedOrder && (
              <Step6Confirmation
                order={lastConfirmedOrder}
                liveOrders={orders}
                onResetToIdle={handleResetToIdle}
                isQrTableLocked={isQrTableLocked}
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
                onOpenTablesModal={
                  isQrTableLocked ||
                  isStaffAuthenticated ||
                  (lastConfirmedOrder.orderType === 'local' &&
                    !!lastConfirmedOrder.tableNumber &&
                    lastConfirmedOrder.tableNumber !== 'Balcão')
                    ? () => setIsTablesModalOpen(true)
                    : undefined
                }
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
              onToggleItemTakeaway={handleToggleCartItemTakeaway}
              onSetAllItemsTakeaway={handleSetAllItemsTakeaway}
              orderType={orderType}
              tableNumber={tableNumber}
              onSelectOrderType={handleSelectOrderType}
              onNavigateToOrderTypeScreen={handleChangeOrderType}
              onConfirmOrderAtCounter={(name, obs) =>
                handleConfirmPayment('balcao', false, name, obs)
              }
              openTablesMap={openTablesMap}
              isQrTableLocked={isQrTableLocked}
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

            {/* Open Tables Modal (Staff sees all 11 tables; QR/customer sees only own table if applicable) */}
            <OpenTablesModal
              isOpen={isTablesModalOpen}
              onClose={() => setIsTablesModalOpen(false)}
              orders={orders}
              activeTableNumber={orderType === 'local' ? tableNumber : undefined}
              lockedTableNumber={modalLockedTableNumber}
              onSelectTableForOrder={(tbl) => handleSelectTableForOrder(tbl)}
              isStaffMode={isStaffAuthenticated && !isQrTableLocked}
            />

            {/* Balcão / Staff Authentication Prompt for All-Tables Access */}
            {isStaffLoginModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-400 flex items-center justify-center shrink-0">
                        <UtensilsCrossed className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-base sm:text-lg font-bold uppercase text-zinc-100">
                          Acesso do Balcão · Mesas
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Digite a senha para visualizar e gerenciar os pedidos das mesas
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playTouchSound(420);
                        setIsStaffLoginModalOpen(false);
                      }}
                      className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleStaffLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                        Senha do Balcão / Cozinha:
                      </label>
                      <div className="relative">
                        <input
                          type={showStaffPassword ? 'text' : 'password'}
                          value={staffPasswordInput}
                          onChange={(e) => {
                            setStaffPasswordInput(e.target.value);
                            if (staffLoginError) setStaffLoginError('');
                          }}
                          placeholder="Digite a senha..."
                          autoFocus
                          autoComplete="off"
                          className={`w-full bg-zinc-950 border rounded-xl pl-3.5 pr-11 py-3 text-sm text-zinc-100 font-mono tracking-widest focus:outline-none ${
                            staffLoginError
                              ? 'border-red-500 ring-2 ring-red-500/20'
                              : 'border-zinc-700 focus:border-amber-500'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowStaffPassword(!showStaffPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                        >
                          {showStaffPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {staffLoginError && (
                        <div className="mt-2 text-xs text-red-400 font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{staffLoginError}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsStaffLoginModalOpen(false)}
                        className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider min-h-[44px]"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isVerifyingStaff}
                        className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 min-h-[44px]"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isVerifyingStaff ? 'Verificando...' : 'Liberar Mesas'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}
