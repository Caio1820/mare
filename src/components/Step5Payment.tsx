import React, { useState } from 'react';
import {
  ArrowLeft,
  QrCode,
  CreditCard,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Clock,
  AlertCircle,
  User,
  MessageSquare,
  Phone,
} from 'lucide-react';
import { CartItem, OrderType, PaymentMethod } from '../types';
import { playTouchSound, playSuccessChime } from '../utils/sound';

interface Step5PaymentProps {
  orderType: OrderType;
  tableNumber?: string;
  items: CartItem[];
  cartTotal: number;
  onBack: () => void;
  onConfirmPayment: (
    method: PaymentMethod,
    isPaidImmediately: boolean,
    customerName: string,
    observations: string,
    customerPhone?: string
  ) => void;
  onChangeOrderType?: () => void;
}

export const Step5Payment: React.FC<Step5PaymentProps> = ({
  orderType,
  tableNumber,
  items,
  cartTotal,
  onBack,
  onConfirmPayment,
  onChangeOrderType,
}) => {
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [observations, setObservations] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('pix');
  const [pixCopied, setPixCopied] = useState(false);
  const [isSimulatingPix, setIsSimulatingPix] = useState(false);

  const mockPixPayload = `00020126580014BR.GOV.BCB.PIX0136marehamburgueria@kiosk.com.br520400005303986540${cartTotal.toFixed(2)}5802BR5925MARE HAMBURGUERIA LTDA6009SAO PAULO62070503***6304E8A2`;

  const validateName = (): boolean => {
    if (!customerName || !customerName.trim()) {
      setNameError('Por favor, informe seu nome para que possamos chamá-lo no painel de TV.');
      playTouchSound(380);
      return false;
    }
    setNameError('');
    return true;
  };

  const handleCopyPix = () => {
    playTouchSound(550);
    navigator.clipboard?.writeText(mockPixPayload);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  const handleSimulatePixSuccess = () => {
    if (!validateName()) return;
    setIsSimulatingPix(true);
    playTouchSound(600);
    setTimeout(() => {
      playSuccessChime();
      onConfirmPayment('pix', true, customerName.trim(), observations.trim(), customerPhone.trim() || undefined);
    }, 1100);
  };

  const handleConfirmCounterPayment = () => {
    if (!validateName()) return;
    playSuccessChime();
    onConfirmPayment(selectedMethod, false, customerName.trim(), observations.trim(), customerPhone.trim() || undefined);
  };

  const quickObservationTags = [
    'Sem cebola',
    'Sem picles',
    'Sem molho',
    'Talher descartável',
    'Caprichar no guardanapo',
    'Maionese à parte',
  ];

  return (
    <div className="min-h-[calc(100dvh-54px)] sm:min-h-[calc(100vh-65px)] bg-zinc-950 p-3 sm:p-6 md:p-8 max-w-6xl mx-auto w-full flex flex-col justify-between pb-safe overflow-y-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-zinc-800/80">
        <button
          onClick={() => {
            playTouchSound(480);
            onBack();
          }}
          className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold text-xs sm:text-sm hover:bg-zinc-800 hover:text-white active:scale-95 transition-all min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
          <span>Voltar ao Cardápio</span>
        </button>

        <div className="text-zinc-500 text-[10px] sm:text-xs font-semibold uppercase tracking-widest">
          Etapa 3 de 4 · Pagamento
        </div>
      </div>

      {/* Main Grid: Left = Identification & Summary, Right = Payment Methods */}
      <div className="my-4 sm:my-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
        {/* Left Column (5 cols): Customer Identification & Order Summary */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6">
          {/* Customer Name Input (MANDATORY REQUIREMENT) */}
          <div className="bg-zinc-900/90 border-2 border-amber-500/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold uppercase text-zinc-100">
                  Identificação do Cliente <span className="text-amber-400">*</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-zinc-400">
                  Seu nome aparecerá na tela do Painel de TV
                </p>
              </div>
            </div>

            <div>
              <label className="text-[11px] sm:text-xs uppercase font-bold text-zinc-400 block mb-1">
                Digite seu Nome Completo ou Primeiro Nome:
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (nameError) setNameError('');
                }}
                placeholder="Ex: João Silva"
                className={`w-full bg-zinc-950 border rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-3 sm:py-3.5 text-base text-zinc-100 placeholder-zinc-600 focus:outline-none transition-all font-semibold ${
                  nameError
                    ? 'border-red-500 ring-2 ring-red-500/20'
                    : 'border-zinc-700 focus:border-amber-400'
                }`}
              />
              {nameError && (
                <div className="mt-2 text-xs text-red-400 flex items-center gap-1.5 font-medium animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{nameError}</span>
                </div>
              )}
            </div>

            {/* Optional WhatsApp Phone for notifications */}
            <div>
              <label className="text-[11px] sm:text-xs uppercase font-bold text-zinc-400 block mb-1">
                WhatsApp / Celular (Opcional - para avisar quando pronto):
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ex: (96) 99123-4567"
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-400 rounded-xl sm:rounded-2xl pl-10 pr-3.5 py-2.5 sm:py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-all font-mono"
                />
              </div>
            </div>

            {/* Quick Observations input */}
            <div className="pt-2 border-t border-zinc-800">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 mb-2">
                <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                <span>Observações do Pedido (Opcional):</span>
              </div>
              <input
                type="text"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Ex: Sem cebola, talher descartável..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-400"
              />

              {/* Quick tags */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {quickObservationTags.map((tag) => {
                  const active = observations.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        playTouchSound(520);
                        setObservations((prev) =>
                          active
                            ? prev.replace(tag, '').replace(/,\s*,/g, ',').trim()
                            : prev
                            ? `${prev}, ${tag}`
                            : tag
                        );
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        active
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      + {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Summary Card */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-[11px] uppercase font-bold text-amber-400 tracking-wider block">
                  Resumo do Pedido
                </span>
                <h3 className="font-display text-xl font-bold uppercase text-zinc-100">
                  {orderType === 'local'
                    ? `Mesa ${tableNumber || '01'} · Salão`
                    : 'Embalagem para Viagem'}
                </h3>
                {onChangeOrderType && (
                  <button
                    type="button"
                    onClick={() => {
                      playTouchSound(520);
                      onChangeOrderType();
                    }}
                    className="mt-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1 active:scale-95"
                  >
                    <span>Alterar para {orderType === 'local' ? 'Para Viagem' : 'Comer no Local'}</span>
                    <span>↺</span>
                  </button>
                )}
              </div>
              <div className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold">
                {items.reduce((acc, i) => acc + i.quantity, 0)} itens
              </div>
            </div>

            {/* List of items */}
            <div className="max-h-56 overflow-y-auto custom-kiosk-scroll space-y-2.5 pr-1">
              {items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex items-start justify-between text-xs sm:text-sm pb-2 border-b border-zinc-800/60"
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
                      <span className="text-amber-400 font-bold">{item.quantity}x</span>
                      <span>{item.product.name}</span>
                    </div>
                    {item.customization && (
                      <div className="text-[11px] text-zinc-400 mt-0.5 space-y-0.5">
                        {item.product.isBurger && <div>Ponto: {item.customization.meatDoneness}</div>}
                        {item.customization.removedIngredients.length > 0 && (
                          <div className="text-red-400">
                            Sem: {item.customization.removedIngredients.join(', ')}
                          </div>
                        )}
                        {Object.keys(item.customization.selectedAddons).length > 0 && (
                          <div className="text-amber-400/90">
                            +{Object.keys(item.customization.selectedAddons).length} adicional(is)
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <span className="font-mono font-bold text-zinc-200 shrink-0">
                    R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-zinc-100">
              <span className="font-display text-xl uppercase font-bold">Total</span>
              <span className="font-mono text-3xl font-black text-amber-400 tabular-nums">
                R$ {cartTotal.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Payment Method Selector */}
        <div className="lg:col-span-7 bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div>
            <span className="text-xs uppercase font-bold text-amber-400 tracking-wider block">
              Forma de Pagamento
            </span>
            <h3 className="font-display text-3xl font-bold uppercase text-zinc-100 mt-1">
              Como deseja pagar?
            </h3>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1">
              Selecione o método para emitir seu número de pedido e enviar para a chapa
            </p>
          </div>

          {/* 3 Payment Tabs / Buttons */}
          <div className="grid grid-cols-3 gap-3">
            {/* 1. Pix */}
            <button
              type="button"
              onClick={() => {
                playTouchSound(560);
                setSelectedMethod('pix');
              }}
              className={`p-4 rounded-2xl border text-center transition-all active:scale-95 flex flex-col items-center justify-center gap-2 min-h-[90px] ${
                selectedMethod === 'pix'
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}
            >
              <QrCode className="w-7 h-7" />
              <div className="leading-tight">
                <span className="font-display text-sm sm:text-base font-bold uppercase block">
                  Pix na Tela
                </span>
                <span className="text-[10px] opacity-80 block">Aprovação na hora</span>
              </div>
            </button>

            {/* 2. Cartão */}
            <button
              type="button"
              onClick={() => {
                playTouchSound(560);
                setSelectedMethod('cartao_balcao');
              }}
              className={`p-4 rounded-2xl border text-center transition-all active:scale-95 flex flex-col items-center justify-center gap-2 min-h-[90px] ${
                selectedMethod === 'cartao_balcao'
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}
            >
              <CreditCard className="w-7 h-7" />
              <div className="leading-tight">
                <span className="font-display text-sm sm:text-base font-bold uppercase block">
                  Cartão
                </span>
                <span className="text-[10px] opacity-80 block">No Balcão</span>
              </div>
            </button>

            {/* 3. Dinheiro */}
            <button
              type="button"
              onClick={() => {
                playTouchSound(560);
                setSelectedMethod('dinheiro_balcao');
              }}
              className={`p-4 rounded-2xl border text-center transition-all active:scale-95 flex flex-col items-center justify-center gap-2 min-h-[90px] ${
                selectedMethod === 'dinheiro_balcao'
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}
            >
              <Banknote className="w-7 h-7" />
              <div className="leading-tight">
                <span className="font-display text-sm sm:text-base font-bold uppercase block">
                  Dinheiro
                </span>
                <span className="text-[10px] opacity-80 block">No Caixa</span>
              </div>
            </button>
          </div>

          {/* Conditional Content depending on method */}
          {selectedMethod === 'pix' && (
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-3xl p-6 space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Simulated QR Code SVG */}
                <div className="relative p-3 bg-white rounded-2xl shadow-xl shrink-0">
                  <svg
                    viewBox="0 0 160 160"
                    className="w-36 h-36 sm:w-44 sm:h-44 text-zinc-950"
                    fill="currentColor"
                  >
                    <rect x="10" y="10" width="40" height="40" rx="4" />
                    <rect x="18" y="18" width="24" height="24" fill="white" />
                    <rect x="24" y="24" width="12" height="12" />

                    <rect x="110" y="10" width="40" height="40" rx="4" />
                    <rect x="118" y="18" width="24" height="24" fill="white" />
                    <rect x="124" y="24" width="12" height="12" />

                    <rect x="10" y="110" width="40" height="40" rx="4" />
                    <rect x="18" y="118" width="24" height="24" fill="white" />
                    <rect x="24" y="124" width="12" height="12" />

                    <rect x="60" y="15" width="10" height="10" />
                    <rect x="75" y="15" width="20" height="10" />
                    <rect x="60" y="35" width="15" height="10" />
                    <rect x="85" y="35" width="15" height="15" />
                    <rect x="15" y="60" width="15" height="10" />
                    <rect x="35" y="60" width="15" height="15" />
                    <rect x="60" y="60" width="40" height="40" rx="4" />
                    <circle cx="80" cy="80" r="10" fill="white" />
                    <rect x="76" y="76" width="8" height="8" fill="#F59E0B" />
                    <rect x="110" y="60" width="15" height="20" />
                    <rect x="135" y="60" width="15" height="15" />
                    <rect x="15" y="85" width="25" height="15" />
                    <rect x="110" y="90" width="20" height="15" />
                    <rect x="135" y="90" width="15" height="20" />
                    <rect x="60" y="110" width="20" height="15" />
                    <rect x="90" y="110" width="15" height="15" />
                    <rect x="115" y="115" width="30" height="10" />
                    <rect x="60" y="135" width="15" height="15" />
                    <rect x="85" y="130" width="20" height="20" />
                    <rect x="120" y="135" width="25" height="15" />
                  </svg>

                  <div className="text-[10px] text-center font-bold text-zinc-800 uppercase tracking-wider mt-1">
                    Maré Hamburgueria Pix
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-3 text-center sm:text-left flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Pagamento Seguro Instantâneo</span>
                  </div>

                  <p className="text-zinc-200 text-sm sm:text-base font-medium leading-snug">
                    Abra o app do seu banco, escolha <strong>Pix</strong> e aponte a câmera para o QR Code.
                  </p>

                  <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-zinc-400">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>QR Code válido por 10 minutos</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-500 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95"
                  >
                    {pixCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Código Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-amber-400" />
                        <span>Copiar Código Pix Copia-e-Cola</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Instant Simulator Button */}
              <div className="pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  disabled={isSimulatingPix}
                  onClick={handleSimulatePixSuccess}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-display font-extrabold text-base uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[54px]"
                >
                  {isSimulatingPix ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Confirmando Pagamento via Banco Central...</span>
                    </div>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Confirmar Pagamento Pix & Enviar Pedido</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {selectedMethod === 'cartao_balcao' && (
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 text-center animate-in fade-in duration-200">
              <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <CreditCard className="w-10 h-10" />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h4 className="font-display text-2xl font-bold uppercase text-zinc-100">
                  Pagamento na Maquininha
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Aceitamos <strong>Débito, Crédito e Vale-Refeição</strong> (Alelo, Sodexo, Ticket, VR).
                </p>
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-400 text-left flex items-start gap-2 mt-4">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Ao confirmar, o número do seu pedido será gerado e enviado diretamente para a cozinha. Pague na maquininha do balcão.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmCounterPayment}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-display font-extrabold text-base uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-98 transition-all min-h-[54px] flex items-center justify-center gap-2"
              >
                <span>Confirmar e Gerar Senha do Pedido</span>
                <Check className="w-5 h-5 stroke-[3]" />
              </button>
            </div>
          )}

          {selectedMethod === 'dinheiro_balcao' && (
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 text-center animate-in fade-in duration-200">
              <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Banknote className="w-10 h-10" />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h4 className="font-display text-2xl font-bold uppercase text-zinc-100">
                  Pagamento em Dinheiro no Caixa
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Dirija-se ao caixa com seu número em mãos para efetuar o pagamento.
                </p>
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-400 text-left flex items-start gap-2 mt-4">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Seu pedido será registrado e a equipe da cozinha iniciará a produção assim que o pagamento for registrado.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmCounterPayment}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-display font-extrabold text-base uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-98 transition-all min-h-[54px] flex items-center justify-center gap-2"
              >
                <span>Confirmar e Gerar Senha do Pedido</span>
                <Check className="w-5 h-5 stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
