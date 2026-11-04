import React, { useState } from 'react';
import { UtensilsCrossed, ShoppingBag, ArrowLeft, Check, Hash } from 'lucide-react';
import { OrderType } from '../types';
import { playTouchSound } from '../utils/sound';

interface Step2OrderTypeProps {
  onSelectType: (type: OrderType, tableNumber?: string) => void;
  onBack: () => void;
}

export const Step2OrderType: React.FC<Step2OrderTypeProps> = ({ onSelectType, onBack }) => {
  const [selectedType, setSelectedType] = useState<OrderType | null>(null);
  const [tableNumber, setTableNumber] = useState<string>('01');
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  const tables = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];

  const handlePickType = (type: OrderType) => {
    playTouchSound(580);
    setSelectedType(type);
    if (type === 'local') {
      setIsTableModalOpen(true);
    } else {
      onSelectType('viagem');
    }
  };

  const handleConfirmTable = (table: string) => {
    playTouchSound(650);
    setTableNumber(table);
    setIsTableModalOpen(false);
    onSelectType('local', table);
  };

  return (
    <div className="relative min-h-[calc(100vh-65px)] bg-zinc-950 flex flex-col justify-between p-6 md:p-12 max-w-5xl mx-auto w-full">
      {/* Top Breadcrumb & Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            playTouchSound(480);
            onBack();
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold text-sm hover:bg-zinc-800 hover:text-white active:scale-95 transition-all min-h-[48px]"
        >
          <ArrowLeft className="w-5 h-5 text-amber-500" />
          <span>Voltar ao Início</span>
        </button>

        <div className="text-zinc-500 text-xs md:text-sm font-semibold uppercase tracking-widest">
          Etapa 1 de 4 · Identificação
        </div>
      </div>

      {/* Main Choice Section */}
      <div className="my-auto py-8 text-center">
        <h2 className="font-display text-3xl md:text-5xl font-bold uppercase text-zinc-100 tracking-wide">
          Onde você vai saborear seu pedido?
        </h2>
        <p className="mt-3 text-zinc-400 text-base md:text-lg max-w-md mx-auto">
          Escolha uma das opções abaixo para continuarmos para o cardápio
        </p>

        {/* 2 Big Touch Cards */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto">
          {/* Comer no Local */}
          <button
            onClick={() => handlePickType('local')}
            className={`group relative p-8 sm:p-10 rounded-3xl border-2 text-left transition-all duration-200 active:scale-98 flex flex-col items-center text-center justify-between min-h-[260px] sm:min-h-[300px] ${
              selectedType === 'local'
                ? 'bg-amber-950/20 border-amber-500 shadow-2xl shadow-amber-500/10'
                : 'bg-zinc-900/70 hover:bg-zinc-900 border-zinc-800 hover:border-amber-500/50'
            }`}
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-zinc-800/80 group-hover:bg-amber-500/20 border border-zinc-700/50 group-hover:border-amber-500/50 flex items-center justify-center transition-colors shadow-inner">
              <UtensilsCrossed className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>

            <div className="my-4">
              <span className="block font-display text-2xl sm:text-3xl font-bold text-zinc-100 uppercase tracking-wide group-hover:text-amber-400 transition-colors">
                Comer no Local
              </span>
              <span className="block mt-2 text-sm text-zinc-400 leading-relaxed">
                Leve para sua mesa com número de comanda e receba os lanches quentinhos na bandeja.
              </span>
            </div>

            <div className="w-full py-3 px-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-sm flex items-center justify-center gap-2 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors min-h-[48px]">
              <span>Selecionar Mesa</span>
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          </button>

          {/* Para Levar */}
          <button
            onClick={() => handlePickType('viagem')}
            className={`group relative p-8 sm:p-10 rounded-3xl border-2 text-left transition-all duration-200 active:scale-98 flex flex-col items-center text-center justify-between min-h-[260px] sm:min-h-[300px] ${
              selectedType === 'viagem'
                ? 'bg-amber-950/20 border-amber-500 shadow-2xl shadow-amber-500/10'
                : 'bg-zinc-900/70 hover:bg-zinc-900 border-zinc-800 hover:border-amber-500/50'
            }`}
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-zinc-800/80 group-hover:bg-amber-500/20 border border-zinc-700/50 group-hover:border-amber-500/50 flex items-center justify-center transition-colors shadow-inner">
              <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>

            <div className="my-4">
              <span className="block font-display text-2xl sm:text-3xl font-bold text-zinc-100 uppercase tracking-wide group-hover:text-amber-400 transition-colors">
                Para Levar
              </span>
              <span className="block mt-2 text-sm text-zinc-400 leading-relaxed">
                Embalagem térmica selada especial para viagem. Chame sua senha no balcão e leve para casa.
              </span>
            </div>

            <div className="w-full py-3 px-4 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-sm flex items-center justify-center gap-2 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors min-h-[48px]">
              <span>Pedir para Viagem</span>
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-zinc-500 font-medium">
        Toque na opção desejada para navegar pelas 5 Etapas do Cardápio Maré
      </div>

      {/* Table Selection Modal (01 a 10) */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-zinc-100 uppercase">
                    Número da Mesa / Comanda
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Selecione o número da mesa onde você está acomodado (01 a 10)
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  playTouchSound(400);
                  setIsTableModalOpen(false);
                }}
                className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Table Number Grid 01 a 10 */}
            <div className="py-6">
              <div className="grid grid-cols-5 gap-3">
                {tables.map((tbl) => {
                  const isSelected = tableNumber === tbl;
                  return (
                    <button
                      key={tbl}
                      onClick={() => {
                        playTouchSound(550);
                        setTableNumber(tbl);
                      }}
                      className={`h-16 rounded-2xl flex flex-col items-center justify-center font-display text-2xl font-bold transition-all active:scale-90 border ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-lg shadow-amber-500/30 scale-105'
                          : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border-zinc-700'
                      }`}
                    >
                      <span className="text-[10px] font-sans uppercase font-medium text-zinc-400 -mb-1">
                        Mesa
                      </span>
                      <span>{tbl}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Preview Box */}
              <div className="mt-6 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-zinc-500 block">
                    Mesa Selecionada:
                  </span>
                  <span className="font-display text-2xl font-bold text-amber-400">
                    Mesa {tableNumber}
                  </span>
                </div>
                <span className="text-xs text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                  Salão Principal Maré
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  playTouchSound(420);
                  setIsTableModalOpen(false);
                }}
                className="flex-1 py-4 px-4 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-sm hover:bg-zinc-750 active:scale-95 min-h-[50px]"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmTable(tableNumber)}
                className="flex-2 py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-display font-bold text-base uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2 min-h-[50px]"
              >
                <span>Confirmar Mesa {tableNumber}</span>
                <Check className="w-5 h-5 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
