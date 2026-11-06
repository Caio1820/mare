import React, { useState, useMemo } from 'react';
import { Search, Flame, Waves, ShieldCheck, Layers, Zap, ShoppingCart, Sparkles } from 'lucide-react';
import { CategoryId, Product, CustomizationSelection, CartItem } from '../types';
import { CATEGORIES_CONFIG, PRODUCTS } from '../data/products';
import { ProductCard } from './ProductCard';
import { CustomizationModal } from './CustomizationModal';
import { playTouchSound, playAddToCartSound } from '../utils/sound';

interface Step3CatalogProps {
  onAddToCart: (product: Product, quantity: number, customization?: CustomizationSelection) => void;
  cartItems: CartItem[];
  cartTotal: number;
  onProceedToPayment: () => void;
  onOpenCartModal: () => void;
  onOpen3DBuilder?: () => void;
}

export const Step3Catalog: React.FC<Step3CatalogProps> = ({
  onAddToCart,
  cartItems,
  cartTotal,
  onProceedToPayment,
  onOpenCartModal,
  onOpen3DBuilder,
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('artesanais');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);

  const categoryIcons: Record<CategoryId, React.ReactNode> = {
    entradas: <Waves className="w-5 h-5" />,
    artesanais: <Flame className="w-5 h-5 text-amber-500" />,
    prime: <ShieldCheck className="w-5 h-5 text-amber-400" />,
    combos: <Layers className="w-5 h-5 text-red-400" />,
    smash: <Zap className="w-5 h-5 text-amber-500" />,
  };

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((item) => {
      const matchesCategory = searchQuery.trim() !== '' || item.categoryId === activeCategory;
      const matchesQuery =
        searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  const totalItemsCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  const handleQuickAdd = (prod: Product) => {
    playAddToCartSound();
    onAddToCart(prod, 1);
  };

  return (
    <div className="relative min-h-[calc(100vh-65px)] pb-32 flex flex-col bg-zinc-950">
      {/* Category Stage Navigation Strip (5 Etapas Maré) */}
      <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 px-2.5 sm:px-6 md:px-8 py-2 sm:py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          {/* Scrollable Tabs for the 5 Stages */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar w-full py-1">
            {CATEGORIES_CONFIG.map((cat) => {
              const isActive = activeCategory === cat.id && searchQuery === '';
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    playTouchSound(520);
                    setActiveCategory(cat.id);
                    setSearchQuery('');
                  }}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl whitespace-nowrap shrink-0 transition-all active:scale-95 border min-h-[44px] sm:min-h-[50px] ${
                    isActive
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20'
                      : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <span className="shrink-0">{categoryIcons[cat.id]}</span>
                  <div className="text-left">
                    <span
                      className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-wider block -mb-0.5 ${
                        isActive ? 'text-zinc-950/80' : 'text-zinc-500'
                      }`}
                    >
                      {cat.stage}
                    </span>
                    <span className="font-display text-xs sm:text-sm uppercase font-bold tracking-wide">
                      {cat.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Search Input for fast filter */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar no cardápio..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300 font-bold p-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Catalog Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 md:px-8 py-4 sm:py-6">
        {/* Active Stage Header Information */}
        {searchQuery === '' && (
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-1 sm:gap-2 border-b border-zinc-800/60 pb-3 sm:pb-4">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-amber-500 uppercase tracking-widest block">
                {CATEGORIES_CONFIG.find((c) => c.id === activeCategory)?.stage}
              </span>
              <h2 className="font-display text-xl sm:text-4xl font-extrabold uppercase text-zinc-100 tracking-wide">
                {CATEGORIES_CONFIG.find((c) => c.id === activeCategory)?.title}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 sm:mt-1">
                {CATEGORIES_CONFIG.find((c) => c.id === activeCategory)?.subtitle}
              </p>
            </div>
            <div className="text-[11px] sm:text-xs text-zinc-500 font-medium">
              {filteredProducts.length} itens disponíveis
            </div>
          </div>
        )}

        {/* 3D Interactive Customizer Feature Banner */}
        {onOpen3DBuilder && searchQuery === '' && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-500/15 via-zinc-900 to-amber-950/30 border-2 border-amber-500/40 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-2xl sm:text-3xl shrink-0">
                🍔
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Exclusivo · Experiência 3D Interativa</span>
                </div>
                <h3 className="font-display text-base sm:text-2xl font-black uppercase text-zinc-100 tracking-wide">
                  Monte o Seu Maré 3D
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
                  Escolha pão, ponto da carne, queijos derretidos e adicionais com rotação 360°, iluminação de estúdio e cálculo de preço em tempo real.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                playTouchSound(580);
                onOpen3DBuilder();
              }}
              className="w-full md:w-auto px-5 py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 shrink-0 active:scale-95 transition-all min-h-[46px]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Abrir Montador 3D</span>
              <span className="text-base">→</span>
            </button>
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenCustomizer={(prod) => setCustomizingProduct(prod)}
              onQuickAdd={handleQuickAdd}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-20 text-center text-zinc-500">
            <p className="text-base sm:text-lg font-semibold">Nenhum item encontrado para "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold"
            >
              Limpar busca
            </button>
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar (Step 4 preview & fast checkout action) */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 px-3 sm:px-6 md:px-8 py-3 sm:py-4 pb-safe shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
            {/* Cart Preview summary */}
            <button
              onClick={() => {
                playTouchSound(500);
                onOpenCartModal();
              }}
              className="flex items-center gap-2.5 sm:gap-3.5 text-left group active:scale-98"
            >
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-amber-400 group-hover:border-amber-500 transition-colors shrink-0">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-600 text-white text-[10px] sm:text-xs font-black flex items-center justify-center shadow-lg">
                  {totalItemsCount}
                </span>
              </div>

              <div>
                <span className="text-[10px] sm:text-xs text-zinc-400 font-semibold block uppercase tracking-wider">
                  Total ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'})
                </span>
                <span className="font-mono text-lg sm:text-2xl font-black text-amber-400 tabular-nums">
                  R$ {cartTotal.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </button>

            {/* Action buttons */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => {
                  playTouchSound(520);
                  onOpenCartModal();
                }}
                className="hidden sm:inline-flex py-3.5 px-4 rounded-xl sm:rounded-2xl bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-semibold text-xs sm:text-sm border border-zinc-800 active:scale-95 transition-all min-h-[46px] sm:min-h-[52px] items-center justify-center"
              >
                Ver Detalhes
              </button>

              <button
                onClick={() => {
                  playTouchSound(680);
                  onProceedToPayment();
                }}
                className="py-3 sm:py-4 px-4 sm:px-8 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-display font-extrabold text-xs sm:text-lg uppercase tracking-wider shadow-xl shadow-amber-500/20 active:scale-95 transition-all min-h-[46px] sm:min-h-[52px] flex items-center gap-1.5 sm:gap-2"
              >
                <span>Avançar</span>
                <span className="text-base sm:text-xl">→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customization Modal */}
      {customizingProduct && (
        <CustomizationModal
          product={customizingProduct}
          onClose={() => setCustomizingProduct(null)}
          onAddToCart={(product, qty, customization) => {
            onAddToCart(product, qty, customization);
          }}
        />
      )}
    </div>
  );
};
