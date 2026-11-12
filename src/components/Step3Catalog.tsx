import React, { useState, useMemo } from 'react';
import { Search, Flame, Waves, ShieldCheck, Layers, Zap, ShoppingCart, Utensils, GlassWater, Receipt, X } from 'lucide-react';
import { CategoryId, Product, CustomizationSelection, CartItem, OrderType } from '../types';
import { CATEGORIES_CONFIG, PRODUCTS } from '../data/products';
import { OpenTableSummary } from '../utils/kdsStore';
import { ProductCard } from './ProductCard';
import { CustomizationModal } from './CustomizationModal';
import { playTouchSound, playAddToCartSound } from '../utils/sound';

interface Step3CatalogProps {
  onAddToCart: (product: Product, quantity: number, customization?: CustomizationSelection) => void;
  cartItems: CartItem[];
  cartTotal: number;
  onProceedToPayment: () => void;
  onOpenCartModal: () => void;
  orderType?: OrderType | null;
  tableNumber?: string;
  onChangeOrderType?: () => void;
  openTableSummary?: OpenTableSummary;
  onOpenTablesModal?: () => void;
}

export const Step3Catalog: React.FC<Step3CatalogProps> = ({
  onAddToCart,
  cartItems,
  cartTotal,
  onProceedToPayment,
  onOpenCartModal,
  orderType,
  tableNumber,
  onChangeOrderType,
  openTableSummary,
  onOpenTablesModal,
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('artesanais');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);

  const categoryIcons: Record<CategoryId, React.ReactNode> = {
    entradas: <Waves className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />,
    artesanais: <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />,
    smash: <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />,
    prime: <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />,
    combos: <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />,
    petiscos: <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />,
    bebidas: <GlassWater className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />,
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
    <div className="relative min-h-[calc(100dvh-96px)] pb-28 sm:pb-32 flex flex-col bg-zinc-950">
      {/* Category Stage Navigation Strip (Slim on Mobile to respect 15% sticky height cap) */}
      <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 px-2.5 sm:px-6 md:px-8 py-1.5 sm:py-3">
        <div className="max-w-7xl mx-auto flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex items-center gap-1.5 w-full overflow-hidden">
            {/* Scrollable Tabs for the Categories */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar flex-1 py-0.5">
              {CATEGORIES_CONFIG.map((cat) => {
                const isActive = activeCategory === cat.id && searchQuery === '';
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      playTouchSound(520);
                      setActiveCategory(cat.id);
                      setSearchQuery('');
                      setIsMobileSearchOpen(false);
                    }}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl whitespace-nowrap shrink-0 transition-all active:scale-95 border min-h-[38px] sm:min-h-[48px] ${
                      isActive
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                        : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <span className="shrink-0">{categoryIcons[cat.id]}</span>
                    <div className="text-left leading-tight">
                      <span
                        className={`hidden sm:block text-[10px] uppercase font-bold tracking-wider -mb-0.5 ${
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

            {/* Mobile Search Toggle Icon Button */}
            <button
              onClick={() => {
                playTouchSound(500);
                setIsMobileSearchOpen((prev) => !prev);
              }}
              className={`sm:hidden w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                isMobileSearchOpen || searchQuery
                  ? 'bg-amber-500 text-zinc-950 border-amber-400'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
              title="Buscar no cardápio"
            >
              {isMobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>
          </div>

          {/* Search Input (Always visible on sm+, toggleable on mobile) */}
          <div
            className={`${
              isMobileSearchOpen || searchQuery ? 'block' : 'hidden sm:block'
            } relative w-full sm:w-64 shrink-0`}
          >
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar hambúrguer, bebida..."
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

      {/* Order Type Status Bar with Direct Switcher & Open Table Account Info */}
      {orderType && (
        <div className="bg-zinc-900/90 border-b border-zinc-800 px-2.5 sm:px-6 md:px-8 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg sm:rounded-xl bg-zinc-950 border border-amber-500/30 text-amber-400 font-bold text-[11px] sm:text-xs shadow-sm whitespace-nowrap">
                {orderType === 'local' ? (
                  <>
                    <span>🍽️ No Local</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-100 font-mono">
                      {tableNumber === 'Balcão' ? 'Balcão' : `Mesa ${tableNumber || '01'}`}
                    </span>
                  </>
                ) : (
                  <span>🛍️ Para Viagem</span>
                )}
              </div>

              {orderType === 'local' && openTableSummary && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg sm:rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] sm:text-xs truncate max-w-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="truncate">
                    Aberta ({openTableSummary.customerName}) · R${' '}
                    {openTableSummary.totalAmount.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
              {onOpenTablesModal && (
                <button
                  onClick={() => {
                    playTouchSound(550);
                    onOpenTablesModal();
                  }}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-[11px] sm:text-xs flex items-center gap-1 transition-all active:scale-95 border border-emerald-500/30 whitespace-nowrap min-h-[32px]"
                  title="Ver conta da mesa aberta ou trocar de mesa"
                >
                  <Receipt className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{openTableSummary ? 'Conta da Mesa' : 'Mesas'}</span>
                </button>
              )}

              {onChangeOrderType && (
                <button
                  onClick={() => {
                    playTouchSound(520);
                    onChangeOrderType();
                  }}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-amber-300 font-bold text-[11px] sm:text-xs flex items-center gap-1 transition-all active:scale-95 border border-zinc-700 whitespace-nowrap min-h-[32px]"
                  title="Trocar modalidade ou mesa"
                >
                  <span>↺</span>
                  <span>Trocar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Catalog Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-2.5 sm:px-6 md:px-8 py-3 sm:py-6">
        {/* Active Stage Header Information */}
        {searchQuery === '' && (
          <div className="mb-3 sm:mb-6 flex items-end justify-between gap-2 border-b border-zinc-800/60 pb-2.5 sm:pb-4">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs font-bold text-amber-500 uppercase tracking-widest block">
                {CATEGORIES_CONFIG.find((c) => c.id === activeCategory)?.stage}
              </span>
              <h2 className="font-display text-xl sm:text-4xl font-extrabold uppercase text-zinc-100 tracking-wide truncate">
                {CATEGORIES_CONFIG.find((c) => c.id === activeCategory)?.title}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 line-clamp-1">
                {CATEGORIES_CONFIG.find((c) => c.id === activeCategory)?.subtitle}
              </p>
            </div>
            <div className="text-[10px] sm:text-xs text-zinc-500 font-medium whitespace-nowrap shrink-0">
              {filteredProducts.length} itens
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-5">
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
          <div className="py-16 text-center text-zinc-500">
            <p className="text-sm sm:text-lg font-semibold">Nenhum item encontrado para "{searchQuery}"</p>
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
        <div className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 px-3 sm:px-6 md:px-8 py-2.5 sm:py-4 pb-safe shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
            {/* Cart Preview summary */}
            <button
              onClick={() => {
                playTouchSound(500);
                onOpenCartModal();
              }}
              className="flex items-center gap-2.5 sm:gap-3.5 text-left group active:scale-98 min-w-0"
            >
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-amber-400 group-hover:border-amber-500 transition-colors shrink-0">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-600 text-white text-[10px] sm:text-xs font-black flex items-center justify-center shadow-lg">
                  {totalItemsCount}
                </span>
              </div>

              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs text-zinc-400 font-semibold block uppercase tracking-wider truncate">
                  Sacola ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'})
                </span>
                <span className="font-mono text-base sm:text-2xl font-black text-amber-400 tabular-nums block">
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
                className="py-3 sm:py-4 px-4 sm:px-8 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-display font-extrabold text-xs sm:text-base uppercase tracking-wider shadow-xl shadow-amber-500/20 active:scale-95 transition-all min-h-[44px] sm:min-h-[52px] flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"
              >
                <span>Ver Sacola & Pedir</span>
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
