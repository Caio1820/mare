import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Receipt,
  ArrowRight,
  ArrowLeft,
  Tv,
  User,
  Printer,
  PlusCircle,
  Flame,
  Bell,
  Ban,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { OpenTableSummary, fetchSingleOrder } from '../utils/kdsStore';
import { ThermalReceipt } from './ThermalReceipt';
import { playTouchSound, playKitchenBell } from '../utils/sound';

interface Step6ConfirmationProps {
  order: Order;
  liveOrders?: Order[];
  onResetToIdle: () => void;
  openTableSummary?: OpenTableSummary;
  onOrderMoreOnSameTable?: () => void;
  onOpenTablesModal?: () => void;
  isQrTableLocked?: boolean;
}

const TRACK_STEPS: Array<{
  status: Exclude<OrderStatus, 'cancelado'>;
  title: string;
  desc: string;
}> = [
  {
    status: 'recebido',
    title: 'Pedido Recebido',
    desc: 'Sua senha já está na tela da cozinha',
  },
  {
    status: 'preparo',
    title: 'Em Preparo na Chapa',
    desc: 'Nossa equipe está preparando seus itens',
  },
  {
    status: 'pronto',
    title: 'Pronto!',
    desc: 'Disponível para retirada ou entrega na mesa',
  },
  {
    status: 'entregue',
    title: 'Entregue',
    desc: 'Bom apetite! Pedido concluído',
  },
];

function getStepIndex(status: OrderStatus): number {
  switch (status) {
    case 'recebido':
      return 0;
    case 'preparo':
      return 1;
    case 'pronto':
      return 2;
    case 'entregue':
      return 3;
    default:
      return 0;
  }
}

export const Step6Confirmation: React.FC<Step6ConfirmationProps> = ({
  order,
  liveOrders = [],
  onResetToIdle,
  openTableSummary,
  onOrderMoreOnSameTable,
  onOpenTablesModal,
  isQrTableLocked = false,
}) => {
  const isNumberedTable =
    order.orderType === 'local' &&
    order.tableNumber &&
    order.tableNumber.toLowerCase() !== 'balcão' &&
    order.tableNumber.toLowerCase() !== 'balcao';

  const totalCountdownSeconds = isNumberedTable ? 25 : 15;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalCountdownSeconds);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [isTrackingOrder, setIsTrackingOrder] = useState<boolean>(false);
  const [polledOrder, setPolledOrder] = useState<Order | null>(null);
  const [isRefreshingTrack, setIsRefreshingTrack] = useState<boolean>(false);

  const liveMatch = liveOrders.find((o) => o.id === order.id);
  const trackedOrder: Order = polledOrder || liveMatch || order;
  const previousStatusRef = useRef<OrderStatus>(trackedOrder.status);

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

  // Poll backend/history every 2.5s when tracking mode is open (also catches 'entregue' & 'cancelado')
  useEffect(() => {
    if (!isTrackingOrder) return;

    let isMounted = true;
    const syncNow = async () => {
      const fresh = await fetchSingleOrder(order.id);
      if (isMounted && fresh) {
        setPolledOrder(fresh);
      }
    };

    syncNow();
    const interval = setInterval(syncNow, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isTrackingOrder, order.id]);

  // Chime notification when order transitions to 'pronto' while customer tracks it
  useEffect(() => {
    if (
      isTrackingOrder &&
      previousStatusRef.current !== 'pronto' &&
      trackedOrder.status === 'pronto'
    ) {
      playKitchenBell();
    }
    previousStatusRef.current = trackedOrder.status;
  }, [trackedOrder.status, isTrackingOrder]);

  // Automatic countdown to Idle/Menu, paused while receipt modal or live tracking is open
  useEffect(() => {
    if (isReceiptOpen || isTrackingOrder) return;
    if (secondsRemaining <= 0) {
      onResetToIdle();
      return;
    }

    const timer = setTimeout(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsRemaining, onResetToIdle, isReceiptOpen, isTrackingOrder]);

  const progressPercentage =
    ((totalCountdownSeconds - secondsRemaining) / totalCountdownSeconds) * 100;

  // LIVE ORDER TRACKING SCREEN
  if (isTrackingOrder) {
    const isCancelled = trackedOrder.status === 'cancelado';
    const currentIdx = getStepIndex(trackedOrder.status);

    return (
      <div className="min-h-[calc(100dvh-54px)] sm:min-h-[calc(100vh-65px)] bg-zinc-950 p-4 sm:p-8 max-w-2xl mx-auto w-full flex flex-col justify-between pb-safe overflow-y-auto space-y-5">
        <div className="space-y-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                playTouchSound(480);
                setIsTrackingOrder(false);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold text-xs sm:text-sm hover:bg-zinc-800 hover:text-white active:scale-95 transition-all min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Voltar à Senha</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                playTouchSound(520);
                setIsRefreshingTrack(true);
                const fresh = await fetchSingleOrder(order.id);
                if (fresh) setPolledOrder(fresh);
                setIsRefreshingTrack(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 text-xs font-semibold min-h-[44px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingTrack ? 'animate-spin text-amber-400' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>

          {/* Order Identity Banner */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Acompanhamento em Tempo Real
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-black text-amber-400 mt-0.5">
                {trackedOrder.orderNumber}
              </h2>
              <p className="text-sm font-bold text-zinc-100 truncate">
                {trackedOrder.customerName} ·{' '}
                {trackedOrder.orderType === 'local'
                  ? `Mesa ${trackedOrder.tableNumber || '01'}`
                  : 'Para Viagem'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Valor</span>
              <span className="font-mono tabular-nums text-lg sm:text-xl font-black text-zinc-100">
                R$ {trackedOrder.total.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* Cancelled Alert OR 4-Stage Stepper */}
          {isCancelled ? (
            <div className="bg-red-950/40 border-2 border-red-500/60 rounded-3xl p-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
                <Ban className="w-8 h-8" />
              </div>
              <h3 className="font-display text-2xl font-black uppercase text-red-300">
                Pedido Cancelado pela Cozinha
              </h3>
              {trackedOrder.cancelReason && (
                <p className="text-sm text-red-200 font-semibold">
                  Motivo: {trackedOrder.cancelReason}
                </p>
              )}
              <p className="text-xs text-zinc-300 leading-relaxed max-w-md mx-auto">
                Este pedido foi cancelado para correção ou ajuste. Você pode fazer um novo pedido corrigido agora mesmo ou falar com nossa equipe no balcão.
              </p>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3">
              {TRACK_STEPS.map((step, idx) => {
                const isDone = idx < currentIdx || (idx === 3 && trackedOrder.status === 'entregue');
                const isCurrent = idx === currentIdx && trackedOrder.status !== 'entregue';
                const isReadyNow = isCurrent && step.status === 'pronto';

                return (
                  <div
                    key={step.status}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all ${
                      isReadyNow
                        ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-500/30'
                        : isCurrent
                        ? 'bg-amber-500/15 border-amber-500/60'
                        : isDone
                        ? 'bg-zinc-950 border-emerald-500/30 opacity-85'
                        : 'bg-zinc-950/60 border-zinc-800/80 opacity-45'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isReadyNow
                          ? 'bg-emerald-500 text-zinc-950'
                          : isCurrent
                          ? 'bg-amber-500 text-zinc-950'
                          : isDone
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {step.status === 'recebido' && <Clock className="w-5 h-5" />}
                      {step.status === 'preparo' && <Flame className="w-5 h-5" />}
                      {step.status === 'pronto' && <Bell className="w-5 h-5" />}
                      {step.status === 'entregue' && <Sparkles className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-display text-sm sm:text-base font-bold uppercase ${
                            isReadyNow
                              ? 'text-emerald-300'
                              : isCurrent
                              ? 'text-amber-300'
                              : isDone
                              ? 'text-zinc-200'
                              : 'text-zinc-400'
                          }`}
                        >
                          {step.title}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-md bg-black/30 text-[10px] font-bold uppercase text-amber-300">
                            Agora
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">{step.desc}</p>
                    </div>

                    {isDone && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Items Summary */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-left space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
              Itens do Pedido ({trackedOrder.items.reduce((a, b) => a + b.quantity, 0)} un)
            </span>
            <div className="divide-y divide-zinc-800/70">
              {trackedOrder.items.map((item, idx) => (
                <div
                  key={item.cartItemId || idx}
                  className="py-2 flex items-center justify-between gap-2 text-xs sm:text-sm"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-amber-400 mr-1.5">{item.quantity}x</span>
                    <span className="font-semibold text-zinc-100">{item.product.name}</span>
                    {item.isTakeaway && (
                      <span className="ml-1.5 text-[10px] font-bold uppercase text-sky-400">
                        · Para Viagem
                      </span>
                    )}
                  </div>
                  <span className="font-mono tabular-nums font-bold text-zinc-300 shrink-0">
                    R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-2.5 pt-2">
          {isNumberedTable && onOrderMoreOnSameTable && (
            <button
              type="button"
              onClick={() => {
                playTouchSound(620);
                onOrderMoreOnSameTable();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all min-h-[48px]"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Pedir Mais Itens na Mesa {order.tableNumber}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              playTouchSound(580);
              onResetToIdle();
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-display font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all min-h-[48px]"
          >
            <span>
              {isQrTableLocked
                ? `Voltar ao Cardápio da Mesa ${order.tableNumber || '01'}`
                : 'Voltar para a Tela Inicial'}
            </span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-54px)] sm:min-h-[calc(100vh-65px)] bg-zinc-950 p-4 sm:p-10 max-w-4xl mx-auto w-full flex flex-col justify-between items-center text-center pb-safe overflow-y-auto">
      {/* Top Success Badge */}
      <div className="space-y-2 sm:space-y-3 max-w-2xl py-2">
        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-2xl shadow-emerald-500/10 animate-bounce">
          <CheckCircle2 className="w-8 h-8 sm:w-11 sm:h-11 stroke-[2.5]" />
        </div>

        <div>
          <span className="text-[10px] sm:text-xs uppercase font-extrabold text-amber-400 tracking-widest block">
            {order.roundNumber && order.roundNumber > 1
              ? `${order.roundNumber}º Pedido Adicionado à Mesa ${order.tableNumber}!`
              : 'Pedido Confirmado com Sucesso!'}
          </span>
          <h2 className="font-display text-2xl sm:text-5xl font-black uppercase text-zinc-100 mt-1">
            Pedido <span className="text-amber-400">{order.orderNumber}</span> na cozinha!
          </h2>
          <div className="mt-1.5 inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-zinc-200 text-xs sm:text-sm font-semibold">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span>
              Cliente: <strong className="text-white">{order.customerName}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Attention Callout Box */}
      <div className="my-3 sm:my-5 w-full max-w-xl bg-gradient-to-r from-amber-500/15 via-zinc-900 to-amber-500/15 border-2 border-amber-500/70 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-center gap-2 text-amber-400 text-[10px] sm:text-xs uppercase font-bold tracking-widest mb-1 sm:mb-2">
          <Tv className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
          <span>Fique Atento ao Painel de TV</span>
        </div>

        {/* Big Order Number */}
        <div className="font-display text-6xl sm:text-7xl font-black text-amber-400 tracking-widest py-1 select-all drop-shadow-md">
          {order.orderNumber}
        </div>

        {/* Big Customer Name */}
        <div className="font-display text-xl sm:text-2xl font-bold uppercase text-zinc-100 tracking-wide">
          {order.customerName}
        </div>

        {/* Prominent ACOMPANHAR O PEDIDO Button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => {
              playTouchSound(620);
              setIsTrackingOrder(true);
            }}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-display font-black text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all min-h-[50px]"
          >
            <Bell className="w-5 h-5 stroke-[2.5] shrink-0" />
            <span>Acompanhar o Pedido</span>
          </button>
        </div>

        {/* Open Table Callout Banner */}
        {isNumberedTable ? (
          <div className="mt-3 sm:mt-4 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/60 text-emerald-200 text-left space-y-2 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <span className="font-display font-black text-sm sm:text-base uppercase text-emerald-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                Mesa {order.tableNumber} Permanece Aberta!
              </span>
              {openTableSummary && (
                <span className="font-mono text-xs sm:text-sm font-black text-amber-400 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                  Total Mesa: R$ {openTableSummary.totalAmount.toFixed(2).replace('.', ',')}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed">
              Você pode pedir mais bebidas, porções ou outros itens a qualquer momento durante o seu consumo basta selecionar a <strong>Mesa {order.tableNumber}</strong>. O pagamento total é feito no balcão ao encerrar!
            </p>

            {onOrderMoreOnSameTable && (
              <div className="pt-1 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    playTouchSound(620);
                    onOrderMoreOnSameTable();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md min-h-[44px]"
                >
                  <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>Pedir Mais Itens na Mesa {order.tableNumber}</span>
                </button>

                {onOpenTablesModal && (
                  <button
                    onClick={() => {
                      playTouchSound(550);
                      onOpenTablesModal();
                    }}
                    className="py-3 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-300 border border-emerald-500/40 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all min-h-[44px]"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Ver Conta da Mesa</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 sm:mt-4 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-200 font-bold text-sm sm:text-base leading-snug flex items-center justify-center gap-2 shadow-lg">
            <span className="text-xl">💳</span>
            <span>
              PAGAMENTO NO BALCÃO: Dirija-se ao caixa com a sua senha para efetuar o pagamento.
            </span>
          </div>
        )}

        {/* Required Message Banner */}
        <div className="mt-2.5 p-3 rounded-xl bg-zinc-950/80 border border-amber-500/30 text-amber-300 font-semibold text-xs sm:text-sm leading-snug">
          "Acompanhe o painel, vamos chamar você quando estiver pronto."
        </div>

        <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            Preparo ~15 min
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <ChefHat className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            {order.orderType === 'local'
              ? `Mesa ${order.tableNumber || '01'}${
                  order.items.some((i) => i.isTakeaway) ? ' · Inclui Para Viagem' : ''
                }`
              : 'Para Viagem'}
          </span>
        </div>

        {/* Thermal Receipt trigger */}
        <div className="mt-3">
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
            <span>
              {isQrTableLocked
                ? `Retornando ao cardápio da Mesa ${order.tableNumber || '01'} em`
                : 'Retornando ao início em'}
            </span>
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
          <span>
            {isQrTableLocked
              ? `Voltar ao Cardápio da Mesa ${order.tableNumber || '01'}`
              : 'Voltar para a Tela Inicial'}
          </span>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
        </button>
      </div>

      {/* Thermal Receipt Modal */}
      {isReceiptOpen && <ThermalReceipt order={trackedOrder} onClose={() => setIsReceiptOpen(false)} />}
    </div>
  );
};
