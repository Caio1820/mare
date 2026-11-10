import React, { useState } from 'react';
import { Sparkles, Plus, Check, ArrowRight, X, Utensils } from 'lucide-react';
import { CartItem, Product, UpSellItem } from '../types';
import { playTouchSound, playAddToCartSound } from '../utils/sound';

interface UpSellModalProps {
  cartItems: CartItem[];
  onAddUpSellItem: (product: Product) => void;
  onProceedToPayment: () => void;
  onClose: () => void;
}

const UPSELL_CATALOG: UpSellItem[] = [
  {
    id: 'upsell-batata',
    name: 'Batata da Maré Crocante',
    category: 'porcao',
    price: 24.90,
    description: 'Batatas douradas crocantes com o exclusivo Molho Maré.',
    image: '/images/batata_mare.jpg',
    badge: 'Mais Pedida',
  },
  {
    id: 'upsell-bacon-mare',
    name: 'Bacon da Maré',
    category: 'porcao',
    price: 34.90,
    description: 'Fritas com queijo derretido e pedaços de bacon douradinho.',
    image: '/images/bacon_mare.jpg',
    badge: 'Favorito',
  },
  {
    id: 'upsell-coca',
    name: 'Coca-Cola Gelada (Lata 350ml)',
    category: 'bebida',
    price: 7.00,
    description: 'Lata trincando de gelada para acompanhar seu hambúrguer.',
    image: '/images/pororoca_solo.jpg',
    badge: 'Geladinha',
  },
  {
    id: 'upsell-guarana',
    name: 'Guaraná (Lata 350ml)',
    category: 'bebida',
    price: 7.00,
    description: 'O clássico brasileiro bem gelado.',
    image: '/images/pororoca_solo.jpg',
  },
  {
    id: 'upsell-suco',
    name: 'Entre Marés - Suco Regional (400ml)',
    category: 'bebida',
    price: 14.00,
    description: 'Suco de 400 ml: Taperebá, Maracujá, Cupuaçu, Graviola ou Morango.',
    image: '/images/sucos_entre_mares.jpg',
    badge: '400ml',
  },
  {
    id: 'upsell-molho-extra',
    name: 'Adicional Molho Maré',
    category: 'porcao',
    price: 3.00,
    description: 'Dose extra do exclusivo Molho Maré da casa.',
    image: '/images/batata_mare.jpg',
  },
];

export const UpSellModal: React.FC<UpSellModalProps> = ({
  cartItems,
  onAddUpSellItem,
  onProceedToPayment,
  onClose,
}) => {
  const [addedIds, setAddedIds] = useState<string[]>([]);

  // Filter items: don't suggest what's already heavily in the cart
  const filteredSuggestions = UPSELL_CATALOG.filter((item) => {
    // Show 3 most relevant suggestions
    return true;
  }).slice(0, 3);

  const handleAddItem = (item: UpSellItem) => {
    playAddToCartSound();
    setAddedIds((prev) => [...prev, item.id]);

    const product: Product = {
      id: item.id,
      name: item.name,
      categoryId: item.category === 'porcao' ? 'entradas' : 'combos',
      categoryLabel: item.category === 'porcao' ? 'Primeira Onda' : 'Bebidas',
      price: item.price,
      description: item.description,
      image: item.image,
      isBurger: false,
      defaultIngredients: [],
      suggestedAddons: [],
      badge: item.badge,
    };

    onAddUpSellItem(product);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 rounded-t-3xl sm:rounded-3xl w-full max-w-xl p-5 sm:p-8 shadow-2xl relative max-h-[92dvh] overflow-y-auto pb-safe">
        {/* Close Button */}
        <button
          onClick={() => {
            playTouchSound(400);
            onClose();
          }}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center pb-4 mb-4 border-b border-zinc-800">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Up-sell Estratégico</span>
          </div>

          <h3 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-zinc-100 tracking-wide">
            Que tal acompanhar seu Maré?
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-md mx-auto">
            Clientes que pediram hambúrgueres também adicionaram estes acompanhamentos crocantes e bebidas trincando de geladas:
          </p>
        </div>

        {/* Suggestion Cards */}
        <div className="space-y-3 mb-6">
          {filteredSuggestions.map((item) => {
            const isAdded = addedIds.includes(item.id);
            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800 hover:border-amber-500/40 flex items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-zinc-900 overflow-hidden shrink-0 border border-zinc-800">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.src = '/images/batata_mare.jpg';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-display text-sm font-bold text-zinc-100 truncate">
                        {item.name}
                      </h4>
                      {item.badge && (
                        <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold uppercase tracking-wider shrink-0 hidden xs:inline-block">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">{item.description}</p>
                    <span className="font-mono text-xs font-black text-amber-400 mt-1 block">
                      R$ {item.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleAddItem(item)}
                  disabled={isAdded}
                  className={`px-3.5 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 active:scale-95 transition-all min-h-[44px] ${
                    isAdded
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Adicionado</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Adicionar</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={() => {
              playTouchSound(650);
              onProceedToPayment();
            }}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-display font-black text-base uppercase tracking-wider shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[52px]"
          >
            <span>Continuar para Pagamento</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          <button
            onClick={() => {
              playTouchSound(480);
              onProceedToPayment();
            }}
            className="w-full sm:w-auto py-2.5 px-4 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Não, obrigado
          </button>
        </div>
      </div>
    </div>
  );
};
