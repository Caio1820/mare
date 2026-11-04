import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Clock, ChefHat, Receipt, ArrowRight, BellRing } from 'lucide-react';
import { Order } from '../types';
import { ReceiptModal } from './ReceiptModal';
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

  // Trigger celebration confetti on arrival
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
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
    <div className="min-h-[calc(100vh-65px)] bg-zinc-950 p-6 sm:p-12 max-w-4xl mx-auto w-full flex flex-col justify-between items-center text-center">
      {/* Top Success Badge */}
      <div className="space-y-4 max-w-2xl">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-2xl shadow-emerald-500/10 animate-bounce">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.5]" />
        </div>

        <div>
          <span className="text-xs uppercase font-extrabold text-amber-400 tracking-widest block">
            Pedido Confirmado com Sucesso!
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-black uppercase text-zinc-100 mt-1">
            Pedido nº <span className="text-amber-400">#{order.orderNumber}</span> enviado para a cozinha!
          </h2>
          <p className="mt-2 text-zinc-400 text-sm sm:text-base">
            Seus hambúrgueres já estão sendo preparados com carinho e fogo na chapa.
          </p>
        </div>
      </div>

      {/* Giant Ticket Card */}
      <div className="my-8 w-full max-w-lg bg-zinc-900 border-2 border-amber-500/60 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-center gap-2 text-zinc-400 text-xs uppercase font-bold tracking-widest mb-1">
          <BellRing className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>Sua Senha de Chamada</span>
        </div>

        {/* Big Password */}
        <div className="font-display text-7xl sm:text-8xl font-black text-amber-400 tracking-widest py-2 select-all drop-shadow-md">
          {order.orderNumber}
        </div>

        <div className="mt-2 inline-flex items-center gap-2 bg-zinc-950 px-4 py-2 rounded-full border border-zinc-800 text-xs sm:text-sm font-semibold text-zinc-300">
          <ChefHat className="w-4 h-4 text-amber-500" />
          <span>
            {order.orderType === 'local'
              ? `Mesa ${order.tableNumber || '01'} · Salão Maré`
              : 'Embalagem Especial para Viagem'}
          </span>
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-800/80 flex items-center justify-around text-left">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Tempo Estimado</span>
            <div className="flex items-center gap-1.5 text-zinc-200 font-bold text-sm sm:text-base mt-0.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>12 a 18 minutos</span>
            </div>
          </div>

          <div className="h-8 w-px bg-zinc-800" />

          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Pagamento</span>
            <span className="text-zinc-200 font-bold text-sm sm:text-base mt-0.5 block">
              {order.paymentMethod === 'pix'
                ? 'Pix Aprovado'
                : order.paymentMethod === 'cartao_balcao'
                ? 'Pagar no Balcão'
                : 'Dinheiro Balcão'}
            </span>
          </div>
        </div>

        {/* Receipt trigger */}
        <div className="mt-6">
          <button
            onClick={() => {
              playTouchSound(550);
              setIsReceiptOpen(true);
            }}
            className="w-full py-3 px-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-700 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>Visualizar / Imprimir Comprovante Fiscal</span>
          </button>
        </div>
      </div>

      {/* Auto Reset Progress Bar & Button */}
      <div className="w-full max-w-md space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium mb-1.5">
            <span>Retornando à tela inicial em</span>
            <span className="font-mono font-bold text-amber-400">{secondsRemaining} segundos</span>
          </div>

          {/* Progress track */}
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
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
          className="w-full py-4 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-display font-bold text-base uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all min-h-[52px]"
        >
          <span>Iniciar Novo Pedido Agora</span>
          <ArrowRight className="w-5 h-5 text-amber-400" />
        </button>
      </div>

      {/* Receipt Modal */}
      {isReceiptOpen && <ReceiptModal order={order} onClose={() => setIsReceiptOpen(false)} />}
    </div>
  );
};
