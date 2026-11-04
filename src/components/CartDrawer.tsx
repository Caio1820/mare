import React from 'react';
import { Trash2, Plus, Minus, ArrowRight, X, ShoppingBag } from 'lucide-react';
import { CartItem } from '../types';
import { playTouchSound } from '../utils/sound';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  cartTotal: number;
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onProceedToPayment: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  cartTotal,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToPayment,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-zinc-900 border-l border-zinc-800 h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold uppercase text-zinc-100">
                Seu Carrinho
              </h3>
              <p className="text-xs text-zinc-400">
                {items.length} {items.length === 1 ? 'item diferente adicionado' : 'itens diferentes adicionados'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playTouchSound(400);
              onClose();
            }}
            className="w-11 h-11 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto custom-kiosk-scroll p-6 space-y-4">
          {items.length === 0 ? (
            <div className="py-20 text-center text-zinc-500">
              <span className="text-5xl block mb-3">🛒</span>
              <p className="text-base font-semibold">Seu carrinho está vazio</p>
              <p className="text-xs text-zinc-400 mt-1">Toque nos lanches para adicioná-los!</p>
            </div>
          ) : (
            items.map((item) => {
              const { customization, product } = item;
              const hasCustomization =
                customization &&
                (customization.removedIngredients.length > 0 ||
                  Object.keys(customization.selectedAddons).length > 0 ||
                  customization.specialNotes ||
                  product.isBurger);

              return (
                <div
                  key={item.cartItemId}
                  className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
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
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-zinc-800"
                      />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                          {product.categoryLabel}
                        </span>
                        <h4 className="font-display text-lg font-bold text-zinc-100 uppercase">
                          {product.name}
                        </h4>
                        <span className="font-mono text-sm font-bold text-amber-400">
                          R$ {item.unitPrice.toFixed(2).replace('.', ',')} cada
                        </span>
                      </div>
                    </div>

                    {/* Delete item button */}
                    <button
                      onClick={() => {
                        playTouchSound(380);
                        onRemoveItem(item.cartItemId);
                      }}
                      className="w-9 h-9 rounded-lg bg-zinc-900 hover:bg-red-950/50 text-zinc-500 hover:text-red-400 flex items-center justify-center active:scale-90"
                      title="Remover item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Customization Details Pills */}
                  {hasCustomization && customization && (
                    <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-xs space-y-1">
                      {product.isBurger && (
                        <div className="text-zinc-300">
                          <span className="text-zinc-500 font-semibold">Ponto: </span>
                          <span className="text-amber-300 font-bold">{customization.meatDoneness}</span>
                        </div>
                      )}

                      {customization.removedIngredients.length > 0 && (
                        <div className="text-red-400">
                          <span className="text-zinc-500 font-semibold">Sem: </span>
                          <span>{customization.removedIngredients.join(', ')}</span>
                        </div>
                      )}

                      {Object.keys(customization.selectedAddons).length > 0 && (
                        <div className="text-amber-400">
                          <span className="text-zinc-500 font-semibold">Adicionais: </span>
                          <span>
                            {Object.entries(customization.selectedAddons)
                              .map(([addonId, qty]) => {
                                const addObj = product.suggestedAddons.find((a) => a.id === addonId);
                                return `${qty}x ${addObj ? addObj.name : addonId}`;
                              })
                              .join(' · ')}
                          </span>
                        </div>
                      )}

                      {customization.specialNotes && (
                        <div className="text-zinc-400 italic">
                          <span className="text-zinc-500 not-italic font-semibold">Obs: </span>
                          "{customization.specialNotes}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bottom Row: Stepper and Item Total */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                    <div className="flex items-center gap-2 bg-zinc-900 px-2 py-1 rounded-xl border border-zinc-800">
                      <button
                        onClick={() => {
                          playTouchSound(450);
                          onUpdateQuantity(item.cartItemId, item.quantity - 1);
                        }}
                        className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center active:scale-90"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-base font-bold text-zinc-100 w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          playTouchSound(550);
                          onUpdateQuantity(item.cartItemId, item.quantity + 1);
                        }}
                        className="w-8 h-8 rounded-lg bg-zinc-800 text-amber-400 flex items-center justify-center active:scale-90"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-lg font-black text-amber-400">
                        R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Subtotal & Proceed to Payment CTA */}
        <div className="p-6 bg-zinc-950 border-t border-zinc-800 space-y-4">
          <div className="flex items-center justify-between text-zinc-400 text-sm">
            <span>Subtotal do Pedido</span>
            <span className="font-mono text-base text-zinc-200">
              R$ {cartTotal.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="flex items-center justify-between text-zinc-100">
            <span className="font-display text-xl uppercase font-bold">Total a Pagar</span>
            <span className="font-mono text-3xl font-black text-amber-400 tabular-nums">
              R$ {cartTotal.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => {
                playTouchSound(420);
                onClose();
              }}
              className="py-4 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-sm border border-zinc-800 active:scale-95 transition-all text-center min-h-[52px]"
            >
              Continuar Pedindo
            </button>

            <button
              disabled={items.length === 0}
              onClick={() => {
                playTouchSound(650);
                onClose();
                onProceedToPayment();
              }}
              className="py-4 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-zinc-950 font-display font-extrabold text-base uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[52px]"
            >
              <span>Ir para Pagamento</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
