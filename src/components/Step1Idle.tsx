import React from 'react';
import { Sparkles, Utensils, Flame, ChevronRight, Clock, Award, MapPin } from 'lucide-react';
import { playTouchSound } from '../utils/sound';

interface Step1IdleProps {
  onStart: () => void;
}

export const Step1Idle: React.FC<Step1IdleProps> = ({ onStart }) => {
  const handleTouch = () => {
    playTouchSound(620);
    onStart();
  };

  return (
    <div
      onClick={handleTouch}
      className="relative w-full min-h-[calc(100dvh-54px)] sm:h-[calc(100vh-65px)] flex flex-col justify-between overflow-y-auto sm:overflow-hidden cursor-pointer select-none bg-zinc-950 pb-safe"
    >
      {/* Background Hero Image with Dark Gradient Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/classico_casa.jpg"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.dataset.fallback) {
              target.dataset.fallback = 'true';
              target.src = '/images/hero_burger.jpg';
            }
          }}
          alt="Hambúrguer Artesanal Maré"
          className="w-full h-full object-cover object-center scale-105 filter brightness-75 transition-transform duration-1000 ease-out"
        />
        {/* Cinematic dark scrim overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/60" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-zinc-950/40 to-zinc-950/90" />
      </div>

      {/* Top Banner / Location & Schedule Badges */}
      <div className="relative z-10 pt-3 sm:pt-6 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-zinc-900/85 backdrop-blur-md border border-amber-500/30 px-3 py-1 rounded-full text-amber-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow">
          <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Edição Especial · Cardápio 2026</span>
        </div>

        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-zinc-300 bg-zinc-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-zinc-800">
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Parque Tecnológico · Beira-Rio · Macapá / AP</span>
        </div>
      </div>

      {/* Central Brand & Attraction Centerpiece */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 my-auto py-4 sm:py-6 max-w-3xl mx-auto">
        {/* Official Maré Round Gold Logo */}
        <div className="mb-4 sm:mb-6 w-36 h-36 sm:w-56 sm:h-56 relative group mx-auto">
          <div className="relative w-full h-full rounded-full border-2 border-amber-500/60 shadow-2xl shadow-amber-500/30 bg-zinc-950/40 backdrop-blur-md p-1 transition-transform duration-300 group-hover:scale-105">
            <img
              src="/images/mare_round_logo_trans.png"
              alt="Maré - Uma Onda de Sabores"
              className="w-full h-full object-cover rounded-full drop-shadow-2xl"
              onError={(e) => {
                const target = e.currentTarget;
                target.src = '/images/mare_round_logo.jpg';
              }}
            />
          </div>
        </div>

        {/* Tagline from the official menu */}
        <div className="space-y-1 sm:space-y-1.5 max-w-xl mx-auto">
          <h2 className="font-display text-xl sm:text-3xl font-extrabold uppercase text-amber-400 tracking-wider drop-shadow-md">
            Sabores que Ficam na Memória
          </h2>
          <p className="text-xs sm:text-base text-zinc-300 font-medium italic drop-shadow">
            &ldquo;A maré vem e vai. O sabor fica.&rdquo;
          </p>
        </div>

        {/* Glowing Touch Button (optimizado para celular) */}
        <div className="mt-5 sm:mt-8 group w-full max-w-md px-2">
          <div className="relative w-full inline-flex items-center justify-center">
            {/* Outer animated halo ring */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-red-500 opacity-75 blur-lg group-hover:opacity-100 animate-pulse transition duration-1000 group-hover:duration-200" />

            <button
              onClick={handleTouch}
              className="relative w-full px-5 sm:px-12 py-3.5 sm:py-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-display font-black text-base sm:text-2xl uppercase tracking-wider rounded-2xl shadow-2xl flex items-center justify-center gap-2 sm:gap-3 active:scale-95 transition-all duration-150 min-h-[52px]"
            >
              <span className="text-center leading-tight">Toque para Iniciar seu Pedido</span>
              <span className="text-xl sm:text-2xl shrink-0">🍔✨</span>
              <ChevronRight className="w-5 h-5 sm:w-7 sm:h-7 stroke-[3] shrink-0 ml-1 animate-bounce" />
            </button>
          </div>
        </div>

        <p className="mt-2.5 text-[11px] sm:text-xs text-zinc-400 font-medium">
          Todos os dias | 17h às 23h | @hamburgueriamaremcp
        </p>
      </div>

      {/* Bottom Highlights Strip (Cardápio 2026 Maré) */}
      <div className="relative z-10 w-full border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md py-2.5 px-3 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-3 sm:grid-cols-7 gap-1.5 sm:gap-2 text-center text-zinc-300">
          <div className="flex flex-col items-center justify-center gap-0.5">
            <span className="text-[9px] uppercase font-bold text-amber-500">1ª Onda</span>
            <span className="text-[11px] sm:text-xs font-semibold truncate">Porções & Fritas</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-0.5">
            <span className="text-[9px] uppercase font-bold text-amber-500">Alto-Mar</span>
            <span className="text-[11px] sm:text-xs font-semibold truncate">Artesanais 160g</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-0.5">
            <span className="text-[9px] uppercase font-bold text-amber-500">Onda Smash</span>
            <span className="text-[11px] sm:text-xs font-semibold truncate">Smash Burgers</span>
          </div>
          <div className="hidden sm:flex flex-col items-center justify-center gap-0.5">
            <span className="text-[9px] uppercase font-bold text-amber-500">Maré Nobre</span>
            <span className="text-[11px] sm:text-xs font-semibold truncate">Burgers Premium</span>
          </div>
          <div className="hidden sm:flex flex-col items-center justify-center gap-0.5">
            <span className="text-[9px] uppercase font-bold text-amber-500">Maré Alta</span>
            <span className="text-[11px] sm:text-xs font-semibold truncate">Combos Pororoca</span>
          </div>
          <div className="hidden sm:flex flex-col items-center justify-center gap-0.5">
            <span className="text-[9px] uppercase font-bold text-amber-500">Além Burgers</span>
            <span className="text-[11px] sm:text-xs font-semibold truncate">Petiscos & Tiras</span>
          </div>
          <div className="hidden sm:flex flex-col items-center justify-center gap-0.5">
            <span className="text-[9px] uppercase font-bold text-cyan-400">Brisa do Mar</span>
            <span className="text-[11px] sm:text-xs font-semibold truncate">Sucos & Bebidas</span>
          </div>
        </div>
      </div>
    </div>
  );
};
