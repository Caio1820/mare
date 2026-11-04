import React, { useEffect, useState } from 'react';
import { ChefHat, Clock, CheckCircle2, Flame, Bell, Trash2, ArrowLeft, RefreshCw } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { getStoredOrders, updateOrderStatus, clearFinishedOrders } from '../utils/kdsStore';
import { playTouchSound, playKitchenBell } from '../utils/sound';

interface KdsViewProps {
  onBackToKiosk: () => void;
}

export const KdsView: React.FC<KdsViewProps> = ({ onBackToKiosk }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'todos'>('todos');
  const [now, setNow] = useState<number>(Date.now());

  // Load orders and listen to real-time events
  useEffect(() => {
    setOrders(getStoredOrders());

    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<Order[]>;
      if (custom.detail) {
        setOrders(custom.detail);
      } else {
        setOrders(getStoredOrders());
      }
    };

    window.addEventListener('mare_kds_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    const clockTimer = setInterval(() => {
      setNow(Date.now());
    }, 15000);

    return () => {
      window.removeEventListener('mare_kds_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(clockTimer);
    };
  }, []);

  const handleAdvanceStatus = (orderId: string, currentStatus: OrderStatus) => {
    playTouchSound(620);
    let next: OrderStatus = 'preparo';
    if (currentStatus === 'recebido') next = 'preparo';
    else if (currentStatus === 'preparo') next = 'pronto';
    else if (currentStatus === 'pronto') next = 'entregue';
    else return;

    updateOrderStatus(orderId, next);
    setOrders(getStoredOrders());
  };

  const handleClearCompleted = () => {
    playTouchSound(420);
    clearFinishedOrders();
    setOrders(getStoredOrders());
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'todos') return o.status !== 'entregue';
    return o.status === filterStatus;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'recebido':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase">
            Novo Pedido
          </span>
        );
      case 'preparo':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold uppercase flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" /> Na Chapa
          </span>
        );
      case 'pronto':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Pronto
          </span>
        );
      case 'entregue':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-semibold uppercase">
            Entregue
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* KDS Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              playTouchSound(500);
              onBackToKiosk();
            }}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold text-xs flex items-center gap-2 border border-zinc-700"
          >
            <ArrowLeft className="w-4 h-4 text-amber-500" />
            <span>Voltar ao Totem</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-zinc-950 font-black shadow-lg">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold uppercase tracking-wider text-zinc-100">
                KDS · Cozinha & Linha de Produção
              </h1>
              <span className="text-xs text-zinc-400 font-medium">
                Sincronização em tempo real · Maré Hambúrgueria
              </span>
            </div>
          </div>
        </div>

        {/* Filter Controls & Audio Test */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {(['todos', 'recebido', 'preparo', 'pronto', 'entregue'] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  playTouchSound(520);
                  setFilterStatus(st);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filterStatus === st
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {st === 'todos' ? 'Ativos' : st}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              playKitchenBell();
            }}
            title="Testar alarme sonoro de novo pedido"
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700"
          >
            <Bell className="w-4 h-4" />
          </button>

          <button
            onClick={handleClearCompleted}
            title="Limpar pedidos entregues"
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 border border-zinc-700"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        {filteredOrders.length === 0 ? (
          <div className="py-24 text-center text-zinc-500">
            <ChefHat className="w-16 h-16 mx-auto mb-3 opacity-40" />
            <h3 className="font-display text-2xl uppercase font-bold text-zinc-300">
              Nenhum pedido na fila no momento
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Finalize um pedido no totem para vê-lo chegar automaticamente aqui!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
            {filteredOrders.map((order) => {
              const minutesElapsed = Math.floor((now - order.createdAt) / 60000);
              const isUrgent = minutesElapsed >= 12 && order.status !== 'pronto';

              return (
                <div
                  key={order.id}
                  className={`bg-zinc-900 border rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between transition-all ${
                    isUrgent
                      ? 'border-red-500/80 shadow-red-500/10'
                      : order.status === 'pronto'
                      ? 'border-emerald-500/60'
                      : 'border-zinc-800'
                  }`}
                >
                  {/* Ticket Header */}
                  <div
                    className={`p-4 flex items-center justify-between border-b ${
                      isUrgent
                        ? 'bg-red-950/30 border-red-900/50'
                        : order.status === 'pronto'
                        ? 'bg-emerald-950/20 border-emerald-900/40'
                        : 'bg-zinc-950/60 border-zinc-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-3xl font-black text-amber-400 tracking-wider">
                          {order.orderNumber}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <span className="text-xs font-semibold text-zinc-300 mt-0.5 block">
                        {order.orderType === 'local'
                          ? `Mesa ${order.tableNumber || '01'} · Salão`
                          : 'Embalagem p/ Viagem'}
                      </span>
                    </div>

                    <div className="text-right">
                      <div
                        className={`flex items-center gap-1 text-xs font-bold ${
                          isUrgent ? 'text-red-400 animate-pulse' : 'text-zinc-400'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{minutesElapsed} min</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block mt-0.5">
                        {order.paymentStatus === 'pago' ? 'Pago' : 'Pagar Balcão'}
                      </span>
                    </div>
                  </div>

                  {/* Ticket Items List */}
                  <div className="p-4 space-y-3 flex-1">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80 space-y-1.5"
                      >
                        <div className="flex items-start justify-between font-bold text-sm text-zinc-100">
                          <span className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-amber-500 text-zinc-950 flex items-center justify-center font-black text-xs shrink-0">
                              {item.quantity}
                            </span>
                            <span>{item.product.name}</span>
                          </span>
                        </div>

                        {/* Customization Details for Cook */}
                        {item.customization && (
                          <div className="pl-8 text-xs space-y-0.5">
                            {item.product.isBurger && (
                              <div className="text-amber-400 font-semibold">
                                Carne: {item.customization.meatDoneness}
                              </div>
                            )}

                            {item.customization.removedIngredients.length > 0 && (
                              <div className="text-red-400 font-bold bg-red-950/30 px-2 py-0.5 rounded">
                                RETIRAR: {item.customization.removedIngredients.join(', ')}
                              </div>
                            )}

                            {Object.keys(item.customization.selectedAddons).length > 0 && (
                              <div className="text-emerald-400 font-semibold bg-emerald-950/30 px-2 py-0.5 rounded">
                                EXTRAS:{' '}
                                {Object.entries(item.customization.selectedAddons)
                                  .map(([k, v]) => `${v}x ${k.replace('_', ' ')}`)
                                  .join(', ')}
                              </div>
                            )}

                            {item.customization.specialNotes && (
                              <div className="text-zinc-300 italic bg-zinc-900 px-2 py-1 rounded">
                                Obs: {item.customization.specialNotes}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Ticket Action Button (Bump Ticket) */}
                  <div className="p-4 bg-zinc-950/80 border-t border-zinc-800">
                    {order.status === 'recebido' && (
                      <button
                        onClick={() => handleAdvanceStatus(order.id, 'recebido')}
                        className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-display font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow"
                      >
                        <Flame className="w-4 h-4" />
                        <span>Iniciar Preparo na Chapa</span>
                      </button>
                    )}

                    {order.status === 'preparo' && (
                      <button
                        onClick={() => handleAdvanceStatus(order.id, 'preparo')}
                        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Marcar como Pronto (Chamar Senha)</span>
                      </button>
                    )}

                    {order.status === 'pronto' && (
                      <button
                        onClick={() => handleAdvanceStatus(order.id, 'pronto')}
                        className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-display font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Entregue ao Cliente</span>
                      </button>
                    )}

                    {order.status === 'entregue' && (
                      <div className="py-2 text-center text-xs text-zinc-500 font-semibold">
                        Pedido Finalizado e Entregue
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
