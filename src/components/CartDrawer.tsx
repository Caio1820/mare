import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  X,
  ShoppingBag,
  UtensilsCrossed,
  ShoppingBag as TakeawayIcon,
  RotateCcw,
  User,
  MessageSquare,
  CreditCard,
} from 'lucide-react';
import { CartItem, OrderType } from '../types';
import { OpenTableSummary } from '../utils/kdsStore';
import { playTouchSound, playSuccessChime } from '../utils/sound';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  cartTotal: number;
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  orderType: OrderType | null;
  tableNumber: string;
  onSelectOrderType: (type: OrderType, table?: string) => void;
  onNavigateToOrderTypeScreen: () => void;
  onConfirmOrderAtCounter: (customerName: string, observations: string) => void;
  openTablesMap?: Record<string, OpenTableSummary>;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  cartTotal,
  onUpdateQuantity,
  onRemoveItem,
  orderType = 'local',
  tableNumber = '01',
  onSelectOrderType,
  onNavigateToOrderTypeScreen,
  onConfirmOrderAtCounter,
  openTablesMap = {},
}) => {
  const [customerName, setCustomerName] = useState<string>('');
  const [observations, setObservations] = useState<string>('');
  const [isEditingTable, setIsEditingTable] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const currentType = orderType || 'local';
  const activeTableSummary =
    currentType === 'local' && tableNumber !== 'Balcão' ? openTablesMap[tableNumber] : undefined;

  // Automatically pre-fill customer name when selecting an already open table
  useEffect(() => {
    if (
      activeTableSummary &&
      activeTableSummary.customerName &&
      !activeTableSummary.customerName.toLowerCase().startsWith('mesa ')
    ) {
      setCustomerName((prev) => (prev.trim() === '' ? activeTableSummary.customerName : prev));
    }
  }, [activeTableSummary, tableNumber]);

  if (!isOpen) return null;

  const tables = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];

  const handleFinalize = () => {
    if (items.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    const fallbackName =
      activeTableSummary?.customerName ||
      (currentType === 'local'
        ? tableNumber === 'Balcão'
          ? 'Cliente Balcão'
          : `Mesa ${tableNumber || '01'}`
        : 'Cliente Balcão');
    const finalName = customerName.trim() || fallbackName;

    playSuccessChime();
    onClose();
    onConfirmOrderAtCounter(finalName, observations.trim());
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex justify-end animate-in fade-in duration-150 touch-manipulation">
      <div className="w-full sm:max-w-xl bg-zinc-900 border-l border-zinc-800 h-[100dvh] flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200 overflow-hidden">
        {/* Header - Fixed & Compact on Mobile */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg sm:text-2xl font-bold uppercase text-zinc-100 leading-tight">
                Sua Sacola
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-400">
                {items.length} {items.length === 1 ? 'item' : 'itens'} no pedido
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playTouchSound(400);
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center active:scale-90 transition-all shrink-0"
            title="Fechar sacola"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modalidade / Local vs Viagem Strip - Fixed under header */}
        <div className="px-3 py-2.5 sm:px-5 sm:py-3 bg-zinc-950/80 border-b border-zinc-800/80 shrink-0 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="font-bold uppercase tracking-wider text-amber-400">
              Consumo do Pedido:
            </span>
            <button
              onClick={() => {
                playTouchSound(500);
                onClose();
                onNavigateToOrderTypeScreen();
              }}
              className="text-zinc-400 hover:text-amber-400 flex items-center gap-1 underline transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Voltar ao início</span>
            </button>
          </div>

          {/* Segmented Button: Local vs Viagem */}
          <div className="grid grid-cols-2 gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => {
                playTouchSound(520);
                onSelectOrderType('local', tableNumber);
              }}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[38px] ${
                currentType === 'local'
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5 shrink-0" />
              <span>Comer no Local</span>
              {currentType === 'local' && (
                <span className="text-[10px] font-mono bg-black/20 px-1 py-0.5 rounded ml-0.5">
                  Mesa {tableNumber}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                playTouchSound(520);
                onSelectOrderType('viagem');
              }}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[38px] ${
                currentType === 'viagem'
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <TakeawayIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Para Viagem</span>
            </button>
          </div>

          {/* Table Selector Accordion for Local */}
          {currentType === 'local' && (
            <div className="pt-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Mesa: <strong className="text-amber-400 font-mono">Mesa {tableNumber}</strong></span>
                <button
                  onClick={() => setIsEditingTable(!isEditingTable)}
                  className="text-amber-400 font-bold hover:underline text-[11px]"
                >
                  {isEditingTable ? 'Fechar' : 'Trocar Mesa'}
                </button>
              </div>

              {isEditingTable && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 mt-2 animate-in fade-in">
                  {tables.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        playTouchSound(540);
                        onSelectOrderType('local', t);
                        setIsEditingTable(false);
                      }}
                      className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all border min-h-[36px] flex items-center justify-center ${
                        tableNumber === t
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Center: Customer Identification & Items */}
        <div className="flex-1 overflow-y-auto custom-kiosk-scroll p-3.5 sm:p-5 space-y-3">
          {/* Open Table Banner */}
          {currentType === 'local' && tableNumber !== 'Balcão' && (
            <div
              className={`p-3 rounded-2xl border text-xs ${
                activeTableSummary
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              }`}
            >
              {activeTableSummary ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-300">
                    <span>🟢 MESA {tableNumber} ABERTA ({activeTableSummary.customerName})</span>
                    <span className="font-mono">
                      {activeTableSummary.orders.length + 1}º Pedido da Mesa
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Já consumido na mesa:{' '}
                    <strong className="font-mono text-white">
                      R$ {activeTableSummary.totalAmount.toFixed(2).replace('.', ',')}
                    </strong>{' '}
                    · Novo total acumulado:{' '}
                    <strong className="font-mono text-amber-400">
                      R$ {(activeTableSummary.totalAmount + cartTotal).toFixed(2).replace('.', ',')}
                    </strong>
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span>
                    🍽️ <strong>Mesa {tableNumber} ficará Aberta:</strong> você poderá pedir mais bebidas ou porções durante o consumo!
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Customer Identification - Always Visible on Top of Items */}
          <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-3 sm:p-3.5 space-y-2.5 shadow-sm">
            <div>
              <label className="flex items-center justify-between text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Seu Nome para a Mesa / Senha:</span>
                </span>
                <span className="text-[10px] text-zinc-500">(Opcional)</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={
                  activeTableSummary
                    ? activeTableSummary.customerName
                    : 'Ex: Carlos (ou deixe em branco)'
                }
                className="w-full bg-zinc-900 border border-zinc-750 focus:border-amber-400 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                <span>Observação da Cozinha (Opcional):</span>
              </label>
              <input
                type="text"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Ex: ponto bem passado, sem cebola..."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-400 rounded-xl px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Items List */}
          {items.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <span className="text-4xl block mb-2">🍔</span>
              <p className="text-sm font-semibold text-zinc-300">Sua sacola está vazia</p>
              <p className="text-xs text-zinc-500 mt-1">Toque nos pratos para adicioná-los!</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block px-1">
                Itens no Pedido ({items.length})
              </span>

              {items.map((item) => {
                const { customization, product } = item;
                const hasCustomization =
                  customization &&
                  (customization.selectedOption ||
                    customization.removedIngredients.length > 0 ||
                    Object.keys(customization.selectedAddons).length > 0 ||
                    customization.specialNotes ||
                    product.isBurger);

                return (
                  <div
                    key={item.cartItemId}
                    className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-3 flex flex-col gap-2 relative"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={product.image}
                          alt={product.name}
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.tried) {
                              target.dataset.tried = '1';
                              target.src = product.image.startsWith('/images/')
                                ? `/src/assets/images/${product.image.replace('/images/', '')}`
                                : `/images/${product.image.split('/').pop()}`;
                            }
                          }}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0 border border-zinc-800"
                        />
                        <div className="min-w-0">
                          <span className="text-[9px] uppercase font-bold text-zinc-500 block truncate">
                            {product.categoryLabel}
                          </span>
                          <h4 className="font-display text-sm sm:text-base font-bold text-zinc-100 uppercase truncate">
                            {product.name}
                          </h4>
                          <span className="font-mono text-xs font-bold text-amber-400 block">
                            R$ {item.unitPrice.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => {
                          playTouchSound(380);
                          onRemoveItem(item.cartItemId);
                        }}
                        className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-red-950/40 text-zinc-500 hover:text-red-400 flex items-center justify-center active:scale-90 transition-colors shrink-0"
                        title="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Customization Details */}
                    {hasCustomization && customization && (
                      <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-[10px] sm:text-[11px] space-y-0.5">
                        {customization.selectedOption && (
                          <div className="text-amber-300 font-bold">
                            <span className="text-zinc-500 font-normal">Sabor / Opção: </span>
                            <span>{customization.selectedOption}</span>
                          </div>
                        )}

                        {product.isBurger && (
                          <div className="text-zinc-300">
                            <span className="text-zinc-500">Ponto: </span>
                            <span className="text-amber-300 font-bold">{customization.meatDoneness}</span>
                          </div>
                        )}

                        {customization.removedIngredients.length > 0 && (
                          <div className="text-red-400 font-medium">
                            <span className="font-bold">Sem: </span>
                            <span>{customization.removedIngredients.join(', ')}</span>
                          </div>
                        )}

                        {Object.entries(customization.selectedAddons).map(([addonId, qty]) => {
                          const addon = product.suggestedAddons.find((a) => a.id === addonId);
                          if (!addon) return null;
                          return (
                            <div key={addonId} className="text-emerald-400 font-medium">
                              +{qty}x {addon.name} (+R$ {(addon.price * qty).toFixed(2).replace('.', ',')})
                            </div>
                          );
                        })}

                        {customization.specialNotes && (
                          <div className="text-zinc-400 italic">
                            <span>Obs: </span>
                            <span>"{customization.specialNotes}"</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quantity + Item Total */}
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-900">
                      <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                        <button
                          onClick={() => {
                            playTouchSound(420);
                            onUpdateQuantity(item.cartItemId, item.quantity - 1);
                          }}
                          className="w-7 h-7 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center active:scale-90"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-mono font-bold text-xs text-zinc-100">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => {
                            playTouchSound(640);
                            onUpdateQuantity(item.cartItemId, item.quantity + 1);
                          }}
                          className="w-7 h-7 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center active:scale-90"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-mono text-sm font-black text-amber-400 tabular-nums">
                        R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Counter Info Badge */}
          {items.length > 0 && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-[11px] text-amber-300">
              <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Pagamento no balcão ao chamar a sua senha no caixa.</span>
            </div>
          )}
        </div>

        {/* Footer - Fixed CTA with Total and Instant Click */}
        <div className="p-3 sm:p-5 bg-zinc-950 border-t border-zinc-800 shrink-0 space-y-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Total a Pagar</span>
              <span className="text-xs font-bold text-zinc-200">
                {currentType === 'local' ? `No Local · Mesa ${tableNumber}` : 'Para Viagem'}
              </span>
            </div>
            <span className="font-mono text-xl sm:text-2xl font-black text-amber-400 tabular-nums">
              R$ {cartTotal.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                playTouchSound(420);
                onClose();
              }}
              className="py-3 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs border border-zinc-800 active:scale-95 transition-all text-center min-h-[46px] flex items-center justify-center"
            >
              Continuar Pedindo
            </button>

            {/* CONFIRMAR NO BALCAO / ADICIONAR A MESA BUTTON */}
            <button
              disabled={items.length === 0 || isSubmitting}
              onClick={handleFinalize}
              className="py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-zinc-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 min-h-[46px] cursor-pointer"
            >
              <span>
                {activeTableSummary
                  ? `Adicionar à Mesa ${tableNumber}`
                  : currentType === 'local' && tableNumber !== 'Balcão'
                  ? `Abrir Mesa ${tableNumber} & Pedir`
                  : 'Confirmar no Balcão'}
              </span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
