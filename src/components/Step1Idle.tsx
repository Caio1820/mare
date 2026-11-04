import React from 'react';
import { Sparkles, Utensils, Flame, ChevronRight, Clock, Award } from 'lucide-react';
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
          src="/images/hero_burger.jpg"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.dataset.fallback) {
              target.dataset.fallback = 'true';
              target.src = '/src/assets/images/hero_idle_burger_1793068213371.jpg';
            }
          }}
          alt="Hambúrguer Artesanal Maré"
          className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out"
        />
        {/* Cinematic dark scrim overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-zinc-950/50" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-zinc-950/40 to-zinc-950/90" />
      </div>

      {/* Top Banner / Quality Badges */}
      <div className="relative z-10 pt-4 sm:pt-8 px-4 sm:px-6 flex flex-wrap items-center justify-center sm:justify-between gap-2 sm:gap-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 px-3 py-1.5 rounded-full text-zinc-300 text-xs sm:text-sm font-medium">
          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          <span>Melhor Hambúrguer do Litoral</span>
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400 bg-zinc-950/60 backdrop-blur-md px-3 py-1 rounded-full border border-zinc-800">
          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Na Brasa · ~15 Minutos</span>
        </div>
      </div>

      {/* Central Brand & Attraction Centerpiece */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 my-auto py-6 max-w-3xl mx-auto">
        {/* Maré Emblem */}
        <div className="w-14 h-14 sm:w-24 sm:h-24 mb-3 sm:mb-6 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 p-0.5 shadow-2xl shadow-amber-500/30 flex items-center justify-center animate-pulse">
          <div className="w-full h-full bg-zinc-950 rounded-[14px] sm:rounded-[22px] flex flex-col items-center justify-center p-1.5 sm:p-2">
            <span className="font-display text-2xl sm:text-5xl font-black text-amber-400 tracking-tighter">
              M
            </span>
            <span className="text-[8px] sm:text-[10px] uppercase font-bold text-zinc-400 tracking-widest sm:-mt-1">
              MARÉ
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-display text-4xl sm:text-7xl lg:text-8xl font-black text-zinc-100 tracking-wide uppercase leading-none drop-shadow-md">
          Maré <span className="text-amber-500">·</span> Hambúrgueria
        </h1>

        <p className="mt-2.5 sm:mt-4 text-xs sm:text-lg text-zinc-300 max-w-xl font-normal leading-relaxed drop-shadow px-2">
          A verdadeira onda do hambúrguer artesanal na brasa com pão brioche e queijo fundido.
        </p>

        {/* Glowing Touch Button (optimizado para celular) */}
        <div className="mt-6 sm:mt-10 group w-full max-w-md px-2">
          <div className="relative w-full inline-flex items-center justify-center">
            {/* Outer animated halo ring */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-red-500 opacity-75 blur-lg group-hover:opacity-100 animate-pulse transition duration-1000 group-hover:duration-200" />

            <button
              onClick={handleTouch}
              className="relative w-full px-5 sm:px-12 py-4 sm:py-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-display font-extrabold text-base sm:text-2xl uppercase tracking-wider rounded-2xl shadow-2xl flex items-center justify-center gap-2 sm:gap-3 active:scale-95 transition-all duration-150 min-h-[54px]"
            >
              <span className="text-center leading-tight">Toque para Iniciar seu Pedido</span>
              <span className="text-xl sm:text-2xl shrink-0">🍔✨</span>
              <ChevronRight className="w-5 h-5 sm:w-7 sm:h-7 stroke-[3] shrink-0 ml-1 animate-bounce" />
            </button>
          </div>
        </div>

        <p className="mt-3 text-[11px] sm:text-sm text-zinc-400 font-medium">
          Autoatendimento touch rápido, prático e sem filas
        </p>
      </div>

      {/* Bottom Highlights Strip */}
      <div className="relative z-10 w-full border-t border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md py-3 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-2 sm:gap-6 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-zinc-300">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" />
            <span className="text-[10px] sm:text-sm font-semibold leading-tight">100% Blend Bovino</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-zinc-300 border-x border-zinc-800 px-1 sm:px-2">
            <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" />
            <span className="text-[10px] sm:text-sm font-semibold leading-tight">Queijo & Molho Artesanal</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-zinc-300">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" />
            <span className="text-[10px] sm:text-sm font-semibold leading-tight">Pix ou Cartão</span>
          </div>
        </div>
      </div>
    </div>
  );
};
