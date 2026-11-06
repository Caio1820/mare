import React, { useEffect } from 'react';
import { Printer, X, CheckCircle, Smartphone } from 'lucide-react';
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
  const formattedDate = new Date(order.createdAt).toLocaleString('pt-BR');

  // Trigger print on mount if autoPrint requested
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

  const handleManualPrint = () => {
    playTouchSound(550);
    window.print();
  };

  const receiptContent = (
    <div
      id="thermal-receipt-printable"
      className="bg-white text-zinc-950 font-mono text-[11px] leading-tight p-5 w-full max-w-[340px] mx-auto shadow-xl border border-zinc-300 rounded-sm print:max-w-none print:shadow-none print:border-none print:p-0 print:m-0"
    >
      {/* Header */}
      <div className="text-center pb-3 border-b-2 border-dashed border-zinc-800 space-y-1">
        <h2 className="font-display text-xl font-black uppercase tracking-wider text-black">
          MARÉ HAMBURGUERIA
        </h2>
        <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-600">
          Uma Onda de Sabores
        </p>
        <p className="text-[9px] text-zinc-500">CNPJ: 45.892.102/0001-44</p>
        <p className="text-[9px] text-zinc-500">Parque Tecnológico · Beira-Rio · Macapá / AP</p>
        <p className="text-[9px] font-bold text-zinc-600 mt-1">{formattedDate}</p>
      </div>

      {/* Ticket Number (Big font for reception / kitchen) */}
      <div className="text-center py-3 my-2 border-y-2 border-dashed border-zinc-800 bg-zinc-50">
        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 block">
          SENHA DO PEDIDO
        </span>
        <span className="font-display text-4xl font-black text-black tracking-widest block my-0.5">
          {order.orderNumber}
        </span>
        <div className="text-xs font-bold uppercase tracking-wide inline-block px-2 py-0.5 border border-zinc-800 rounded mt-1">
          {order.orderType === 'local'
            ? `CONSUMO NO LOCAL · MESA ${order.tableNumber || '01'}`
            : 'PARA VIAGEM (RETIRADA)'}
        </div>
      </div>

      {/* Customer Info */}
      <div className="py-2 border-b border-dashed border-zinc-400 space-y-0.5">
        <div className="flex justify-between">
          <span className="text-zinc-600">CLIENTE:</span>
          <span className="font-bold text-black uppercase">{order.customerName}</span>
        </div>
        {order.customerPhone && (
          <div className="flex justify-between">
            <span className="text-zinc-600">WHATSAPP:</span>
            <span className="font-bold text-black">{order.customerPhone}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-zinc-600">PAGAMENTO:</span>
          <span className="font-bold uppercase text-black">
            {order.paymentMethod === 'pix'
              ? 'PIX INSTANTÂNEO'
              : order.paymentMethod === 'cartao_balcao'
              ? 'CARTÃO NO BALCÃO'
              : 'DINHEIRO'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-600">STATUS:</span>
          <span className="font-bold text-black uppercase">
            {order.paymentStatus === 'pago' ? '✓ PAGO' : 'PENDENTE NO BALCÃO'}
          </span>
        </div>
      </div>

      {/* Items Breakdown */}
      <div className="py-3 border-b-2 border-dashed border-zinc-800">
        <div className="flex justify-between text-[10px] font-bold text-zinc-600 pb-1 border-b border-zinc-300">
          <span>QTD ITEM</span>
          <span>VALOR</span>
        </div>

        <div className="divide-y divide-zinc-200 mt-1">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-2 space-y-0.5">
              <div className="flex justify-between font-bold text-black">
                <span>
                  {item.quantity}x {item.product.name}
                </span>
                <span>R$ {item.totalPrice.toFixed(2).replace('.', ',')}</span>
              </div>

              {/* 3D Custom Burger Layers Details */}
              {item.burger3DConfig && (
                <div className="text-[10px] text-zinc-700 pl-3 border-l-2 border-zinc-400 space-y-0.5 my-1">
                  <div>• {item.burger3DConfig.bunLabel}</div>
                  <div>
                    • {item.burger3DConfig.pattiesCount}x Blend 160g ({item.burger3DConfig.meatDoneness})
                  </div>
                  <div>• {item.burger3DConfig.cheeseLabel}</div>
                  {item.burger3DConfig.selectedAddons.bacon && <div>• + Bacon Crocante</div>}
                  {item.burger3DConfig.selectedAddons.cebola_caram && <div>• + Cebola Caramelizada</div>}
                  {item.burger3DConfig.selectedAddons.picles && <div>• + Picles Artesanal</div>}
                  {item.burger3DConfig.selectedAddons.salada_mare && <div>• + Salada Maré</div>}
                  <div>• {item.burger3DConfig.sauceLabel}</div>
                </div>
              )}

              {/* Standard Item Customization */}
              {!item.burger3DConfig && item.customization && (
                <div className="text-[10px] text-zinc-600 pl-2">
                  {item.customization.meatDoneness && <div>Ponto: {item.customization.meatDoneness}</div>}
                  {item.customization.removedIngredients.length > 0 && (
                    <div className="text-red-700 font-bold">
                      SEM: {item.customization.removedIngredients.join(', ')}
                    </div>
                  )}
                  {Object.entries(item.customization.selectedAddons).map(([addonId, qty]) => (
                    <div key={addonId}>+ {qty}x Adicional {addonId.replace('_', ' ')}</div>
                  ))}
                  {item.customization.specialNotes && (
                    <div className="italic">Obs: {item.customization.specialNotes}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Observations */}
      {order.observations && (
        <div className="py-2 border-b border-dashed border-zinc-400 bg-zinc-50 p-1.5 my-1 rounded">
          <span className="text-[9px] font-bold text-zinc-600 block uppercase">OBSERVAÇÕES:</span>
          <span className="font-bold text-black">{order.observations}</span>
        </div>
      )}

      {/* Total Section */}
      <div className="py-3 border-b-2 border-dashed border-zinc-800 space-y-1">
        <div className="flex justify-between text-xs font-bold">
          <span>SUBTOTAL:</span>
          <span>R$ {order.subtotal.toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="flex justify-between text-base font-black text-black pt-1 border-t border-zinc-300">
          <span>TOTAL GERAL:</span>
          <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      {/* Simulated Thermal QR Code */}
      <div className="py-4 text-center space-y-1">
        <div className="inline-block p-1 border-2 border-black rounded bg-white">
          <svg className="w-24 h-24 mx-auto" viewBox="0 0 25 25" fill="black">
            <rect x="0" y="0" width="7" height="7" />
            <rect x="1" y="1" width="5" height="5" fill="white" />
            <rect x="2" y="2" width="3" height="3" fill="black" />
            <rect x="18" y="0" width="7" height="7" />
            <rect x="19" y="1" width="5" height="5" fill="white" />
            <rect x="20" y="2" width="3" height="3" fill="black" />
            <rect x="0" y="18" width="7" height="7" />
            <rect x="1" y="19" width="5" height="5" fill="white" />
            <rect x="2" y="20" width="3" height="3" fill="black" />
            <rect x="9" y="2" width="2" height="4" />
            <rect x="13" y="1" width="3" height="2" />
            <rect x="9" y="9" width="3" height="3" />
            <rect x="14" y="9" width="4" height="2" />
            <rect x="10" y="15" width="2" height="5" />
            <rect x="15" y="14" width="3" height="3" />
            <rect x="19" y="10" width="4" height="4" />
            <rect x="20" y="18" width="4" height="5" />
          </svg>
        </div>
        <p className="text-[9px] font-bold text-zinc-600 uppercase">
          Acompanhe seu pedido no Painel TV
        </p>
        <p className="text-[8px] text-zinc-500 italic">
          &ldquo;A maré vem e vai. O sabor fica.&rdquo;
        </p>
      </div>

      <div className="text-center text-[8px] text-zinc-400 pt-2 border-t border-dashed border-zinc-300">
        Sistema Maré KDS & Autoatendimento 3D
      </div>
    </div>
  );

  if (isInlinePreview) {
    return receiptContent;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-md p-4 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
        {/* Header Controls */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-100 font-display text-sm font-bold uppercase tracking-wider">
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Comanda Térmica ({order.orderNumber})</span>
          </div>

          {onClose && (
            <button
              onClick={() => {
                playTouchSound(400);
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Receipt Area */}
        <div className="max-h-[70vh] overflow-y-auto p-1 bg-zinc-950/60 rounded-xl mb-4">
          {receiptContent}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleManualPrint}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-display font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all min-h-[46px]"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Comanda (80mm)</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs active:scale-95 transition-all min-h-[46px]"
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
