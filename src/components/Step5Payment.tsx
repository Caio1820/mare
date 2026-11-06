import React, { useEffect, useState } from 'react';
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
  Loader2,
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
}

export const Step5Payment: React.FC<Step5PaymentProps> = ({
  orderType,
  tableNumber,
  items,
  cartTotal,
  onBack,
  onConfirmPayment,
}) => {
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [observations, setObservations] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('pix');
  const [pixCopied, setPixCopied] = useState(false);
  
  const [isLoadingPix, setIsLoadingPix] = useState<boolean>(false);
  const [pixData, setPixData] = useState<{ qrCode: string; txid: string } | null>(null);
  const [pixError, setPixError] = useState<string | null>(null);

  useEffect(() => {
    const generatePixCharge = async () => {
      setIsLoadingPix(true);
      setPixError(null);
      try {
        const tempPedidoId = `MARG_${Math.floor(1000 + Math.random() * 9000)}_${Date.now().toString().slice(-4)}`;
        const response = await fetch('/api/create-pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ valor: cartTotal, pedidoId: tempPedidoId }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setPixData({
            qrCode: data.qrCode || '00020126580014br.gov.bcb.pix...',
            txid: data.txid,
          });
        } else {
          setPixError(data.error || 'Erro ao gerar cobrança Pix.');
        }
      } catch (err) {
        console.error('Erro de conexão ao gerar Pix:', err);
        setPixError('Não foi possível conectar com o servidor de pagamento.');
      } finally {
        setIsLoadingPix(false);
      }
    };

    generatePixCharge();
  }, [cartTotal]);

  const validateName = (): boolean => {
    if (!customerName || !customerName.trim()) {
      setNameError('Por favor, informe seu nome para o painel de TV.');
      playTouchSound(380);
      return false;
    }
    setNameError('');
    return true;
  };

  const handleCopyPix = () => {
    if (!pixData?.qrCode) return;
    playTouchSound(550);
    navigator.clipboard?.writeText(pixData.qrCode);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  const handleConfirmPixPayment = () => {
    if (!validateName()) return;
    playSuccessChime();
    onConfirmPayment('pix', true, customerName.trim(), observations.trim(), customerPhone.trim() || undefined);
  };

  const handleConfirmCounterPayment = () => {
    if (!validateName()) return;
    playSuccessChime();
    onConfirmPayment(selectedMethod, false, customerName.trim(), observations.trim(), customerPhone.trim() || undefined);
  };

  const quickObservationTags = ['Sem cebola', 'Sem picles', 'Sem molho', 'Talher descartável', 'Maionese à parte'];

  return (
    <div className="min-h-[calc(100dvh-54px)] sm:min-h-[calc(100vh-65px)] bg-zinc-950 p-3 sm:p-6 md:p-8 max-w-6xl mx-auto w-full flex flex-col justify-between pb-safe overflow-y-auto">
      <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-zinc-800/80">
        <button
          onClick={() => { playTouchSound(480); onBack(); }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold text-xs sm:text-sm hover:bg-zinc-800 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 text-amber-500" />
          <span>Voltar ao Cardápio</span>
        </button>
        <div className="text-zinc-500 text-[10px] sm:text-xs font-semibold uppercase tracking-widest">
          Etapa 3 de 4 · Pagamento
        </div>
      </div>

      <div className="my-4 sm:my-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-900/90 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-6 space-y-3">
            <h3 className="font-display text-lg font-bold uppercase text-zinc-100">
              Identificação <span className="text-amber-400">*</span>
            </h3>
            <input
              type="text"
              value={customerName}
              onChange={(e) => { setCustomerName(e.target.value); if (nameError) setNameError(''); }}
              placeholder="Seu nome"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-amber-400 outline-none"
            />
            {nameError && <div className="text-xs text-red-400">{nameError}</div>}
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-display text-xl font-bold uppercase text-zinc-100">Resumo</h3>
            <div className="text-xl font-bold text-amber-400">R$ {cartTotal.toFixed(2).replace('.', ',')}</div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setSelectedMethod('pix')}
              className={`p-4 rounded-2xl border text-center ${selectedMethod === 'pix' ? 'bg-amber-500 text-zinc-950 font-bold border-amber-400' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}
            >
              Pix BB
            </button>
            <button
              onClick={() => setSelectedMethod('cartao_balcao')}
              className={`p-4 rounded-2xl border text-center ${selectedMethod === 'cartao_balcao' ? 'bg-amber-500 text-zinc-950 font-bold border-amber-400' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}
            >
              Cartão
            </button>
            <button
              onClick={() => setSelectedMethod('dinheiro_balcao')}
              className={`p-4 rounded-2xl border text-center ${selectedMethod === 'dinheiro_balcao' ? 'bg-amber-500 text-zinc-950 font-bold border-amber-400' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}
            >
              Dinheiro
            </button>
          </div>

          {selectedMethod === 'pix' && (
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-3xl p-6 space-y-5">
              {isLoadingPix ? (
                <div className="py-12 flex items-center justify-center gap-3 text-zinc-400">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                  <span>Gerando Pix do Banco do Brasil...</span>
                </div>
              ) : pixError ? (
                <div className="py-8 text-center text-red-400">{pixError}</div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="p-3 bg-white rounded-2xl">
                      <QrCode className="w-36 h-36 text-zinc-950" />
                    </div>
                    <div className="space-y-3">
                      <button
                        onClick={handleCopyPix}
                        className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-2"
                      >
                        {pixCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                        <span>{pixCopied ? 'Copiado!' : 'Copiar Pix Copia-e-Cola'}</span>
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleConfirmPixPayment}
                    className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirmar Pagamento Pix & Enviar Pedido</span>
                  </button>
                </>
              )}
            </div>
          )}

          {selectedMethod !== 'pix' && (
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-3xl p-8 text-center space-y-6">
              <h4 className="font-display text-2xl font-bold uppercase text-zinc-100">
                Pagamento no {selectedMethod === 'cartao_balcao' ? 'Balcão (Cartão)' : 'Caixa (Dinheiro)'}
              </h4>
              <button
                onClick={handleConfirmCounterPayment}
                className="w-full py-4 rounded-2xl bg-amber-500 text-zinc-950 font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <span>Confirmar e Gerar Senha do Pedido</span>
                <Check className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
