import React, { useEffect, useState } from 'react';
import { Printer, X, ChefHat, Receipt } from 'lucide-react';
import { Order } from '../types';
import { playTouchSound } from '../utils/sound';

interface ThermalReceiptProps {
  order: Order;
  autoPrint?: boolean;
  onClose?: () => void;
  isInlinePreview?: boolean;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  order,
  autoPrint = false,
  onClose,
  isInlinePreview = false,
}) => {
  const [printTarget, setPrintTarget] = useState<'both' | 'kitchen' | 'counter'>('both');
  const formattedDate = new Date(order.createdAt).toLocaleString('pt-BR');

  const locationLabel =
    order.orderType === 'local'
      ? order.tableNumber?.toLowerCase() === 'balcão' || order.tableNumber?.toLowerCase() === 'balcao'
        ? 'BALCÃO (SALÃO)'
        : `MESA ${order.tableNumber || '01'}`
      : 'PARA VIAGEM';

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        try {
          window.print();
        } catch {
          // ignore
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const handlePrint = (target: 'both' | 'kitchen' | 'counter') => {
    playTouchSound(550);
    setPrintTarget(target);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // --- VIA 1: COZINHA (Super compacta para economizar bobina) ---
  const kitchenReceipt = (
    <div className="bg-white text-black font-mono text-[10px] leading-snug p-2.5 w-full max-w-[300px] mx-auto print:max-w-none print:p-0">
      <div className="flex items-center justify-between border-b border-dashed border-black pb-1">
        <div>
          <span className="bg-black text-white px-1.5 py-0.5 font-bold uppercase text-[9px]">
            VIA COZINHA
          </span>
          <div className="text-[8px] text-zinc-700 mt-0.5">{formattedDate}</div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-black leading-none">{order.orderNumber}</div>
          <div className="text-[9px] font-bold uppercase">{locationLabel}</div>
        </div>
      </div>

      <div className="py-1 border-b border-dashed border-black text-[10px] uppercase">
        <strong>CLIENTE:</strong> {order.customerName}
      </div>

      <div className="py-1.5 space-y-1">
        {order.items.map((item, idx) => (
          <div key={idx} className="pb-1 border-b border-dotted border-zinc-400 last:border-none">
            <div className="font-bold text-[11px]">
              {item.quantity}x {item.product.name}
            </div>
            {item.burger3DConfig && (
              <div className="text-[9px] pl-2">
                <div>• {item.burger3DConfig.bunLabel} | {item.burger3DConfig.pattiesCount}x Carne ({item.burger3DConfig.meatDoneness})</div>
                <div>• {item.burger3DConfig.cheeseLabel} | {item.burger3DConfig.sauceLabel}</div>
                {item.burger3DConfig.selectedAddons.bacon && <div>• + Bacon Crocante</div>}
                {item.burger3DConfig.selectedAddons.cebola_caram && <div>• + Cebola Caram.</div>}
                {item.burger3DConfig.selectedAddons.picles && <div>• + Picles</div>}
                {item.burger3DConfig.selectedAddons.salada_mare && <div>• + Salada Maré</div>}
              </div>
            )}
            {!item.burger3DConfig && item.customization && (
              <div className="text-[9px] pl-2">
                {item.customization.meatDoneness && <div>• Ponto: {item.customization.meatDoneness}</div>}
                {item.customization.removedIngredients.length > 0 && (
                  <div className="font-bold uppercase">• SEM: {item.customization.removedIngredients.join(', ')}</div>
                )}
                {item.customization.specialNotes && <div>• Obs: {item.customization.specialNotes}</div>}
              </div>
            )}
          </div>
        ))}
      </div>

      {order.observations && (
        <div className="p-1 border border-black text-[9px] mt-0.5">
          <strong>OBS:</strong> {order.observations}
        </div>
      )}
    </div>
  );

  // --- VIA 2: BALCÃO / CAIXA (Super compacta) ---
  const counterReceipt = (
    <div className="bg-white text-black font-mono text-[10px] leading-snug p-2.5 w-full max-w-[300px] mx-auto print:max-w-none print:p-0">
      <div className="flex items-center justify-between border-b border-dashed border-black pb-1">
        <div>
          <span className="bg-zinc-900 text-white px-1.5 py-0.5 font-bold uppercase text-[9px]">
            VIA BALCÃO / CAIXA
          </span>
          <div className="font-bold text-[10px] mt-0.5">MARÉ HAMBURGUERIA</div>
          <div className="text-[8px] text-zinc-600">{formattedDate}</div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-black leading-none">{order.orderNumber}</div>
          <div className="text-[9px] font-bold uppercase">{locationLabel}</div>
        </div>
      </div>

      <div className="py-1 border-b border-dashed border-black space-y-0.5 text-[9px]">
        <div className="flex justify-between">
          <span>CLIENTE:</span>
          <strong className="uppercase">{order.customerName}</strong>
        </div>
        <div className="flex justify-between">
          <span>PAGAMENTO:</span>
          <strong className="uppercase">
            {order.paymentMethod === 'pix'
              ? 'PIX'
              : order.paymentMethod === 'cartao_balcao'
              ? 'CARTÃO'
              : 'DINHEIRO'}
            {' · '}
            {order.paymentStatus === 'pago' ? '✓ PAGO' : 'PENDENTE'}
          </strong>
        </div>
      </div>

      <div className="py-1 border-b border-dashed border-black space-y-0.5">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-[9px]">
            <span>{item.quantity}x {item.product.name}</span>
            <span className="font-bold">R$ {item.totalPrice.toFixed(2).replace('.', ',')}</span>
          </div>
        ))}
      </div>

      <div className="pt-1 flex justify-between text-xs font-black">
        <span>TOTAL:</span>
        <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
      </div>
    </div>
  );

  if (isInlinePreview) {
    return (
      <div className="space-y-3">
        {kitchenReceipt}
        {counterReceipt}
      </div>
    );
  }

  return (
    <>
      {/* Regra CSS para Bobina 80mm Contínua (1 Única Página, sem duplicar no PDF) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: 80mm auto;
            margin: 0mm;
          }
          html, body {
            width: 80mm !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }
          /* Oculta totalmente o resto do sistema para não gerar 2ª página */
          body *:not(:has(.printable-area)):not(.printable-area):not(.printable-area *) {
            display: none !important;
          }
          /* Remove position:fixed e limites de altura dos containers pais */
          *:has(.printable-area) {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            max-height: none !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            overflow: visible !important;
          }
          .printable-area {
            width: 74mm !important;
            margin: 0 auto !important;
            padding: 2mm 0 !important;
            background: #ffffff !important;
          }
          ${printTarget === 'kitchen' ? '.print-counter-only, .print-cut-line { display: none !important; }' : ''}
          ${printTarget === 'counter' ? '.print-kitchen-only, .print-cut-line { display: none !important; }' : ''}
        }
      `}} />

      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 overflow-y-auto">
        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-md p-4 sm:p-6 shadow-2xl relative">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-100 font-display text-sm font-bold uppercase tracking-wider">
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Impressão de Comandas ({order.orderNumber})</span>
            </div>

            {onClose && (
              <button
                onClick={() => { playTouchSound(400); onClose(); }}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Preview na tela */}
          <div className="max-h-[60vh] overflow-y-auto p-2 bg-zinc-950/80 rounded-xl mb-4">
            <div className="printable-area">
              <div className="print-kitchen-only">{kitchenReceipt}</div>
              
              {/* Linha de corte entre a via da cozinha e a do balcão */}
              <div className="print-cut-line py-2 text-center font-mono text-[9px] text-zinc-500 print:text-black select-none">
                - - - - - - ✂ DESTACAR AQUI - - - - - -
              </div>

              <div className="print-counter-only">{counterReceipt}</div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => handlePrint('kitchen')}
              className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <ChefHat className="w-4 h-4" />
              <span>Só Cozinha</span>
            </button>

            <button
              onClick={() => handlePrint('counter')}
              className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Receipt className="w-4 h-4" />
              <span>Só Balcão</span>
            </button>

            <button
              onClick={() => handlePrint('both')}
              className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ambas</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
