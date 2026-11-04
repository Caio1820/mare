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
      className="relative w-full h-[calc(100vh-65px)] flex flex-col justify-between overflow-hidden cursor-pointer select-none bg-zinc-950"
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
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/50" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-zinc-950/40 to-zinc-950/90" />
      </div>

      {/* Top Banner / Quality Badges */}
      <div className="relative z-10 pt-8 px-6 flex flex-wrap items-center justify-between gap-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 px-4 py-2 rounded-full text-zinc-300 text-xs sm:text-sm font-medium">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Eleito o Melhor Hambúrguer Artesanal do Litoral</span>
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400 bg-zinc-950/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-zinc-800">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Preparo na Brasa · ~15 Minutos</span>
        </div>
      </div>

      {/* Central Brand & Attraction Centerpiece */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 my-auto max-w-3xl mx-auto">
        {/* Maré Emblem */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 mb-6 rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 p-0.5 shadow-2xl shadow-amber-500/30 flex items-center justify-center animate-pulse">
          <div className="w-full h-full bg-zinc-950 rounded-[22px] flex flex-col items-center justify-center p-2">
            <span className="font-display text-4xl sm:text-5xl font-black text-amber-400 tracking-tighter">
              M
            </span>
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest -mt-1">
              MARÉ
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-black text-zinc-100 tracking-wide uppercase leading-none drop-shadow-md">
          Maré <span className="text-amber-500">·</span> Hambúrgueria
        </h1>

        <p className="mt-4 text-base sm:text-xl text-zinc-300 max-w-xl font-normal leading-relaxed drop-shadow">
          A verdadeira onda do hambúrguer artesanal. Carnes selecionadas, pão brioche selado na manteiga e queijo artesanal fundido.
        </p>

        {/* Giant Glowing Touch Button */}
        <div className="mt-10 sm:mt-12 group">
          <div className="relative inline-flex items-center justify-center">
            {/* Outer animated halo ring */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-red-500 opacity-75 blur-lg group-hover:opacity-100 animate-pulse transition duration-1000 group-hover:duration-200" />

            <button
              onClick={handleTouch}
              className="relative px-8 sm:px-12 py-5 sm:py-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-display font-extrabold text-xl sm:text-2xl uppercase tracking-wider rounded-2xl shadow-2xl flex items-center gap-3 active:scale-95 transition-all duration-150"
            >
              <span>Toque na tela para iniciar seu pedido</span>
              <span className="text-2xl">🍔✨</span>
              <ChevronRight className="w-7 h-7 stroke-[3] ml-1 animate-bounce" />
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs sm:text-sm text-zinc-400 font-medium">
          Autoatendimento rápido, prático e sem filas
        </p>
      </div>

      {/* Bottom Highlights Strip */}
      <div className="relative z-10 w-full border-t border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md py-4 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-3 sm:gap-6 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-zinc-300">
            <Flame className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">100% Blend Bovino Fresco</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-zinc-300 border-x border-zinc-800 px-2">
            <Utensils className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">Molhos & Queijos Artesanais</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-zinc-300">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">Pague com Pix ou Cartão</span>
          </div>
        </div>
      </div>
    </div>
  );
};
