import React from 'react';
import { RotateCcw, ChefHat, Monitor, MapPin } from 'lucide-react';
import { OrderType } from '../types';
import { playTouchSound } from '../utils/sound';

interface HeaderProps {
  currentStep: string;
  orderType: OrderType | null;
  tableNumber?: string;
  onReset: () => void;
  isKdsActive: boolean;
  onToggleKds: () => void;
  cartCount: number;
  onOpenCart?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  orderType,
  tableNumber,
  onReset,
  isKdsActive,
  onToggleKds,
}) => {
  return (
    <header className="relative z-30 w-full bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => {
            playTouchSound(500);
            if (currentStep !== 'idle' && !isKdsActive) {
              if (window.confirm('Deseja cancelar o pedido atual e voltar ao início?')) {
                onReset();
              }
            }
          }}
          className="flex items-center gap-2.5 text-left focus:outline-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-zinc-950 font-black text-xl tracking-tighter">
            M
          </div>
          <div className="leading-tight">
            <span className="font-display text-xl tracking-wider uppercase font-bold text-zinc-100 group-hover:text-amber-400 transition-colors">
              Maré
            </span>
            <span className="text-zinc-500 text-xs font-semibold uppercase tracking-widest block">
              Hambúrgueria
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: Quiet session context */}
      <div className="hidden sm:flex items-center gap-3 text-xs md:text-sm text-zinc-400 font-medium">
        {orderType && (
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-zinc-300">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {orderType === 'local'
                ? tableNumber
                  ? `Mesa ${tableNumber} · Consumo no Local`
                  : 'Consumo no Local'
                : 'Pedido para Viagem'}
            </span>
          </div>
        )}
      </div>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* KDS Kitchen toggle */}
        <button
          onClick={() => {
            playTouchSound(700);
            onToggleKds();
          }}
          className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all active:scale-95 border ${
            isKdsActive
              ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
          }`}
          title="Alternar entre Totem do Cliente e KDS da Cozinha"
        >
          {isKdsActive ? (
            <>
              <Monitor className="w-4 h-4" />
              <span>Totem Cliente</span>
            </>
          ) : (
            <>
              <ChefHat className="w-4 h-4 text-amber-400" />
              <span>Cozinha KDS</span>
            </>
          )}
        </button>

        {/* Reset button if inside order flow */}
        {currentStep !== 'idle' && !isKdsActive && (
          <button
            onClick={() => {
              playTouchSound(450);
              if (window.confirm('Deseja reiniciar seu pedido? Os itens serão limpos.')) {
                onReset();
              }
            }}
            className="px-3 py-2 text-xs font-semibold bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-800/50 rounded-lg flex items-center gap-1.5 transition-colors active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reiniciar</span>
          </button>
        )}
      </div>
    </header>
  );
};
