import React, { useEffect, useState, useCallback } from 'react';
import { Printer, X, ChefHat, Receipt, Scissors } from 'lucide-react';
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
  const [printingStepLabel, setPrintingStepLabel] = useState<string | null>(null);
  const formattedDate = new Date(order.createdAt).toLocaleString('pt-BR');

  const locationLabel =
    order.orderType === 'local'
      ? order.tableNumber?.toLowerCase() === 'balcão' || order.tableNumber?.toLowerCase() === 'balcao'
        ? 'BALCÃO (SALÃO)'
        : `MESA ${order.tableNumber || '01'}`
      : 'PARA VIAGEM';

  // Imprime as duas vias em 2 disparos separados para acionar a guilhotina da impressora em cada via
  const handlePrint = useCallback((target: 'both' | 'kitchen' | 'counter') => {
    playTouchSound(550);

    if (target === 'both') {
      // 1º Disparo: SOMENTE Via da Cozinha -> Aciona o corte automático da bobina
      setPrintTarget('kitchen');
      setPrintingStepLabel('Imprimindo 1/2: Via da Cozinha (Destacada)...');

      setTimeout(() => {
        let secondTriggered = false;
        const triggerSecondSlip = () => {
          if (secondTriggered) return;
          secondTriggered = true;
          window.removeEventListener('afterprint', triggerSecondSlip);

          // 2º Disparo: SOMENTE Via do Balcão -> Aciona o 2º corte automático da bobina
          setPrintTarget('counter');
          setPrintingStepLabel('Imprimindo 2/2: Via do Balcão (Destacada)...');

          setTimeout(() => {
            try {
              window.print();
            } catch {
              // ignore
            } finally {
              setTimeout(() => {
                setPrintTarget('both');
                setPrintingStepLabel(null);
              }, 300);
            }
          }, 350);
        };

        window.addEventListener('afterprint', triggerSecondSlip, { once: true });

        try {
          window.print();
        } catch {
          triggerSecondSlip();
        }
      }, 150);
      return;
    }

    // Impressão individual (Só Cozinha ou Só Balcão)
    setPrintTarget(target);
    setPrintingStepLabel(
      target === 'kitchen' ? 'Imprimindo Via da Cozinha...' : 'Imprimindo Via do Balcão...'
    );
    setTimeout(() => {
      try {
        window.print();
      } catch {
        // ignore
      } finally {
        setTimeout(() => {
          setPrintTarget('both');
          setPrintingStepLabel(null);
        }, 300);
      }
    }, 150);
  }, []);

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        handlePrint('both');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, handlePrint]);

  // --- VIA 1: COZINHA (Super compacta e independente) ---
  const kitchenReceipt = (
    <div className="bg-white text-black font-mono text-[10px] leading-snug p-2.5 w-full max-w-[300px] mx-auto rounded-lg print:rounded-none print:max-w-none print:p-0">
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
                {item.customization.selectedOption && (
                  <div className="font-bold uppercase">• OPÇÃO/SABOR: {item.customization.selectedOption}</div>
                )}
                {item.product.isBurger && item.customization.meatDoneness && (
                  <div>• Ponto: {item.customization.meatDoneness}</div>
                )}
                {item.customization.removedIngredients.length > 0 && (
                  <div className="font-bold uppercase">• SEM: {item.customization.removedIngredients.join(', ')}</div>
                )}
                {Object.keys(item.customization.selectedAddons).length > 0 && (
                  <div className="font-bold">
                    • +{' '}
                    {Object.entries(item.customization.selectedAddons)
                      .map(([addonId, qty]) => {
                        const found = item.product.suggestedAddons?.find((a) => a.id === addonId);
                        return `${qty}x ${found ? found.name : addonId.replace(/_/g, ' ')}`;
                      })
                      .join(', ')}
                  </div>
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

  // --- VIA 2: BALCÃO / CAIXA (Super compacta e independente) ---
  const counterReceipt = (
    <div className="bg-white text-black font-mono text-[10px] leading-snug p-2.5 w-full max-w-[300px] mx-auto rounded-lg print:rounded-none print:max-w-none print:p-0">
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
          <div key={idx} className="text-[9px]">
            <div className="flex justify-between">
              <span>
                {item.quantity}x {item.product.name}
                {item.customization?.selectedOption ? ` (${item.customization.selectedOption})` : ''}
              </span>
              <span className="font-bold">R$ {item.totalPrice.toFixed(2).replace('.', ',')}</span>
            </div>
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
      {/* Regra CSS para Bobina 80mm com Corte Separado por Via */}
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
          body *:not(:has(.printable-area)):not(.printable-area):not(.printable-area *) {
            display: none !important;
          }
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
          /* Oculta o aviso visual de corte no papel impresso */
          .screen-only-divider {
            display: none !important;
          }
          /* Quebra de página explícita caso o usuário use Ctrl+P direto */
          .print-kitchen-only {
            page-break-after: always !important;
            break-after: page !important;
          }
          .print-counter-only {
            page-break-before: always !important;
            break-before: page !important;
          }
          ${printTarget === 'kitchen' ? '.print-counter-only { display: none !important; } .print-kitchen-only { page-break-after: auto !important; break-after: auto !important; }' : ''}
          ${printTarget === 'counter' ? '.print-kitchen-only { display: none !important; } .print-counter-only { page-break-before: auto !important; break-before: auto !important; }' : ''}
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

          {printingStepLabel && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
              <Scissors className="w-4 h-4" />
              <span>{printingStepLabel}</span>
            </div>
          )}

          {/* Preview na tela */}
          <div className="max-h-[58vh] overflow-y-auto p-3 bg-zinc-950/90 rounded-2xl mb-4 border border-zinc-800">
            <div className="printable-area">
              <div className="print-kitchen-only">{kitchenReceipt}</div>

              {/* Aviso apenas na tela (nunca sai impresso no papel) */}
              <div className="screen-only-divider my-3 py-1.5 px-3 rounded-lg bg-zinc-900 border border-dashed border-amber-500/40 text-center font-mono text-[10px] text-amber-400 flex items-center justify-center gap-1.5 select-none">
                <Scissors className="w-3.5 h-3.5" />
                <span>CORTE AUTOMÁTICO DA IMPRESSORA (2 VIAS SEPARADAS)</span>
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
              <span>1ª Via: Cozinha</span>
            </button>

            <button
              onClick={() => handlePrint('counter')}
              className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Receipt className="w-4 h-4" />
              <span>2ª Via: Balcão</span>
            </button>

            <button
              onClick={() => handlePrint('both')}
              className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
            >
              <Scissors className="w-4 h-4" />
              <span>Imprimir 2 Vias</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
