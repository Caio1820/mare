import React, { useState } from 'react';
import { Plus, SlidersHorizontal, Check } from 'lucide-react';
import { Product } from '../types';
import { playTouchSound, playAddToCartSound } from '../utils/sound';

interface ProductCardProps {
  product: Product;
  onOpenCustomizer: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenCustomizer,
  onQuickAdd,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);

  const handleCardClick = () => {
    playTouchSound(560);
    onOpenCustomizer(product);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    playAddToCartSound();
    onQuickAdd(product);
    setIsAddedFeedback(true);
    setTimeout(() => setIsAddedFeedback(false), 900);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/50 rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-200 active:scale-[0.99] cursor-pointer shadow-lg hover:shadow-amber-500/5"
    >
      {/* Media Image Container (aspect-[16/10] on mobile for compact scanning, 4/3 on tablet/desktop) */}
      <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full bg-zinc-950 overflow-hidden shrink-0">
        {!imageError ? (
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
              } else {
                setImageError(true);
              }
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex flex-col items-center justify-center p-4 text-center">
            <span className="text-3xl sm:text-4xl mb-1 sm:mb-2">🍔</span>
            <span className="text-xs font-semibold text-zinc-400">{product.name}</span>
          </div>
        )}

        {/* Dark Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/30 pointer-events-none" />

        {/* Quality / Promotion Badge */}
        {product.badge && (
          <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 bg-zinc-950/85 backdrop-blur-md border border-amber-500/30 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold text-amber-400 uppercase tracking-wider shadow">
            {product.badge}
          </div>
        )}

        {/* Price Tag in corner */}
        <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 bg-zinc-950/90 backdrop-blur-md border border-zinc-700/80 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-right shadow-lg">
          <span className="font-mono text-sm sm:text-lg font-black text-amber-400 tabular-nums">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between gap-2.5 sm:gap-3">
        <div>
          <span className="text-[10px] sm:text-[11px] uppercase font-bold text-zinc-500 tracking-wider block mb-0.5 sm:mb-1">
            {product.categoryLabel}
          </span>
          <h3 className="font-display text-lg sm:text-2xl font-bold text-zinc-100 uppercase tracking-wide group-hover:text-amber-400 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Show flavor / option pills when available (e.g. Soda Cans, Juices, Sauces, Combos) */}
          {product.optionChoices && product.optionChoices.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {product.optionChoices.map((choice) => (
                <span
                  key={choice}
                  className="px-2 py-0.5 rounded-md bg-zinc-950/90 border border-amber-500/30 text-[10px] font-semibold text-amber-300"
                >
                  {choice}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Touch Button Controls (min touch height >= 44px) */}
        <div className="pt-1.5 sm:pt-2 flex items-center gap-2">
          {product.isBurger || (product.optionChoices && product.optionChoices.length > 0) ? (
            <button
              type="button"
              onClick={handleCardClick}
              className="w-full py-2.5 sm:py-3.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-zinc-800/90 hover:bg-amber-500 text-zinc-200 hover:text-zinc-950 font-display font-bold text-xs sm:text-sm uppercase tracking-wider border border-zinc-700 hover:border-amber-400 transition-all active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] sm:min-h-[48px] shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-400 group-hover:text-zinc-950 transition-colors" />
              <span>
                {product.isBurger
                  ? 'Personalizar & Adicionar'
                  : 'Escolher Sabor / Opção'}
              </span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCardClick}
                className="flex-1 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl sm:rounded-2xl bg-zinc-800/80 hover:bg-zinc-750 text-zinc-300 font-semibold text-xs border border-zinc-700/80 transition-all min-h-[44px] sm:min-h-[48px] flex items-center justify-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
                <span>Adicionais</span>
              </button>

              <button
                type="button"
                onClick={handleQuickAdd}
                className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl sm:rounded-2xl font-display font-bold text-xs sm:text-sm uppercase tracking-wide transition-all active:scale-95 min-h-[44px] sm:min-h-[48px] flex items-center justify-center gap-1 sm:gap-1.5 shadow ${
                  isAddedFeedback
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950'
                }`}
              >
                {isAddedFeedback ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Adicionado!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Adicionar</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
