import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Clock, ChefHat, Receipt, ArrowRight, Tv, User, Printer } from 'lucide-react';
import { Order } from '../types';
import { ThermalReceipt } from './ThermalReceipt';
import { playTouchSound } from '../utils/sound';

interface Step6ConfirmationProps {
  order: Order;
  onResetToIdle: () => void;
}

export const Step6Confirmation: React.FC<Step6ConfirmationProps> = ({
  order,
  onResetToIdle,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(10);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [hasAutoPrinted, setHasAutoPrinted] = useState<boolean>(false);

  // Auto trigger thermal print on mount for Pix paid orders
  useEffect(() => {
    if (!hasAutoPrinted && order.paymentStatus === 'pago') {
      setHasAutoPrinted(true);
      const printTimer = setTimeout(() => {
        try {
          window.print();
        } catch {
          // ignore
        }
      }, 700);
      return () => clearTimeout(printTimer);
    }
  }, [hasAutoPrinted, order]);

  // Trigger celebration confetti on arrival
  useEffect(() => {
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#F59E0B', '#EF4444', '#10B981', '#FFFFFF'],
      });
    } catch {
      // Ignore
    }
  }, []);

  // 10-second automatic countdown to Step 1 (Idle Screen)
  useEffect(() => {
    if (secondsRemaining <= 0) {
      onResetToIdle();
      return;
    }

    const timer = setTimeout(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsRemaining, onResetToIdle]);

  const progressPercentage = ((10 - secondsRemaining) / 10) * 100;

  return (
    <div className="min-h-[calc(100dvh-54px)] sm:min-h-[calc(100vh-65px)] bg-zinc-950 p-4 sm:p-10 max-w-4xl mx-auto w-full flex flex-col justify-between items-center text-center pb-safe overflow-y-auto">
      {/* Top Success Badge */}
      <div className="space-y-2 sm:space-y-3 max-w-2xl py-2">
        <div className="w-14 h-14 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-2xl shadow-emerald-500/10 animate-bounce">
          <CheckCircle2 className="w-8 h-8 sm:w-12 sm:h-12 stroke-[2.5]" />
        </div>

        <div>
          <span className="text-[10px] sm:text-xs uppercase font-extrabold text-amber-400 tracking-widest block">
            Pedido Confirmado com Sucesso!
          </span>
          <h2 className="font-display text-2xl sm:text-5xl font-black uppercase text-zinc-100 mt-1">
            Pedido <span className="text-amber-400">{order.orderNumber}</span> na cozinha!
          </h2>
          <div className="mt-1.5 inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-zinc-200 text-xs sm:text-sm font-semibold">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span>Cliente: <strong className="text-white">{order.customerName}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Attention Callout Box: Exact requested message */}
      <div className="my-3 sm:my-6 w-full max-w-xl bg-gradient-to-r from-amber-500/15 via-zinc-900 to-amber-500/15 border-2 border-amber-500/70 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-center gap-2 text-amber-400 text-[10px] sm:text-xs uppercase font-bold tracking-widest mb-1 sm:mb-2">
          <Tv className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
          <span>Fique Atento ao Painel de TV</span>
        </div>

        {/* Big Order Number */}
        <div className="font-display text-6xl sm:text-8xl font-black text-amber-400 tracking-widest py-1 select-all drop-shadow-md">
          {order.orderNumber}
        </div>

        {/* Big Customer Name */}
        <div className="font-display text-xl sm:text-3xl font-bold uppercase text-zinc-100 tracking-wide">
          {order.customerName}
        </div>

        {/* Counter Payment Callout Banner */}
        <div className="mt-3 sm:mt-4 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-200 font-bold text-sm sm:text-base leading-snug flex items-center justify-center gap-2 shadow-lg">
          <span className="text-xl">💳</span>
          <span>PAGAMENTO NO BALCÃO: Dirija-se ao caixa com a sua senha para efetuar o pagamento.</span>
        </div>

        {/* Required Message Banner */}
        <div className="mt-2.5 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-950/80 border border-amber-500/30 text-amber-300 font-semibold text-xs sm:text-sm leading-snug">
          "Acompanhe o painel, vamos chamar você quando estiver pronto."
        </div>

        <div className="mt-3 sm:mt-5 flex items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            Preparo ~15 min
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <ChefHat className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            {order.orderType === 'local' ? `Mesa ${order.tableNumber || '01'}` : 'Para Viagem'}
          </span>
        </div>

        {/* Thermal Receipt trigger */}
        <div className="mt-4 sm:mt-6">
          <button
            onClick={() => {
              playTouchSound(550);
              setIsReceiptOpen(true);
            }}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-700 flex items-center justify-center gap-2 transition-all active:scale-95 min-h-[44px]"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Visualizar / Reimprimir Comanda Térmica (80mm)</span>
          </button>
        </div>
      </div>

      {/* Auto Reset Progress Bar & Button */}
      <div className="w-full max-w-md space-y-3 sm:space-y-4 py-2">
        <div>
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-zinc-400 font-medium mb-1">
            <span>Retornando em</span>
            <span className="font-mono font-bold text-amber-400">{secondsRemaining} segundos</span>
          </div>

          {/* Progress track */}
          <div className="w-full h-1.5 sm:h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => {
            playTouchSound(600);
            onResetToIdle();
          }}
          className="w-full py-3 sm:py-4 px-6 rounded-xl sm:rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-display font-bold text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all min-h-[48px] sm:min-h-[52px]"
        >
          <span>Iniciar Novo Pedido</span>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
        </button>
      </div>

      {/* Thermal Receipt Modal */}
      {isReceiptOpen && <ThermalReceipt order={order} onClose={() => setIsReceiptOpen(false)} />}
    </div>
  );
};
