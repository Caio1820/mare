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
  Printer,
  Smartphone,
  Volume2,
  Phone,
  Layers,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { subscribeToOrders, updateOrderStatus, verifyAdminPassword, announceOrder, clearAllOrders } from '../utils/kdsStore';
import { playTouchSound, playKitchenBell, speakOrderReady, unlockAudioContext } from '../utils/sound';
import { ThermalReceipt } from './ThermalReceipt';
import { StaffGuideModal } from './StaffGuideModal';

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
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [now, setNow] = useState<number>(Date.now());
  const [mobileTab, setMobileTab] = useState<'recebido' | 'preparo' | 'pronto'>('recebido');
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [lastAnnouncedId, setLastAnnouncedId] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Real-time time updater for elapsed minute calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Listen to orders from KdsStore
  useEffect(() => {
    const unsubscribe = subscribeToOrders((newOrders) => {
      setOrders(newOrders);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Submit Password
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setLoginError('Digite a senha de administrador.');
      return;
    }

    setIsVerifying(true);
    setLoginError('');

    try {
      const isValid = await verifyAdminPassword(passwordInput);
      if (isValid) {
        unlockAudioContext();
        sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
        setIsAuthenticated(true);
        setPasswordInput('');
        setLoginError('');
      } else {
        setLoginError('Senha incorreta. Acesso não permitido.');
      }
    } catch {
      setLoginError('Erro ao validar senha. Tente novamente.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Logout
  const handleLogout = () => {
    playTouchSound(450);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
  };

  // Change Order Status
  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    playTouchSound(600);
    if (nextStatus === 'pronto') {
      playKitchenBell();
      const target = orders.find((o) => o.id === orderId);
      if (target) {
        speakOrderReady(target.orderNumber, target.customerName).catch(() => {});
      }
    }
    await updateOrderStatus(orderId, nextStatus);
  };

  // Re-call customer (Ding-dong on TV + Speech synthesis + WhatsApp trigger)
  const handleCallCustomer = (order: Order) => {
    playKitchenBell();
    announceOrder(order.id);
    speakOrderReady(order.orderNumber, order.customerName).catch(() => {});
    setLastAnnouncedId(order.id);
    setTimeout(() => setLastAnnouncedId(null), 4000);
  };

  // 1. LOGIN SCREEN (Unauthenticated)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-4 sm:p-8">
        <div className="flex items-center justify-between max-w-md mx-auto w-full pt-2">
          <button
            onClick={() => {
              playTouchSound(480);
              onBackToKiosk();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Totem</span>
          </button>

          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
            Acesso Restrito
          </span>
        </div>

        {/* Login Box */}
        <div className="my-auto max-w-md mx-auto w-full bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-5 p-0.5 bg-zinc-950 rounded-full border-2 border-amber-500/40 overflow-hidden shadow-xl flex items-center justify-center">
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
          <div className="relative w-10 h-10 rounded-full border-2 border-amber-500/50 p-0.5 bg-zinc-950 overflow-hidden shadow-md flex items-center justify-center shrink-0">
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
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wider text-zinc-100">
                Linha de Produção & Recepção
              </h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                Ao Vivo
              </span>
            </div>
            <span className="text-xs text-zinc-400 font-medium">
              Maré Hambúrgueria · Chamada de Senhas & Impressão Térmica
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* GUIA DA EQUIPE */}
          <button
            onClick={() => {
              playTouchSound(550);
              setIsGuideOpen(true);
            }}
            className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95"
            title="Abrir Manual de Treinamento da Equipe"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Guia Equipe</span>
          </button>

          {/* LIMPAR FILA */}
          <button
            onClick={() => {
              playTouchSound(450);
              if (window.confirm('Deseja limpar todos os pedidos finalizados/entregues da fila da cozinha?')) {
                clearAllOrders(false);
              }
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700 flex items-center gap-1.5 text-xs font-semibold"
            title="Limpar pedidos antigos"
          >
            <Layers className="w-4 h-4 text-zinc-400" />
            <span className="hidden md:inline">Limpar Fila</span>
          </button>

          <button
            onClick={() => {
              playKitchenBell();
            }}
            title="Testar alarme sonoro"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 flex items-center gap-1.5 text-xs font-semibold"
          >
            <Bell className="w-4 h-4" />
            <span className="hidden md:inline">Testar Som</span>
          </button>

          <button
            onClick={() => {
              playTouchSound(500);
              onBackToKiosk();
            }}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-semibold text-xs border border-zinc-700 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Totem</span>
          </button>

          {/* REQUIRED PROMINENT SAIR BUTTON */}
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-200 border border-red-800 font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all"
            title="Encerrar sessão de administrador"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Mobile Column Tab Switcher */}
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

      {/* Main Production Columns */}
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
                  1. Recebido (Novo Pedido)
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
                    onPrint={() => setPrintingOrder(order)}
                    onCallCustomer={() => handleCallCustomer(order)}
                    isAnnouncedRecently={lastAnnouncedId === order.id}
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
                  2. Em Preparo (Chapa)
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
                    onPrint={() => setPrintingOrder(order)}
                    onCallCustomer={() => handleCallCustomer(order)}
                    isAnnouncedRecently={lastAnnouncedId === order.id}
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
                  3. Pronto na Recepção
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
                    onPrint={() => setPrintingOrder(order)}
                    onCallCustomer={() => handleCallCustomer(order)}
                    isAnnouncedRecently={lastAnnouncedId === order.id}
                    actionButton={
                      <div className="space-y-2 w-full">
                        {/* Prominent Call Button */}
                        <button
                          onClick={() => handleCallCustomer(order)}
                          className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-amber-500/20"
                        >
                          <Bell className="w-4 h-4" />
                          <span>Chamar Novamente (TV + Voz)</span>
                        </button>

                        <button
                          onClick={() => handleStatusChange(order.id, 'entregue')}
                          className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all border border-zinc-700"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Entregue (Remover da Linha)</span>
                        </button>
                      </div>
                    }
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Thermal Receipt Print Modal */}
      {printingOrder && (
        <ThermalReceipt
          order={printingOrder}
          onClose={() => setPrintingOrder(null)}
        />
      )}

      {/* Staff Guide Modal */}
      <StaffGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        defaultTab="cozinha"
      />
    </div>
  );
};

// Subcomponent for individual order card on the kitchen board
interface OrderKitchenCardProps {
  order: Order;
  now: number;
  actionButton: React.ReactNode;
  onPrint: () => void;
  onCallCustomer: () => void;
  isHighlighted?: boolean;
  isReady?: boolean;
  isAnnouncedRecently?: boolean;
}

const OrderKitchenCard: React.FC<OrderKitchenCardProps> = ({
  order,
  now,
  actionButton,
  onPrint,
  onCallCustomer,
  isHighlighted,
  isReady,
  isAnnouncedRecently,
}) => {
  const elapsedMinutes = Math.floor((now - order.createdAt) / 60000);
  const isUrgent = elapsedMinutes >= 12 && !isReady;

  const cleanPhone = (order.customerPhone || '').replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/55${cleanPhone || '96999999999'}?text=${encodeURIComponent(
    `Olá ${order.customerName}! Seu pedido ${order.orderNumber} está pronto e te esperando na recepção da Maré Hambúrgueria! 🍔 Venha retirar no balcão.`
  )}`;

  return (
    <div
      className={`bg-zinc-950 border-2 rounded-2xl p-4 shadow-xl flex flex-col justify-between gap-3.5 transition-all ${
        isAnnouncedRecently
          ? 'border-amber-400 ring-4 ring-amber-500/30 scale-[1.01]'
          : isReady
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
              : 'Para Viagem (Balcão)'}
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

          {/* Quick print button on top-right */}
          <button
            onClick={onPrint}
            title="Imprimir comanda térmica"
            className="mt-1.5 p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 border border-zinc-800 transition-colors inline-flex items-center gap-1 text-[10px] font-mono"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Comanda</span>
          </button>
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

            {/* 3D Custom Burger Layers Breakdown */}
            {item.burger3DConfig && (
              <div className="pl-7 mt-1.5 p-2 rounded-lg bg-amber-950/20 border border-amber-500/30 text-[11px] space-y-1">
                <div className="flex items-center gap-1 font-bold text-amber-400">
                  <Layers className="w-3 h-3" />
                  <span>Montado no 3D:</span>
                </div>
                <div className="text-zinc-300">• Pão: {item.burger3DConfig.bunLabel}</div>
                <div className="text-amber-300 font-semibold">
                  • {item.burger3DConfig.pattiesCount}x Carne ({item.burger3DConfig.meatDoneness})
                </div>
                <div className="text-zinc-300">• Queijo: {item.burger3DConfig.cheeseLabel}</div>
                {item.burger3DConfig.selectedAddons.bacon && (
                  <div className="text-emerald-400 font-semibold">• + Bacon Crocante</div>
                )}
                {item.burger3DConfig.selectedAddons.cebola_caram && (
                  <div className="text-amber-400">• + Cebola Caramelizada</div>
                )}
                {item.burger3DConfig.selectedAddons.picles && (
                  <div className="text-emerald-400">• + Picles Artesanal</div>
                )}
                {item.burger3DConfig.selectedAddons.salada_mare && (
                  <div className="text-emerald-400">• + Salada Maré</div>
                )}
                <div className="text-zinc-300">• Molho: {item.burger3DConfig.sauceLabel}</div>
              </div>
            )}

            {/* Standard Customization Details */}
            {!item.burger3DConfig && item.customization && (
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

      {/* General Order Observations */}
      {order.observations && (
        <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-[10px] uppercase tracking-wider text-amber-400">
              Observação do Cliente:
            </strong>
            <p className="font-semibold text-zinc-100">{order.observations}</p>
          </div>
        </div>
      )}

      {/* Bottom Communication Tools: Print Ticket, WhatsApp link & Stage Action Button */}
      <div className="space-y-2 pt-2 border-t border-zinc-850">
        {/* Dedicated Kitchen Staff Print Button */}
        <button
          onClick={() => {
            playTouchSound(550);
            onPrint();
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 border border-zinc-700 hover:border-amber-500/50 text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
          title="Imprimir comanda térmica do pedido (80mm)"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span>Imprimir Comanda (80mm)</span>
        </button>

        {isReady && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-600/50 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Notificar Cliente via WhatsApp 📲</span>
          </a>
        )}

        {actionButton}
      </div>
    </div>
  );
};
