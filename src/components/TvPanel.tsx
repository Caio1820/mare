import React, { useEffect, useState, useRef } from 'react';
import { ChefHat, Volume2, VolumeX, Flame, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Order } from '../types';
import { subscribeToOrders } from '../utils/kdsStore';
import { speakOrderReady, unlockAudioContext, playDingDong } from '../utils/sound';

interface TvPanelProps {
  onBackToKiosk: () => void;
}

export const TvPanel: React.FC<TvPanelProps> = ({ onBackToKiosk }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Order | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Keep track of announced order IDs to prevent duplicate speak calls
  const announcedOrderIdsRef = useRef<Set<string>>(new Set());
  const initialMountRef = useRef<boolean>(true);

  // Clock updates every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(
        now.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen to real-time orders
  useEffect(() => {
    const unsubscribe = subscribeToOrders((newOrders) => {
      setOrders(newOrders);

      // Check for newly ready orders
      const prontoOrders = newOrders.filter((o) => o.status === 'pronto');

      if (!initialMountRef.current) {
        for (const order of prontoOrders) {
          if (!announcedOrderIdsRef.current.has(order.id)) {
            announcedOrderIdsRef.current.add(order.id);
            triggerOrderAnnouncement(order);
            break;
          }
        }
      } else {
        // On initial load, record existing pronto orders so we don't spam speech on page refresh
        prontoOrders.forEach((o) => announcedOrderIdsRef.current.add(o.id));
        initialMountRef.current = false;
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Trigger announcement popup, chime & Web Speech API
  const triggerOrderAnnouncement = (order: Order) => {
    setCurrentAnnouncement(order);

    // Speak aloud with voice synthesis and ding chime
    speakOrderReady(order.orderNumber, order.customerName).catch(() => {});

    // Automatically hide announcement after 7 seconds
    setTimeout(() => {
      setCurrentAnnouncement((curr) => (curr?.id === order.id ? null : curr));
    }, 7000);
  };

  const handleEnableAudio = () => {
    unlockAudioContext();
    setIsAudioEnabled(true);
    playDingDong();
  };

  const preparoOrders = orders.filter((o) => o.status === 'preparo');
  const prontoOrders = orders.filter((o) => o.status === 'pronto');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between overflow-y-auto sm:overflow-hidden select-none pb-safe">
      {/* Top Header of TV Panel */}
      <header className="bg-zinc-900/90 border-b border-zinc-800 px-3 sm:px-12 py-2.5 sm:py-4 flex items-center justify-between gap-2 sm:gap-4 shrink-0">
        {/* Brand Lockup */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <button
            onClick={onBackToKiosk}
            title="Voltar ao Totem"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-full bg-zinc-950 border-2 border-amber-500/50 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0 overflow-hidden">
              <img
                src="/images/mare_round_logo_trans.png"
                alt="Maré"
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.src = '/images/mare_round_logo.jpg';
                }}
              />
            </div>
            <div>
              <span className="font-display text-lg sm:text-3xl font-extrabold uppercase tracking-wider text-zinc-100 block leading-tight">
                Maré <span className="text-amber-500">·</span> Hambúrgueria
              </span>
              <span className="text-zinc-500 text-[10px] sm:text-xs font-semibold uppercase tracking-widest block">
                Uma Onda de Sabores · Painel de Chamada
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: Digital Clock and Audio Unlock Button */}
        <div className="flex items-center gap-2.5 sm:gap-6">
          {/* Discreet Audio Activator button (browser policy requirement) */}
          <button
            onClick={handleEnableAudio}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border flex items-center gap-1.5 transition-all shrink-0 ${
              isAudioEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500 text-zinc-950 border-amber-400 animate-pulse font-bold'
            }`}
            title="Clique para habilitar chamadas de áudio e voz na TV"
          >
            {isAudioEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Som Ativado</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Ativar Som 🔊</span>
              </>
            )}
          </button>

          {/* Clock */}
          <div className="text-right shrink-0">
            <span className="font-mono text-base sm:text-2xl font-black text-amber-400 block leading-tight">
              {currentTime}
            </span>
            <span className="text-[10px] sm:text-[11px] text-zinc-400 capitalize hidden sm:block">
              {currentDate}
            </span>
          </div>
        </div>
      </header>

      {/* Main 2 Areas: PREPARANDO (Left) & PRONTO (Right) */}
      <main className="flex-1 p-3 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-stretch overflow-y-auto">
        {/* LEFT AREA: PREPARANDO (40% width) */}
        <section className="lg:col-span-5 bg-zinc-900/60 border-2 border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Flame className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-zinc-200 tracking-wider">
                    Preparando
                  </h2>
                  <span className="text-xs text-zinc-400 font-medium">
                    Na chapa e linha de montagem
                  </span>
                </div>
              </div>
              <span className="font-mono text-xl font-black text-orange-400 px-3 py-1 rounded-xl bg-orange-950/40 border border-orange-800/60">
                {preparoOrders.length}
              </span>
            </div>

            {/* List of Preparing Orders */}
            <div className="mt-6 space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
              {preparoOrders.length === 0 ? (
                <div className="py-20 text-center text-zinc-600">
                  <ChefHat className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">Nenhum pedido em preparo agora</p>
                </div>
              ) : (
                preparoOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-display text-3xl sm:text-4xl font-black text-amber-400 tracking-wider">
                        {order.orderNumber}
                      </span>
                      <span className="font-display text-xl sm:text-2xl font-bold uppercase text-zinc-100 truncate max-w-[200px]">
                        {order.customerName}
                      </span>
                    </div>

                    <span className="text-xs text-zinc-500 font-mono">
                      {order.formattedTime}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-center pt-4 border-t border-zinc-850 text-xs text-zinc-500 font-medium">
            Acompanhe aqui o andamento do seu pedido
          </div>
        </section>

        {/* RIGHT AREA: PRONTO (60% width - BIG HIGHLIGHT) */}
        <section className="lg:col-span-7 bg-zinc-900/80 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          {/* Subtle glow background */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg">
                  <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-emerald-400 tracking-wider">
                    Pronto para Retirada
                  </h2>
                  <span className="text-xs sm:text-sm text-zinc-300 font-semibold">
                    Dirija-se ao balcão com sua comanda
                  </span>
                </div>
              </div>
              <span className="font-mono text-2xl font-black text-emerald-400 px-3.5 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-600">
                {prontoOrders.length}
              </span>
            </div>

            {/* List of Ready Orders in Giant Cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto custom-kiosk-scroll pr-1">
              {prontoOrders.length === 0 ? (
                <div className="col-span-2 py-24 text-center text-zinc-600">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-3 opacity-30 text-emerald-500" />
                  <p className="text-lg font-semibold text-zinc-400">
                    Aguardando próximos pedidos prontos
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Os números chamados aparecerão aqui em destaque
                  </p>
                </div>
              ) : (
                prontoOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-6 rounded-3xl bg-zinc-950 border-2 border-emerald-500/70 shadow-xl flex flex-col justify-between gap-2 transform hover:scale-[1.02] transition-transform animate-in fade-in"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">
                        Retirar no Balcão
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">
                        {order.formattedTime}
                      </span>
                    </div>

                    <div className="font-display text-5xl sm:text-6xl font-black text-amber-400 tracking-widest py-1">
                      {order.orderNumber}
                    </div>

                    <div className="font-display text-2xl font-bold uppercase text-white truncate">
                      {order.customerName}
                    </div>

                    <div className="text-xs text-zinc-400 pt-2 border-t border-zinc-850 flex items-center justify-between">
                      <span>{order.orderType === 'local' ? `Mesa ${order.tableNumber || '01'}` : 'Para Viagem'}</span>
                      <span className="font-semibold text-emerald-400">Pronto</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-center pt-4 border-t border-zinc-850 text-xs sm:text-sm text-zinc-400 font-medium">
            Maré Hambúrgueria · Apresente sua senha ao retirar seu pedido no balcão
          </div>
        </section>
      </main>

      {/* FULLSCREEN POPUP CALL BANNER (WHEN KITCHEN MARKS "PEDIDO PRONTO") */}
      {currentAnnouncement && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-4xl bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 sm:border-4 border-amber-500 rounded-2xl sm:rounded-3xl p-5 sm:p-14 text-center shadow-2xl relative overflow-hidden animate-pulse">
            <div className="inline-flex items-center gap-2 sm:gap-3 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-display font-extrabold text-xs sm:text-lg uppercase tracking-wider mb-2 sm:mb-4">
              <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 stroke-[3]" />
              <span>Chamada de Pedido Pronto</span>
            </div>

            {/* Giant Order Number */}
            <div className="font-display text-6xl sm:text-9xl font-black text-amber-400 tracking-widest my-1 sm:my-2 drop-shadow-2xl">
              {currentAnnouncement.orderNumber}
            </div>

            {/* Exact requested text format */}
            <h1 className="font-display text-2xl sm:text-5xl lg:text-6xl font-black uppercase text-white tracking-wide mt-1 sm:mt-2 leading-tight">
              PEDIDO {currentAnnouncement.orderNumber} – {currentAnnouncement.customerName}, SEU PEDIDO ESTÁ PRONTO!
            </h1>

            <p className="mt-3 sm:mt-6 text-sm sm:text-2xl text-zinc-300 font-semibold max-w-2xl mx-auto">
              Por favor, dirija-se ao balcão de retirada com o seu comprovante.
            </p>

            <div className="mt-5 sm:mt-8">
              <button
                onClick={() => setCurrentAnnouncement(null)}
                className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs sm:text-sm uppercase tracking-wider active:scale-95 transition-all"
              >
                Dispensar Aviso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
