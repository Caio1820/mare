import React, { useState } from 'react';
import {
  UtensilsCrossed,
  X,
  PlusCircle,
  Receipt,
  CheckCircle2,
  Clock,
  User,
  ChefHat,
  Printer,
  ArrowRight,
  Sparkles,
  CreditCard,
  Banknote,
  QrCode,
  Check,
  LayoutGrid,
} from 'lucide-react';
import { Order, OrderStatus, PaymentMethod } from '../types';
import { OpenTableSummary, getOpenTablesMap, closeTableTab } from '../utils/kdsStore';
import { printCustomerBill } from './ThermalReceipt';
import { playTouchSound, playSuccessChime } from '../utils/sound';

interface OpenTablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  activeTableNumber?: string;
  onSelectTableForOrder: (tableNumber: string, existingCustomerName?: string) => void;
  isStaffMode?: boolean;
}

const ALL_TABLES = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'recebido':
      return (
        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase whitespace-nowrap">
          Na Fila
        </span>
      );
    case 'preparo':
      return (
        <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px] font-bold uppercase whitespace-nowrap">
          Preparando
        </span>
      );
    case 'pronto':
      return (
        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase whitespace-nowrap">
          Pronto
        </span>
      );
    case 'entregue':
      return (
        <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-bold uppercase whitespace-nowrap">
          ✓ Na Mesa
        </span>
      );
  }
}

export const OpenTablesModal: React.FC<OpenTablesModalProps> = ({
  isOpen,
  onClose,
  orders,
  activeTableNumber,
  onSelectTableForOrder,
}) => {
  const openTablesMap = getOpenTablesMap(orders);
  const openTableKeys = Object.keys(openTablesMap).sort();

  const [selectedTable, setSelectedTable] = useState<string>(() => {
    if (activeTableNumber && activeTableNumber !== 'Balcão') return activeTableNumber;
    if (openTableKeys.length > 0) return openTableKeys[0];
    return '01';
  });

  // Mobile view mode: 'details' shows selected table consumption immediately; 'map' shows full 11-table grid
  const [mobileViewMode, setMobileViewMode] = useState<'details' | 'map'>('details');

  // States for Closing the Table (Garçom na Mesa / Caixa)
  const [isClosingTable, setIsClosingTable] = useState<boolean>(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<
    'cartao_mesa' | 'pix' | 'dinheiro' | 'balcao'
  >('cartao_mesa');
  const [cashAmountGiven, setCashAmountGiven] = useState<string>('');
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSummary: OpenTableSummary | undefined = openTablesMap[selectedTable];

  const handleAddMoreItems = (tbl: string, summary?: OpenTableSummary) => {
    playTouchSound(620);
    onClose();
    onSelectTableForOrder(tbl, summary?.customerName);
  };

  const handlePrintViaCliente = (summary: OpenTableSummary) => {
    playTouchSound(550);
    const label =
      selectedPaymentType === 'cartao_mesa'
        ? 'CARTÃO (NA MESA / GARÇOM)'
        : selectedPaymentType === 'pix'
        ? 'PIX'
        : selectedPaymentType === 'dinheiro'
        ? 'DINHEIRO'
        : 'PAGAMENTO NO BALCÃO';
    printCustomerBill(summary, label, 'PAGO / CONFERIDO');
  };

  const handleConfirmCloseTable = async (tbl: string, _summary: OpenTableSummary) => {
    if (isFinishing) return;
    setIsFinishing(true);
    playSuccessChime();

    const paymentMethodMap: Record<string, PaymentMethod> = {
      cartao_mesa: 'cartao_balcao',
      pix: 'pix',
      dinheiro: 'dinheiro_balcao',
      balcao: 'balcao',
    };

    const chosenMethod = paymentMethodMap[selectedPaymentType] || 'balcao';

    try {
      await closeTableTab(tbl, chosenMethod);
      setFeedbackSuccess(
        `Mesa ${tbl} fechada com sucesso! Conta quitada e mesa liberada para novos clientes.`
      );

      setTimeout(() => {
        setIsClosingTable(false);
        setIsFinishing(false);
        setFeedbackSuccess(null);
      }, 2200);
    } catch {
      setIsFinishing(false);
    }
  };

  const totalAmount = currentSummary?.totalAmount || 0;
  const cashNum = parseFloat(cashAmountGiven.replace(',', '.')) || 0;
  const changeValue = Math.max(0, cashNum - totalAmount);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-zinc-900 border-t sm:border border-zinc-700/90 rounded-t-3xl sm:rounded-3xl w-full max-w-4xl max-h-[94dvh] sm:max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="px-3.5 py-3 sm:px-6 sm:py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-base sm:text-2xl font-bold uppercase text-zinc-100 tracking-wide truncate">
                  Mesas & Conta no Salão
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase whitespace-nowrap">
                  {openTableKeys.length} {openTableKeys.length === 1 ? 'Aberta' : 'Abertas'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 truncate">
                Peça mais itens na mesa ou feche a conta com o garçom
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playTouchSound(400);
              onClose();
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center shrink-0 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Quick Table Strip (Visible on < lg so user can switch tables in 1 tap without scrolling) */}
        <div className="lg:hidden bg-zinc-950/90 border-b border-zinc-800 px-3 py-2 shrink-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Selecione a Mesa (01 a 11):
            </span>
            <button
              onClick={() => {
                playTouchSound(520);
                setMobileViewMode((prev) => (prev === 'details' ? 'map' : 'details'));
              }}
              className="text-[11px] font-bold text-amber-400 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>{mobileViewMode === 'details' ? 'Ver Mapa Geral' : 'Ver Conta da Mesa'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {ALL_TABLES.map((tbl) => {
              const summary = openTablesMap[tbl];
              const isOccupied = !!summary;
              const isSelected = selectedTable === tbl;

              return (
                <button
                  key={tbl}
                  onClick={() => {
                    playTouchSound(540);
                    setSelectedTable(tbl);
                    setIsClosingTable(false);
                    setFeedbackSuccess(null);
                    setMobileViewMode('details');
                  }}
                  className={`relative px-3 py-1.5 rounded-xl font-display font-bold text-xs uppercase transition-all shrink-0 flex items-center gap-1.5 min-h-[38px] border ${
                    isSelected
                      ? isOccupied
                        ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md'
                        : 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md'
                      : isOccupied
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  {isOccupied && (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? 'bg-zinc-950' : 'bg-emerald-400 animate-pulse'
                      }`}
                    />
                  )}
                  <span>Mesa {tbl}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body: Left Table Grid (01..11) + Right Selected Table Details */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* Left Column: 11 Tables Grid (Always visible on desktop, toggleable on mobile) */}
          <div
            className={`lg:col-span-5 space-y-3 ${
              mobileViewMode === 'map' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
              <span>Mapa de Mesas (01 a 11)</span>
              <span className="text-[11px] text-amber-400">Toque para Abrir</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2 sm:gap-2.5">
              {ALL_TABLES.map((tbl) => {
                const summary = openTablesMap[tbl];
                const isOccupied = !!summary;
                const isSelected = selectedTable === tbl;

                return (
                  <button
                    key={tbl}
                    onClick={() => {
                      playTouchSound(540);
                      setSelectedTable(tbl);
                      setIsClosingTable(false);
                      setFeedbackSuccess(null);
                      setMobileViewMode('details');
                    }}
                    className={`relative p-2.5 sm:p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between min-h-[78px] sm:min-h-[86px] active:scale-95 ${
                      isSelected
                        ? isOccupied
                          ? 'bg-emerald-950/50 border-emerald-400 ring-2 ring-emerald-500/30 shadow-lg'
                          : 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-500/30 shadow-lg'
                        : isOccupied
                        ? 'bg-emerald-950/25 hover:bg-emerald-950/40 border-emerald-500/50'
                        : 'bg-zinc-950/80 hover:bg-zinc-800/70 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-display text-lg sm:text-xl font-black text-zinc-100">
                        Mesa {tbl}
                      </span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isOccupied ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-700'
                        }`}
                      />
                    </div>

                    {isOccupied ? (
                      <div className="mt-1">
                        <span className="text-[10px] font-bold text-emerald-300 uppercase block truncate">
                          {summary.customerName}
                        </span>
                        <span className="font-mono text-xs font-black text-amber-400 block">
                          R$ {summary.totalAmount.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-1.5">
                        <span className="text-[10px] font-semibold uppercase text-zinc-500 block">
                          Livre
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shrink-0" />
                <span>
                  <strong className="text-emerald-300">Mesa Aberta:</strong> Consumo ativo. O cliente pode pedir novos itens e fechar a conta com o garçom.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 inline-block shrink-0" />
                <span>
                  <strong className="text-zinc-300">Mesa Livre:</strong> Pronta para receber novos clientes.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Selected Table Content */}
          <div
            className={`lg:col-span-7 flex flex-col justify-between bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 sm:p-5 ${
              mobileViewMode === 'details' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {currentSummary ? (
              isClosingTable ? (
                /* --- PAINEL DE FECHAMENTO DE CONTA COM O GARÇOM / CAIXA --- */
                <div className="space-y-3.5 sm:space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between gap-2 pb-2.5 sm:pb-3 border-b border-zinc-800">
                    <div className="min-w-0">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-zinc-950 font-black text-[10px] sm:text-xs uppercase tracking-wider">
                        FECHAR CONTA · MESA {selectedTable}
                      </span>
                      <h3 className="font-display text-lg sm:text-xl font-bold uppercase text-zinc-100 mt-1 truncate">
                        {currentSummary.customerName}
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsClosingTable(false)}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold border border-zinc-800 shrink-0"
                    >
                      Voltar
                    </button>
                  </div>

                  {feedbackSuccess ? (
                    <div className="p-5 sm:p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500 text-center space-y-3 animate-in zoom-in-95">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
                        <Check className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3]" />
                      </div>
                      <h4 className="font-display text-xl sm:text-2xl font-bold uppercase text-emerald-300">
                        Conta Encerrada!
                      </h4>
                      <p className="text-xs text-zinc-300">{feedbackSuccess}</p>
                    </div>
                  ) : (
                    <>
                      {/* Total Box */}
                      <div className="p-3 sm:p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                            Total do Consumo
                          </span>
                          <span className="text-[11px] sm:text-xs text-zinc-400">
                            {currentSummary.orders.length} pedido(s) · {currentSummary.totalItemsCount} item(ns)
                          </span>
                        </div>
                        <span className="font-mono text-2xl sm:text-3xl font-black text-amber-400 tabular-nums">
                          R$ {totalAmount.toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      {/* Payment Method Selector */}
                      <div className="space-y-2">
                        <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                          Forma de Pagamento (Garçom na Mesa ou Balcão):
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              playTouchSound(550);
                              setSelectedPaymentType('cartao_mesa');
                            }}
                            className={`p-2.5 sm:p-3 rounded-xl border text-left flex items-center gap-2 transition-all min-h-[54px] ${
                              selectedPaymentType === 'cartao_mesa'
                                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-2 ring-amber-500/30'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850'
                            }`}
                          >
                            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="font-bold text-xs truncate">Cartão na Mesa</div>
                              <div className="text-[10px] text-zinc-400 truncate">Levar maquininha</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              playTouchSound(550);
                              setSelectedPaymentType('pix');
                            }}
                            className={`p-2.5 sm:p-3 rounded-xl border text-left flex items-center gap-2 transition-all min-h-[54px] ${
                              selectedPaymentType === 'pix'
                                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-2 ring-amber-500/30'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850'
                            }`}
                          >
                            <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="font-bold text-xs truncate">PIX</div>
                              <div className="text-[10px] text-zinc-400 truncate">Chave / QR Code</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              playTouchSound(550);
                              setSelectedPaymentType('dinheiro');
                            }}
                            className={`p-2.5 sm:p-3 rounded-xl border text-left flex items-center gap-2 transition-all min-h-[54px] ${
                              selectedPaymentType === 'dinheiro'
                                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-2 ring-amber-500/30'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850'
                            }`}
                          >
                            <Banknote className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="font-bold text-xs truncate">Dinheiro</div>
                              <div className="text-[10px] text-zinc-400 truncate">Calcular troco</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              playTouchSound(550);
                              setSelectedPaymentType('balcao');
                            }}
                            className={`p-2.5 sm:p-3 rounded-xl border text-left flex items-center gap-2 transition-all min-h-[54px] ${
                              selectedPaymentType === 'balcao'
                                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-2 ring-amber-500/30'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850'
                            }`}
                          >
                            <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="font-bold text-xs truncate">Pago no Caixa</div>
                              <div className="text-[10px] text-zinc-400 truncate">Direto no balcão</div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Cash change calculator */}
                      {selectedPaymentType === 'dinheiro' && (
                        <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="text-zinc-400 block font-bold text-[11px]">
                              Valor Entregue:
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-zinc-500 font-bold">R$</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={cashAmountGiven}
                                onChange={(e) => setCashAmountGiven(e.target.value)}
                                placeholder={totalAmount.toFixed(2)}
                                className="w-24 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 font-mono text-zinc-100 text-sm focus:outline-none focus:border-amber-400"
                              />
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-zinc-400 block font-bold text-[11px]">Troco:</span>
                            <span className="font-mono text-base font-bold text-emerald-400 tabular-nums">
                              R$ {changeValue.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Print Customer Slip & Finalize Button */}
                      <div className="pt-1 space-y-2">
                        <button
                          type="button"
                          onClick={() => handlePrintViaCliente(currentSummary)}
                          className="w-full py-2.5 px-3 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all min-h-[44px]"
                        >
                          <Printer className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Imprimir 3ª Via: Cliente (Levar à Mesa)</span>
                        </button>

                        <button
                          type="button"
                          disabled={isFinishing}
                          onClick={() => handleConfirmCloseTable(selectedTable, currentSummary)}
                          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[48px]"
                        >
                          <CheckCircle2 className="w-5 h-5 stroke-[2.5] shrink-0" />
                          <span>
                            {isFinishing
                              ? 'Finalizando...'
                              : `Confirmar Pagamento & Liberar Mesa ${selectedTable}`}
                          </span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* --- PAINEL DE VISUALIZAÇÃO DOS PEDIDOS DA MESA --- */
                <>
                  <div>
                    {/* Active Table Header */}
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-zinc-800">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-zinc-950 font-black text-[10px] sm:text-xs uppercase tracking-wider">
                            MESA {selectedTable} ABERTA
                          </span>
                          <span className="text-[11px] sm:text-xs text-zinc-400 font-mono">
                            {currentSummary.orders.length}{' '}
                            {currentSummary.orders.length === 1 ? 'pedido' : 'pedidos'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-100 font-bold text-sm sm:text-lg mt-1 truncate">
                          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                          <span className="truncate">Cliente: {currentSummary.customerName}</span>
                        </div>
                      </div>

                      <div className="text-right bg-zinc-900 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-zinc-800 shrink-0">
                        <span className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-400 block">
                          Total da Mesa
                        </span>
                        <span className="font-mono text-lg sm:text-2xl font-black text-amber-400 tabular-nums">
                          R$ {currentSummary.totalAmount.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>

                    {/* Rounds / Orders History on this Open Table */}
                    <div className="py-3 space-y-2.5 max-h-[36dvh] sm:max-h-[34vh] overflow-y-auto pr-0.5 custom-kiosk-scroll">
                      {currentSummary.orders.map((ord, idx) => (
                        <div
                          key={ord.id}
                          className="p-2.5 sm:p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-display font-black text-xs sm:text-sm text-amber-400 truncate">
                                {idx + 1}º Pedido ({ord.orderNumber})
                              </span>
                              <span className="text-[10px] sm:text-[11px] text-zinc-500 font-mono flex items-center gap-1 shrink-0">
                                <Clock className="w-3 h-3" />
                                {ord.formattedTime || ''}
                              </span>
                            </div>
                            {getStatusBadge(ord.status)}
                          </div>

                          <div className="space-y-1">
                            {ord.items.map((item, i) => (
                              <div
                                key={i}
                                className="flex items-start justify-between gap-2 text-xs text-zinc-200"
                              >
                                <div className="min-w-0">
                                  <span className="font-bold text-amber-400 mr-1">
                                    {item.quantity}x
                                  </span>
                                  <span className="font-semibold">{item.product.name}</span>
                                  {item.customization?.selectedOption && (
                                    <span className="text-amber-300 text-[10px] ml-1">
                                      ({item.customization.selectedOption})
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-zinc-300 font-semibold shrink-0 tabular-nums">
                                  R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action CTAs for Open Table */}
                  <div className="pt-2.5 border-t border-zinc-800 space-y-2">
                    {/* Botão de pedir mais itens */}
                    <button
                      onClick={() => handleAddMoreItems(selectedTable, currentSummary)}
                      className="w-full py-3 sm:py-3.5 px-4 sm:px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-display font-black text-xs sm:text-base uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[46px]"
                    >
                      <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] shrink-0" />
                      <span>Pedir Mais Itens na Mesa {selectedTable}</span>
                      <ArrowRight className="w-4 h-4 stroke-[3] shrink-0" />
                    </button>

                    {/* Botões de Fechamento e Impressão */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          playTouchSound(550);
                          printCustomerBill(currentSummary, 'CONFERÊNCIA DE MESA', 'A CONFERIR');
                        }}
                        className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all min-h-[44px]"
                      >
                        <Printer className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Imprimir Conferência (80mm)</span>
                      </button>

                      {/* BOTÃO PRINCIPAL DE FECHAR CONTA NA MESA */}
                      <button
                        onClick={() => {
                          playTouchSound(600);
                          setIsClosingTable(true);
                        }}
                        className="py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md min-h-[44px]"
                      >
                        <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Fechar Conta / Encerrar Consumo</span>
                      </button>
                    </div>
                  </div>
                </>
              )
            ) : (
              /* Free Table State */
              <div className="my-auto py-6 sm:py-8 text-center space-y-3.5 sm:space-y-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-amber-400">
                  <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase tracking-wider">
                    Mesa Disponível
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-black uppercase text-zinc-100 mt-1">
                    Mesa {selectedTable} está Livre
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto mt-1">
                    Abra a Mesa {selectedTable} para fazer o primeiro pedido. Ela continuará aberta para pedir bebidas ou novos pratos durante o consumo, e o garçom poderá fechar a conta na própria mesa!
                  </p>
                </div>

                <div className="pt-1 max-w-xs mx-auto">
                  <button
                    onClick={() => handleAddMoreItems(selectedTable)}
                    className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <ChefHat className="w-5 h-5 shrink-0" />
                    <span>Abrir Mesa {selectedTable} & Fazer Pedido</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
