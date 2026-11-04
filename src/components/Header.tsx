import React from 'react';
import { RotateCcw, ChefHat, Tv, Touchpad, MapPin } from 'lucide-react';
import { OrderType, AppScreen } from '../types';
import { playTouchSound } from '../utils/sound';

interface HeaderProps {
  currentStep: string;
  orderType: OrderType | null;
  tableNumber?: string;
  onReset: () => void;
  activeScreen: AppScreen;
  onNavigateScreen: (screen: AppScreen) => void;
  cartCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  orderType,
  tableNumber,
  onReset,
  activeScreen,
  onNavigateScreen,
}) => {
  return (
    <header className="relative z-30 w-full bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 px-2.5 sm:px-6 md:px-8 py-2 sm:py-3.5 flex items-center justify-between gap-1.5 sm:gap-4 overflow-x-hidden">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={() => {
            playTouchSound(500);
            onNavigateScreen('autoatendimento');
          }}
          className="flex items-center gap-1.5 sm:gap-2.5 text-left focus:outline-none group"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-zinc-950 font-black text-lg sm:text-xl tracking-tighter">
            M
          </div>
          <div className="leading-tight">
            <span className="font-display text-lg sm:text-xl tracking-wider uppercase font-bold text-zinc-100 group-hover:text-amber-400 transition-colors">
              Maré
            </span>
            <span className="text-zinc-500 text-[10px] sm:text-xs font-semibold uppercase tracking-widest hidden xs:block">
              Hambúrgueria
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: Navigation between screens (optimized for mobile touch) */}
      <div className="flex items-center gap-0.5 sm:gap-1 bg-zinc-900/90 border border-zinc-800 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl shrink-0">
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            playTouchSound(550);
            onNavigateScreen('autoatendimento');
          }}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all min-h-[36px] sm:min-h-[40px] ${
            activeScreen === 'autoatendimento'
              ? 'bg-amber-500 text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Totem do Cliente (#/)"
        >
          <Touchpad className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Autoatendimento</span>
          <span className="sm:hidden">Totem</span>
        </a>

        <div className="flex items-center">
          <a
            href="#/cozinha"
            onClick={(e) => {
              e.preventDefault();
              playTouchSound(550);
              onNavigateScreen('cozinha');
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-l-lg sm:rounded-l-xl text-[11px] sm:text-xs font-bold transition-all min-h-[36px] sm:min-h-[40px] ${
              activeScreen === 'cozinha'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Cozinha KDS - Senha: MARE123"
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Cozinha</span>
          </a>
          <a
            href="#/cozinha"
            target="_blank"
            rel="noopener noreferrer"
            className="px-1 sm:px-1.5 py-1.5 text-zinc-500 hover:text-amber-400 text-[10px] rounded-r-lg sm:rounded-r-xl hover:bg-zinc-800 transition-colors hidden xs:inline-block"
            title="Abrir Cozinha em Nova Aba"
          >
            ↗
          </a>
        </div>

        <div className="flex items-center">
          <a
            href="#/painel"
            onClick={(e) => {
              e.preventDefault();
              playTouchSound(550);
              onNavigateScreen('painel');
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-l-lg sm:rounded-l-xl text-[11px] sm:text-xs font-bold transition-all min-h-[36px] sm:min-h-[40px] ${
              activeScreen === 'painel'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Painel de Chamadas TV"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Painel</span>
          </a>
          <a
            href="#/painel"
            target="_blank"
            rel="noopener noreferrer"
            className="px-1 sm:px-1.5 py-1.5 text-zinc-500 hover:text-amber-400 text-[10px] rounded-r-lg sm:rounded-r-xl hover:bg-zinc-800 transition-colors hidden xs:inline-block"
            title="Abrir Painel TV em Nova Aba"
          >
            ↗
          </a>
        </div>
      </div>

      {/* Zone 3: Session Context & Reset */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {activeScreen === 'autoatendimento' && orderType && (
          <div className="hidden lg:flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full text-zinc-300 text-xs font-medium">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {orderType === 'local'
                ? tableNumber
                  ? `Mesa ${tableNumber} · Salão`
                  : 'No Local'
                : 'Para Viagem'}
            </span>
          </div>
        )}

        {/* Reset button if inside order flow in Kiosk */}
        {activeScreen === 'autoatendimento' && currentStep !== 'idle' && (
          <button
            onClick={() => {
              playTouchSound(450);
              if (window.confirm('Deseja reiniciar seu pedido? Os itens serão limpos.')) {
                onReset();
              }
            }}
            className="px-3 py-2 text-xs font-semibold bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-800/50 rounded-lg flex items-center gap-1.5 transition-colors active:scale-95"
            title="Reiniciar Pedido"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reiniciar</span>
          </button>
        )}
      </div>
    </header>
  );
};
