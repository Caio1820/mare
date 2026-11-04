import React from 'react';
import { Printer, X, Check } from 'lucide-react';
import { Order } from '../types';
import { playTouchSound } from '../utils/sound';

interface ReceiptModalProps {
  order: Order;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  const formattedDate = new Date(order.createdAt).toLocaleString('pt-BR');

  const handlePrint = () => {
    playTouchSound(600);
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white text-zinc-950 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative font-mono text-xs animate-in zoom-in-95 duration-150">
        {/* Close */}
        <button
          onClick={() => {
            playTouchSound(400);
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Receipt Header */}
        <div className="text-center pb-4 border-b border-dashed border-zinc-400 space-y-1">
          <h2 className="font-display text-2xl font-black uppercase tracking-wider text-zinc-900">
            MARÉ HAMBÚRGUERIA
          </h2>
          <p className="text-[11px] text-zinc-600">CNPJ: 45.892.102/0001-44</p>
          <p className="text-[10px] text-zinc-600">Av. Beira-Mar, 1040 · Litoral Gastronômico</p>
          <p className="text-[10px] text-zinc-500">{formattedDate}</p>
        </div>

        {/* Order Ticket Big Number */}
        <div className="text-center py-4 border-b border-dashed border-zinc-400 bg-zinc-50 my-2 rounded-lg">
          <span className="text-[10px] uppercase font-bold text-zinc-500 block">SENHA DO PEDIDO</span>
          <span className="font-display text-4xl font-black tracking-widest text-zinc-900">
            {order.orderNumber}
          </span>
          <span className="text-xs font-bold block mt-1">
            {order.orderType === 'local' ? `CONSUMO NO LOCAL · MESA ${order.tableNumber}` : 'PARA VIAGEM'}
          </span>
        </div>

        {/* Items List */}
        <div className="py-3 border-b border-dashed border-zinc-400 space-y-2">
          <div className="flex justify-between font-bold text-zinc-700 pb-1 border-b border-zinc-200">
            <span>QTD ITEM</span>
            <span>TOTAL</span>
          </div>

          {order.items.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="flex justify-between font-semibold">
                <span>
                  {item.quantity}x {item.product.name}
                </span>
                <span>R$ {item.totalPrice.toFixed(2).replace('.', ',')}</span>
              </div>
              {item.customization && (
                <div className="text-[10px] text-zinc-600 pl-4 space-y-0.5">
                  {item.product.isBurger && <div>* Carne: {item.customization.meatDoneness}</div>}
                  {item.customization.removedIngredients.length > 0 && (
                    <div>* Sem: {item.customization.removedIngredients.join(', ')}</div>
                  )}
                  {Object.keys(item.customization.selectedAddons).length > 0 && (
                    <div>
                      * Extras: {Object.keys(item.customization.selectedAddons).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Total & Payment */}
        <div className="py-3 border-b border-dashed border-zinc-400 space-y-1">
          <div className="flex justify-between text-zinc-600">
            <span>Subtotal</span>
            <span>R$ {order.subtotal.toFixed(2).replace('.', ',')}</span>
          </div>
          <div className="flex justify-between font-bold text-sm text-zinc-900 pt-1">
            <span>TOTAL GERAL</span>
            <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
          </div>
          <div className="flex justify-between text-zinc-600 pt-1">
            <span>FORMA DE PAGAMENTO</span>
            <span className="uppercase font-semibold">
              {order.paymentMethod === 'pix'
                ? 'Pix Instantâneo'
                : order.paymentMethod === 'cartao_balcao'
                ? 'Cartão Balcão'
                : 'Dinheiro Balcão'}
            </span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>STATUS PAGAMENTO</span>
            <span className="uppercase font-bold text-emerald-700">
              {order.paymentStatus === 'pago' ? 'APROVADO / PAGO' : 'PAGAR NO CAIXA'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-3 space-y-1 text-zinc-500 text-[10px]">
          <p>Obrigado pela preferência!</p>
          <p>Acompanhe sua senha no painel de chamadas da Maré.</p>
        </div>

        {/* Actions */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={handlePrint}
            className="py-3 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
          <button
            onClick={() => {
              playTouchSound(400);
              onClose();
            }}
            className="py-3 px-3 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs flex items-center justify-center gap-1"
          >
            <Check className="w-4 h-4" />
            <span>Fechar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
