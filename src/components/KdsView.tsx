import React, { useEffect, useState } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Flame,
  Bell,
  Lock,
  LogOut,
  ArrowLeft,
  AlertCircle,
  User,
  MessageSquare,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { subscribeToOrders, updateOrderStatus, verifyAdminPassword } from '../utils/kdsStore';
import { playTouchSound, playKitchenBell } from '../utils/sound';

interface KdsViewProps {
  onBackToKiosk: () => void;
}

const AUTH_STORAGE_KEY = 'mare_kitchen_auth_session';

export const KdsView: React.FC<KdsViewProps> = ({ onBackToKiosk }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true';
  });

  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [now, setNow] = useState<number>(Date.now());
  const [mobileTab, setMobileTab] = useState<'recebido' | 'preparo' | 'pronto'>('recebido');

  // Listen for real-time orders when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = subscribeToOrders((newOrders) => {
      setOrders(newOrders);
    });

    const clockTimer = setInterval(() => {
      setNow(Date.now());
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(clockTimer);
    };
  }, [isAuthenticated]);

  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = passwordInput.trim();
    if (!clean) {
      setLoginError('Digite a senha de administrador.');
      return;
    }

    setIsVerifying(true);
    setLoginError('');

    try {
      const isValid = await verifyAdminPassword(clean);
      if (isValid) {
        playKitchenBell();
        sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
        setIsAuthenticated(true);
        setPasswordInput('');
      } else {
        playTouchSound(380);
        setLoginError('Senha incorreta');
      }
    } catch {
      setLoginError('Erro ao verificar senha.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    playTouchSound(420);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
    setPasswordInput('');
    setLoginError('');
  };

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    playTouchSound(600);
    await updateOrderStatus(orderId, nextStatus);
  };

  // 1. LOGIN SCREEN (If not authenticated)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-between p-6">
        {/* Top Back Nav */}
        <div className="flex items-center justify-between max-w-md mx-auto w-full pt-4">
          <button
            onClick={() => {
              playTouchSound(500);
              onBackToKiosk();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold text-xs hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-amber-500" />
            <span>Voltar ao Totem</span>
          </button>
          <span className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
            Área Restrita
          </span>
        </div>

        {/* Login Box */}
        <div className="my-auto max-w-md mx-auto w-full bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 mb-6">
            <Lock className="w-8 h-8" />
          </div>

          <div className="text-center mb-6">
            <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase text-zinc-100">
              Cozinha & KDS Maré
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1.5">
              Digite a senha de administrador para acessar a linha de produção
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs uppercase font-bold text-zinc-400 block mb-1.5">
                Senha de Administrador:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  placeholder="Digite a senha..."
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  className={`w-full bg-zinc-950 border rounded-2xl pl-4 pr-12 py-3.5 text-lg text-zinc-100 placeholder-zinc-600 focus:outline-none transition-all font-mono tracking-widest ${
                    loginError
                      ? 'border-red-500 ring-2 ring-red-500/20'
                      : 'border-zinc-700 focus:border-amber-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {loginError && (
                <div className="mt-2 text-xs text-red-400 flex items-center gap-1.5 font-bold animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-display font-extrabold text-base uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[52px]"
            >
              {isVerifying ? (
                <span>Verificando...</span>
              ) : (
                <>
                  <ChefHat className="w-5 h-5" />
                  <span>Acessar Cozinha</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-zinc-800 text-center text-[11px] text-zinc-500">
            Acesso exclusivo para chapeiros e equipe de cozinha.
          </div>
        </div>

        <div className="text-center text-xs text-zinc-600 pb-2">
          Maré Hambúrgueria · Sistema de Ponto de Venda Kiosk & KDS
        </div>
      </div>
    );
  }

  // 2. KITCHEN INTERFACE (Authenticated)
  const recebidos = orders.filter((o) => o.status === 'recebido');
  const preparo = orders.filter((o) => o.status === 'preparo');
  const pronto = orders.filter((o) => o.status === 'pronto');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header with prominent SAIR button */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-zinc-950 shadow-md">
            <ChefHat className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wider text-zinc-100">
                Linha de Produção & Cozinha
              </h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                Ao Vivo
              </span>
            </div>
            <span className="text-xs text-zinc-400 font-medium">
              Maré Hambúrgueria · Sincronização em Tempo Real
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              playKitchenBell();
            }}
            title="Testar alarme sonoro"
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 flex items-center gap-1.5 text-xs font-semibold"
          >
            <Bell className="w-4 h-4" />
            <span className="hidden md:inline">Testar Som</span>
          </button>

          <button
            onClick={() => {
              playTouchSound(500);
              onBackToKiosk();
            }}
            className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-semibold text-xs border border-zinc-700 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Totem</span>
          </button>

          {/* REQUIRED PROMINENT SAIR BUTTON */}
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-200 border border-red-800 font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all"
            title="Encerrar sessão de administrador"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Mobile Column Tab Switcher (visible only on small screens) */}
      <div className="md:hidden bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 p-2 flex items-center gap-1.5 sticky top-[60px] z-10">
        <button
          onClick={() => {
            playTouchSound(520);
            setMobileTab('recebido');
          }}
          className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[42px] ${
            mobileTab === 'recebido'
              ? 'bg-amber-500 text-zinc-950 shadow-md'
              : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          <span>1. Recebido</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/25 text-[10px] font-mono">
            {recebidos.length}
          </span>
        </button>

        <button
          onClick={() => {
            playTouchSound(520);
            setMobileTab('preparo');
          }}
          className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[42px] ${
            mobileTab === 'preparo'
              ? 'bg-orange-500 text-zinc-950 shadow-md'
              : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          <span>2. Preparo</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/25 text-[10px] font-mono">
            {preparo.length}
          </span>
        </button>

        <button
          onClick={() => {
            playTouchSound(520);
            setMobileTab('pronto');
          }}
          className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[42px] ${
            mobileTab === 'pronto'
              ? 'bg-emerald-500 text-zinc-950 shadow-md'
              : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          <span>3. Pronto</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/25 text-[10px] font-mono">
            {pronto.length}
          </span>
        </button>
      </div>

      {/* Main Production Columns (Tabs on Mobile, 3-column Grid on Desktop) */}
      <div className="flex-1 p-3 sm:p-6 pb-safe">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-start">
          {/* COLUMN 1: RECEBIDO */}
          <div
            className={`bg-zinc-900/70 border border-zinc-800 rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 ${
              mobileTab === 'recebido' ? 'flex' : 'hidden md:flex'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="font-display text-base sm:text-lg font-bold uppercase tracking-wide text-zinc-100">
                  1. Recebido
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold font-mono">
                {recebidos.length}
              </span>
            </div>

            {/* List */}
            <div className="space-y-3 sm:space-y-4">
              {recebidos.length === 0 ? (
                <div className="py-12 text-center text-zinc-600 text-xs">
                  Nenhum pedido aguardando início
                </div>
              ) : (
                recebidos.map((order) => (
                  <OrderKitchenCard
                    key={order.id}
                    order={order}
                    now={now}
                    actionButton={
                      <button
                        onClick={() => handleStatusChange(order.id, 'preparo')}
                        className="w-full py-3 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-amber-500/10 min-h-[44px] sm:min-h-[48px]"
                      >
                        <Flame className="w-4 h-4 fill-current" />
                        <span>Iniciar Preparo</span>
                      </button>
                    }
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMN 2: EM PREPARO */}
          <div
            className={`bg-zinc-900/70 border border-zinc-800 rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 ${
              mobileTab === 'preparo' ? 'flex' : 'hidden md:flex'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500 animate-bounce" />
                <h3 className="font-display text-base sm:text-lg font-bold uppercase tracking-wide text-zinc-100">
                  2. Em Preparo
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold font-mono">
                {preparo.length}
              </span>
            </div>

            {/* List */}
            <div className="space-y-3 sm:space-y-4">
              {preparo.length === 0 ? (
                <div className="py-12 text-center text-zinc-600 text-xs">
                  Nenhum pedido na chapa no momento
                </div>
              ) : (
                preparo.map((order) => (
                  <OrderKitchenCard
                    key={order.id}
                    order={order}
                    now={now}
                    isHighlighted
                    actionButton={
                      <button
                        onClick={() => handleStatusChange(order.id, 'pronto')}
                        className="w-full py-3 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-emerald-500/10 min-h-[44px] sm:min-h-[48px]"
                      >
                        <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                        <span>Pedido Pronto</span>
                      </button>
                    }
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMN 3: PRONTO */}
          <div
            className={`bg-zinc-900/70 border border-zinc-800 rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 ${
              mobileTab === 'pronto' ? 'flex' : 'hidden md:flex'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-display text-base sm:text-lg font-bold uppercase tracking-wide text-zinc-100">
                  3. Pronto (Na TV)
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono">
                {pronto.length}
              </span>
            </div>

            {/* List */}
            <div className="space-y-3 sm:space-y-4">
              {pronto.length === 0 ? (
                <div className="py-12 text-center text-zinc-600 text-xs">
                  Nenhum pedido aguardando retirada
                </div>
              ) : (
                pronto.map((order) => (
                  <OrderKitchenCard
                    key={order.id}
                    order={order}
                    now={now}
                    isReady
                    actionButton={
                      <button
                        onClick={() => handleStatusChange(order.id, 'entregue')}
                        className="w-full py-3 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-display font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all min-h-[44px] sm:min-h-[48px] border border-zinc-700"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Entregue (Remover)</span>
                      </button>
                    }
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Subcomponent for individual order card on the kitchen board
interface OrderKitchenCardProps {
  order: Order;
  now: number;
  actionButton: React.ReactNode;
  isHighlighted?: boolean;
  isReady?: boolean;
}

const OrderKitchenCard: React.FC<OrderKitchenCardProps> = ({
  order,
  now,
  actionButton,
  isHighlighted,
  isReady,
}) => {
  const elapsedMinutes = Math.floor((now - order.createdAt) / 60000);
  const isUrgent = elapsedMinutes >= 12 && !isReady;

  return (
    <div
      className={`bg-zinc-950 border-2 rounded-2xl p-4 shadow-xl flex flex-col justify-between gap-3.5 transition-all ${
        isReady
          ? 'border-emerald-500/60 shadow-emerald-500/5'
          : isUrgent
          ? 'border-red-500 shadow-red-500/10'
          : isHighlighted
          ? 'border-orange-500/70 shadow-orange-500/5'
          : 'border-zinc-800'
      }`}
    >
      {/* Top Card Header: Order Number, Customer Name & Time */}
      <div className="flex items-start justify-between gap-2 border-b border-zinc-850 pb-2.5">
        <div>
          <span className="font-display text-3xl font-black text-amber-400 tracking-wider block">
            {order.orderNumber}
          </span>
          <div className="flex items-center gap-1.5 text-zinc-100 font-bold text-base mt-0.5">
            <User className="w-4 h-4 text-zinc-400 shrink-0" />
            <span className="truncate">{order.customerName}</span>
          </div>
          <span className="text-[11px] text-zinc-400 block font-medium">
            {order.orderType === 'local'
              ? `Mesa ${order.tableNumber || '01'} · Salão`
              : 'Para Viagem'}
          </span>
        </div>

        <div className="text-right shrink-0">
          <div
            className={`flex items-center justify-end gap-1 text-xs font-bold ${
              isUrgent ? 'text-red-400 animate-pulse' : 'text-zinc-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>há {elapsedMinutes} min</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
            {order.formattedTime || ''}
          </span>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2 text-xs">
        {order.items.map((item, idx) => (
          <div key={idx} className="bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800">
            <div className="flex items-start justify-between font-bold text-sm text-zinc-100">
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-amber-500 text-zinc-950 flex items-center justify-center font-black text-xs shrink-0">
                  {item.quantity}
                </span>
                <span>{item.product.name}</span>
              </span>
            </div>

            {/* Customization Details for Cook */}
            {item.customization && (
              <div className="pl-7 mt-1 space-y-0.5 text-[11px]">
                {item.product.isBurger && (
                  <div className="text-amber-400 font-bold">
                    Ponto: {item.customization.meatDoneness}
                  </div>
                )}

                {item.customization.removedIngredients.length > 0 && (
                  <div className="text-red-400 font-bold bg-red-950/40 px-1.5 py-0.5 rounded inline-block">
                    SEM: {item.customization.removedIngredients.join(', ')}
                  </div>
                )}

                {Object.keys(item.customization.selectedAddons).length > 0 && (
                  <div className="text-emerald-400 font-semibold">
                    + Extras:{' '}
                    {Object.entries(item.customization.selectedAddons)
                      .map(([k, v]) => `${v}x ${k.replace('_', ' ')}`)
                      .join(', ')}
                  </div>
                )}

                {item.customization.specialNotes && (
                  <div className="text-zinc-300 italic">
                    Obs: "{item.customization.specialNotes}"
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* General Order Observations (in prominent alert box) */}
      {order.observations && (
        <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-[10px] uppercase tracking-wider text-amber-400">
              Observação Geral:
            </strong>
            <span>{order.observations}</span>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="pt-1">{actionButton}</div>
    </div>
  );
};
