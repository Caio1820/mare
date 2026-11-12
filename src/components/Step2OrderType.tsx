import React, { useState } from 'react';
import { UtensilsCrossed, ShoppingBag, ArrowLeft, Check, Hash, Store, PlusCircle } from 'lucide-react';
import { OrderType } from '../types';
import { OpenTableSummary } from '../utils/kdsStore';
import { playTouchSound } from '../utils/sound';

interface Step2OrderTypeProps {
  onSelectType: (type: OrderType, tableNumber?: string, existingCustomerName?: string) => void;
  onBack: () => void;
  initialType?: OrderType | null;
  initialTable?: string;
  hasCartItems?: boolean;
  openTablesMap?: Record<string, OpenTableSummary>;
  onOpenTablesModal?: () => void;
}

export const Step2OrderType: React.FC<Step2OrderTypeProps> = ({
  onSelectType,
  onBack,
  initialType = null,
  initialTable = '01',
  hasCartItems = false,
  openTablesMap = {},
  onOpenTablesModal,
}) => {
  const [selectedType, setSelectedType] = useState<OrderType | null>(initialType);
  const [tableNumber, setTableNumber] = useState<string>(initialTable);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  const tables = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
  const openTablesCount = Object.keys(openTablesMap).length;

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
    const existingCustomer = openTablesMap[table]?.customerName;
    onSelectType('local', table, existingCustomer);
  };

  const selectedTableSummary = openTablesMap[tableNumber];

  return (
    <div className="relative min-h-[calc(100dvh-96px)] lg:min-h-[calc(100vh-65px)] bg-zinc-950 flex flex-col justify-between p-3.5 sm:p-8 md:p-12 max-w-5xl mx-auto w-full overflow-y-auto pb-safe">
      {/* Top Breadcrumb & Back */}
      <div className="flex items-center justify-between gap-2 pb-2">
        <button
          onClick={() => {
            playTouchSound(480);
            onBack();
          }}
          className="flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold text-xs sm:text-sm hover:bg-zinc-800 hover:text-white active:scale-95 transition-all min-h-[42px]"
        >
          <ArrowLeft className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="truncate">
            {hasCartItems ? 'Voltar ao Cardápio' : 'Voltar ao Início'}
          </span>
        </button>

        <div className="text-zinc-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-right">
          {hasCartItems ? 'Alterar Modalidade' : 'Etapa 1 de 4'}
        </div>
      </div>

      {/* Main Choice Section */}
      <div className="my-auto py-2 sm:py-8 text-center">
        <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold uppercase text-zinc-100 tracking-wide">
          Onde você vai saborear?
        </h2>
        <p className="mt-1 sm:mt-2.5 text-zinc-400 text-xs sm:text-base max-w-md mx-auto">
          Escolha uma das opções abaixo ou selecione sua Mesa Aberta para pedir mais itens
        </p>

        {/* 2 Big Touch Cards (Compact on mobile so both fit easily on screen) */}
        <div className="mt-4 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-8 max-w-3xl mx-auto">
          {/* Comer no Local */}
          <button
            onClick={() => handlePickType('local')}
            className={`group relative p-4 sm:p-10 rounded-2xl sm:rounded-3xl border-2 text-left transition-all duration-200 active:scale-98 flex flex-col justify-between sm:items-center sm:text-center min-h-[145px] sm:min-h-[270px] ${
              selectedType === 'local'
                ? 'bg-amber-950/20 border-amber-500 shadow-xl shadow-amber-500/10'
                : 'bg-zinc-900/70 hover:bg-zinc-900 border-zinc-800 hover:border-amber-500/50'
            }`}
          >
            <div className="flex sm:flex-col items-center gap-3.5 sm:gap-0 w-full">
              <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-2xl bg-zinc-800/80 group-hover:bg-amber-500/20 border border-zinc-700/50 group-hover:border-amber-500/50 flex items-center justify-center transition-colors shadow-inner shrink-0">
                <UtensilsCrossed className="w-6 h-6 sm:w-10 sm:h-10 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>

              <div className="sm:my-4 flex-1">
                <span className="block font-display text-lg sm:text-3xl font-bold text-zinc-100 uppercase tracking-wide group-hover:text-amber-400 transition-colors">
                  Comer no Local (Mesas)
                </span>
                <span className="block mt-0.5 sm:mt-2 text-xs sm:text-sm text-zinc-400 leading-snug">
                  Abra uma mesa ou faça novos pedidos na sua mesa aberta durante o consumo.
                </span>
              </div>
            </div>

            <div className="mt-3 sm:mt-0 w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors min-h-[42px] sm:min-h-[48px]">
              <span>Selecionar Mesa (01 a 11) ou Balcão</span>
              <Check className="w-4 h-4 stroke-[3] shrink-0" />
            </div>
          </button>

          {/* Para Levar */}
          <button
            onClick={() => handlePickType('viagem')}
            className={`group relative p-4 sm:p-10 rounded-2xl sm:rounded-3xl border-2 text-left transition-all duration-200 active:scale-98 flex flex-col justify-between sm:items-center sm:text-center min-h-[145px] sm:min-h-[270px] ${
              selectedType === 'viagem'
                ? 'bg-amber-950/20 border-amber-500 shadow-xl shadow-amber-500/10'
                : 'bg-zinc-900/70 hover:bg-zinc-900 border-zinc-800 hover:border-amber-500/50'
            }`}
          >
            <div className="flex sm:flex-col items-center gap-3.5 sm:gap-0 w-full">
              <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-2xl bg-zinc-800/80 group-hover:bg-amber-500/20 border border-zinc-700/50 group-hover:border-amber-500/50 flex items-center justify-center transition-colors shadow-inner shrink-0">
                <ShoppingBag className="w-6 h-6 sm:w-10 sm:h-10 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>

              <div className="sm:my-4 flex-1">
                <span className="block font-display text-lg sm:text-3xl font-bold text-zinc-100 uppercase tracking-wide group-hover:text-amber-400 transition-colors">
                  Para Levar (Viagem)
                </span>
                <span className="block mt-0.5 sm:mt-2 text-xs sm:text-sm text-zinc-400 leading-snug">
                  Embalagem térmica selada especial. Chame sua senha no balcão e leve para casa.
                </span>
              </div>
            </div>

            <div className="mt-3 sm:mt-0 w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors min-h-[42px] sm:min-h-[48px]">
              <span>Pedir para Viagem</span>
              <Check className="w-4 h-4 stroke-[3] shrink-0" />
            </div>
          </button>
        </div>

        {/* Botões Rápidos: Mesas Abertas e Atendimento no Balcão */}
        <div className="mt-3 sm:mt-6 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {onOpenTablesModal && (
            <button
              onClick={() => {
                playTouchSound(580);
                onOpenTablesModal();
              }}
              className="w-full py-3 sm:py-3.5 px-4 sm:px-5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border-2 border-emerald-500/50 text-emerald-300 font-display font-bold text-xs sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-all shadow-lg min-h-[46px]"
            >
              <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
              <span className="truncate">
                Mesas Abertas ({openTablesCount}) · Pedir + Itens
              </span>
            </button>
          )}

          <button
            onClick={() => handleConfirmTable('Balcão')}
            className={`w-full py-3 sm:py-3.5 px-4 sm:px-5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-500/50 text-zinc-200 font-display font-bold text-xs sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-all shadow-lg min-h-[46px] ${
              !onOpenTablesModal ? 'sm:col-span-2' : ''
            }`}
          >
            <Store className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
            <span className="truncate">Balcão (Comer no Salão · Sem Mesa)</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] sm:text-xs text-zinc-500 font-medium pt-2">
        Toque na opção desejada para abrir o Cardápio Maré
      </div>

      {/* Table Selection Modal (Bottom-sheet on mobile, centered modal on desktop) */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-zinc-900 border-t sm:border border-zinc-700/80 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-4 sm:p-7 shadow-2xl relative animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[92dvh] overflow-y-auto pb-safe">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-zinc-100 uppercase">
                    Número da Mesa / Balcão
                  </h3>
                  <p className="text-[11px] sm:text-xs text-zinc-400">
                    Mesas em verde já estão abertas — toque para pedir mais itens!
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  playTouchSound(400);
                  setIsTableModalOpen(false);
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-base font-bold shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Opção Rápida: Sem Mesa / Balcão */}
            <div className="pt-3">
              <button
                onClick={() => handleConfirmTable('Balcão')}
                className="w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border-2 border-amber-500/60 text-amber-300 font-display font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all min-h-[44px]"
              >
                <Store className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">Pedindo no Balcão (Sem Mesa Definida)</span>
              </button>
            </div>

            {/* Table Number Grid 01 a 11 */}
            <div className="py-3.5 sm:py-5">
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3">
                {tables.map((tbl) => {
                  const isSelected = tableNumber === tbl;
                  const summary = openTablesMap[tbl];
                  const isOccupied = !!summary;

                  return (
                    <button
                      key={tbl}
                      onClick={() => {
                        playTouchSound(550);
                        setTableNumber(tbl);
                      }}
                      className={`relative h-14 sm:h-16 rounded-2xl flex flex-col items-center justify-center font-display text-xl sm:text-2xl font-bold transition-all active:scale-90 border ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-lg shadow-amber-500/30 scale-105'
                          : isOccupied
                          ? 'bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-200 border-emerald-500/60'
                          : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border-zinc-700'
                      }`}
                    >
                      {isOccupied && (
                        <span
                          className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                            isSelected ? 'bg-zinc-950' : 'bg-emerald-400 animate-pulse'
                          }`}
                          title="Mesa Aberta"
                        />
                      )}
                      <span
                        className={`text-[9px] font-sans uppercase font-bold -mb-1 ${
                          isSelected
                            ? 'text-zinc-900'
                            : isOccupied
                            ? 'text-emerald-400'
                            : 'text-zinc-400'
                        }`}
                      >
                        {isOccupied ? 'Aberta' : 'Mesa'}
                      </span>
                      <span>{tbl}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Preview Box */}
              <div className="mt-3.5 sm:mt-5 p-3 sm:p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs uppercase font-bold text-zinc-500 block">
                    Local Selecionado:
                  </span>
                  <span className="font-display text-xl sm:text-2xl font-bold text-amber-400 block">
                    {tableNumber === 'Balcão' ? 'Balcão (Salão)' : `Mesa ${tableNumber}`}
                  </span>
                  {selectedTableSummary && (
                    <span className="text-[11px] sm:text-xs text-emerald-400 font-bold block mt-0.5 truncate">
                      🟢 Mesa Aberta ({selectedTableSummary.customerName}) · R${' '}
                      {selectedTableSummary.totalAmount.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg border font-bold whitespace-nowrap shrink-0 ${
                    selectedTableSummary
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  {selectedTableSummary ? 'Adicionar à Conta' : 'Abrir Nova Mesa'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 sm:gap-3 pt-1">
              <button
                onClick={() => {
                  playTouchSound(420);
                  setIsTableModalOpen(false);
                }}
                className="flex-1 py-3.5 px-3 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-xs sm:text-sm hover:bg-zinc-750 active:scale-95 min-h-[48px]"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmTable(tableNumber)}
                className="flex-2 py-3.5 px-4 sm:px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-display font-bold text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-1.5 min-h-[48px]"
              >
                <span className="truncate">
                  {tableNumber === 'Balcão'
                    ? 'Confirmar Balcão'
                    : selectedTableSummary
                    ? `Pedir + na Mesa ${tableNumber}`
                    : `Abrir Mesa ${tableNumber}`}
                </span>
                <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3] shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
