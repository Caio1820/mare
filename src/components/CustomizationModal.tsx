import React, { useState } from 'react';
import { Plus, Minus, Check, Flame, X, Utensils, MessageSquare } from 'lucide-react';
import { Product, CustomizationSelection, AddonItem } from '../types';
import { playTouchSound, playAddToCartSound } from '../utils/sound';

interface CustomizationModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, customization: CustomizationSelection) => void;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [meatDoneness, setMeatDoneness] = useState<'Ao ponto' | 'Bem passado' | 'Selado'>('Ao ponto');
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<{ [addonId: string]: number }>({});
  const [specialNotes, setSpecialNotes] = useState<string>('');

  const donenessOptions: ('Ao ponto' | 'Bem passado' | 'Selado')[] = [
    'Ao ponto',
    'Bem passado',
    'Selado',
  ];

  const quickNotesOptions = ['Molho à parte', 'Pão bem tostado', 'Embalar separado', 'Sem gelo no copo'];

  const toggleRemovedIngredient = (ingredient: string) => {
    playTouchSound(500);
    setRemovedIngredients((prev) =>
      prev.includes(ingredient) ? prev.filter((i) => i !== ingredient) : [...prev, ingredient]
    );
  };

  const handleAddonDelta = (addonId: string, delta: number) => {
    playTouchSound(delta > 0 ? 640 : 420);
    setSelectedAddons((prev) => {
      const current = prev[addonId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[addonId];
        return copy;
      }
      return { ...prev, [addonId]: next };
    });
  };

  // Calculate price with addons
  const addonsTotal = Object.entries(selectedAddons).reduce((acc, [addonId, qty]) => {
    const addon = product.suggestedAddons.find((a) => a.id === addonId);
    return acc + (addon ? addon.price * qty : 0);
  }, 0);

  const unitTotal = product.price + addonsTotal;
  const grandTotal = unitTotal * quantity;

  const handleConfirm = () => {
    playAddToCartSound();
    onAddToCart(product, quantity, {
      meatDoneness,
      removedIngredients,
      selectedAddons,
      specialNotes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header with image preview */}
        <div className="relative h-44 sm:h-52 w-full bg-zinc-950 shrink-0 overflow-hidden border-b border-zinc-800">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={() => {
              playTouchSound(400);
              onClose();
            }}
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center border border-zinc-700 shadow-lg active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Product Title inside Header */}
          <div className="absolute bottom-4 left-6 right-6">
            <span className="text-xs uppercase font-bold text-amber-400 tracking-wider block">
              {product.categoryLabel}
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-zinc-100 uppercase drop-shadow">
              {product.name}
            </h3>
            <span className="font-mono text-base font-bold text-amber-400">
              R$ {product.price.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto custom-kiosk-scroll p-6 space-y-6">
          {/* 1. Ponto da Carne (if burger) */}
          {product.isBurger && (
            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-5 h-5 text-amber-500" />
                <h4 className="font-display text-base font-bold text-zinc-200 uppercase tracking-wide">
                  Ponto da Carne
                </h4>
                <span className="text-xs text-zinc-500 ml-auto">Escolha 1 opção</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {donenessOptions.map((option) => {
                  const isSelected = meatDoneness === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        playTouchSound(560);
                        setMeatDoneness(option);
                      }}
                      className={`py-3 px-2 rounded-xl text-center font-semibold text-xs sm:text-sm border transition-all active:scale-95 min-h-[48px] flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-850'
                      }`}
                    >
                      <span>{option}</span>
                      {option === 'Ao ponto' && (
                        <span className="text-[10px] opacity-80 font-normal">Recomendado</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Remover Ingredientes */}
          {product.defaultIngredients && product.defaultIngredients.length > 0 && (
            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-amber-500" />
                  <h4 className="font-display text-base font-bold text-zinc-200 uppercase tracking-wide">
                    Deseja Retirar Algum Ingrediente?
                  </h4>
                </div>
                <span className="text-xs text-zinc-500">Sem custo</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {product.defaultIngredients.map((ingredient) => {
                  const isRemoved = removedIngredients.includes(ingredient);
                  return (
                    <button
                      key={ingredient}
                      type="button"
                      onClick={() => toggleRemovedIngredient(ingredient)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all active:scale-95 min-h-[48px] flex items-center justify-between gap-1.5 ${
                        isRemoved
                          ? 'bg-red-950/40 border-red-500/60 text-red-300 line-through'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <span className="truncate">{ingredient}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                          isRemoved ? 'bg-red-500 text-white' : 'text-zinc-500'
                        }`}
                      >
                        {isRemoved ? 'Sem' : 'Normal'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Adicionais & Extras */}
          {product.suggestedAddons && product.suggestedAddons.length > 0 && (
            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-display text-base font-bold text-zinc-200 uppercase tracking-wide">
                  Adicionais & Extras Especiais
                </h4>
                <span className="text-xs text-amber-400 font-semibold">Turbine seu lanche</span>
              </div>

              <div className="space-y-2.5">
                {product.suggestedAddons.map((addon: AddonItem) => {
                  const count = selectedAddons[addon.id] || 0;
                  return (
                    <div
                      key={addon.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                        count > 0
                          ? 'bg-amber-950/20 border-amber-500/50'
                          : 'bg-zinc-900 border-zinc-800'
                      }`}
                    >
                      <div>
                        <span className="text-sm font-semibold text-zinc-200 block">
                          {addon.name}
                        </span>
                        <span className="font-mono text-xs font-bold text-amber-400">
                          + R$ {addon.price.toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      {/* Stepper (+ / -) */}
                      <div className="flex items-center gap-2">
                        {count > 0 && (
                          <button
                            type="button"
                            onClick={() => handleAddonDelta(addon.id, -1)}
                            className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-lg active:scale-90 min-w-[40px]"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        )}

                        {count > 0 && (
                          <span className="font-mono text-base font-bold text-zinc-100 w-6 text-center">
                            {count}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleAddonDelta(addon.id, 1)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg active:scale-90 min-w-[40px] ${
                            count > 0
                              ? 'bg-amber-500 text-zinc-950'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Observações Rápidas Táteis */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2.5">
              <MessageSquare className="w-4 h-4 text-amber-500" />
              <h4 className="font-display text-sm font-bold text-zinc-200 uppercase tracking-wide">
                Observações para a Cozinha
              </h4>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {quickNotesOptions.map((opt) => {
                const isActive = specialNotes.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      playTouchSound(520);
                      setSpecialNotes((prev) =>
                        isActive
                          ? prev.replace(opt, '').replace(/,\s*,/g, ',').trim()
                          : prev
                          ? `${prev}, ${opt}`
                          : opt
                      );
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
                      isActive
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    + {opt}
                  </button>
                );
              })}
            </div>

            {specialNotes && (
              <div className="text-xs bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl text-zinc-300">
                <span className="font-bold text-amber-400">Nota: </span>
                {specialNotes}
              </div>
            )}
          </div>
        </div>

        {/* Footer sticky bar with Quantity and Grand Total CTA */}
        <div className="p-4 sm:p-6 bg-zinc-950 border-t border-zinc-800 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 shrink-0">
          {/* Quantity Stepper */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                playTouchSound(480);
                setQuantity((q) => Math.max(1, q - 1));
              }}
              disabled={quantity <= 1}
              className="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 flex items-center justify-center font-bold text-xl active:scale-90"
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="font-mono text-xl font-bold text-zinc-100 w-10 text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => {
                playTouchSound(560);
                setQuantity((q) => q + 1);
              }}
              className="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-xl active:scale-90"
            >
              <Plus className="w-5 h-5 text-amber-400" />
            </button>
          </div>

          {/* Confirm & Add button */}
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-display font-extrabold text-base sm:text-lg uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-98 flex items-center justify-between min-h-[56px] transition-all"
          >
            <span>Adicionar ao Pedido</span>
            <span className="font-mono text-lg font-black bg-zinc-950/20 px-3 py-1 rounded-lg">
              R$ {grandTotal.toFixed(2).replace('.', ',')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
