import React, { useEffect, useState, useCallback } from 'react';
import { Printer, X, ChefHat, Receipt, Scissors, CheckCircle2, User, CreditCard } from 'lucide-react';
import { Order } from '../types';
import { OpenTableSummary } from '../utils/kdsStore';
import { playTouchSound } from '../utils/sound';

interface ThermalReceiptProps {
  order: Order;
  autoPrint?: boolean;
  onClose?: () => void;
  isInlinePreview?: boolean;
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getLocationLabel(order: Order): string {
  if (order.orderType === 'local') {
    const table = (order.tableNumber || '01').trim();
    if (table.toLowerCase() === 'balcão' || table.toLowerCase() === 'balcao') {
      return 'BALCÃO (SALÃO)';
    }
    return `MESA ${table}`;
  }
  return 'PARA VIAGEM';
}

/**
 * 1ª VIA: VIA DA COZINHA (Preparo)
 * Formatação super enxuta e direta, focada na montagem e na chapa, sem valores monetários.
 */
function buildKitchenHtml(order: Order): string {
  const formattedDate = new Date(order.createdAt).toLocaleString('pt-BR');
  const locationLabel = getLocationLabel(order);

  const itemsHtml = order.items
    .map((item) => {
      let detailsHtml = '';

      if (item.burger3DConfig) {
        const b = item.burger3DConfig;
        detailsHtml += `<div class="sub-item">• ${escapeHtml(b.bunLabel)} | ${b.pattiesCount}x Carne (${escapeHtml(b.meatDoneness)})</div>`;
        detailsHtml += `<div class="sub-item">• ${escapeHtml(b.cheeseLabel)} | ${escapeHtml(b.sauceLabel)}</div>`;
        if (b.selectedAddons.bacon) detailsHtml += `<div class="sub-item">• + Bacon Crocante</div>`;
        if (b.selectedAddons.cebola_caram) detailsHtml += `<div class="sub-item">• + Cebola Caram.</div>`;
        if (b.selectedAddons.picles) detailsHtml += `<div class="sub-item">• + Picles</div>`;
        if (b.selectedAddons.salada_mare) detailsHtml += `<div class="sub-item">• + Salada Maré</div>`;
      } else if (item.customization) {
        const c = item.customization;
        if (c.selectedOption) {
          detailsHtml += `<div class="sub-item bold" style="background:#000;color:#fff;padding:1px 3px;display:inline-block;margin:1px 0;">• OPÇÃO: ${escapeHtml(c.selectedOption.toUpperCase())}</div>`;
        }
        if (item.product.isBurger && c.meatDoneness) {
          detailsHtml += `<div class="sub-item bold">• PONTO: ${escapeHtml(c.meatDoneness.toUpperCase())}</div>`;
        }
        if (c.removedIngredients && c.removedIngredients.length > 0) {
          detailsHtml += `<div class="sub-item bold" style="text-decoration:underline;">• SEM: ${escapeHtml(c.removedIngredients.join(', ').toUpperCase())}</div>`;
        }
        const addonEntries = Object.entries(c.selectedAddons || {});
        if (addonEntries.length > 0) {
          const addonsText = addonEntries
            .map(([addonId, qty]) => {
              const found = item.product.suggestedAddons?.find((a) => a.id === addonId);
              return `${qty}x ${found ? found.name : addonId.replace(/_/g, ' ')}`;
            })
            .join(', ');
          detailsHtml += `<div class="sub-item bold">• + ${escapeHtml(addonsText)}</div>`;
        }
        if (c.specialNotes) {
          detailsHtml += `<div class="sub-item" style="font-style:italic;">• Obs: ${escapeHtml(c.specialNotes)}</div>`;
        }
      }

      return `
        <div class="item-row">
          <div class="item-title" style="font-size:13px;font-weight:900;">${item.quantity}x ${escapeHtml(item.product.name)}</div>
          ${detailsHtml}
        </div>
      `;
    })
    .join('');

  const obsHtml = order.observations
    ? `<div class="obs-box" style="border:2px solid #000;font-weight:bold;"><strong>OBS:</strong> ${escapeHtml(order.observations)}</div>`
    : '';

  const roundBadge =
    order.roundNumber && order.roundNumber > 1
      ? `<div style="font-size:10px;font-weight:bold;margin-top:2px;background:#000;color:#fff;padding:1px 4px;display:inline-block;">★ ${order.roundNumber}º PEDIDO DA ${escapeHtml(locationLabel)}</div>`
      : '';

  return `
    <div class="receipt-slip">
      <div class="header-row">
        <div>
          <span class="badge" style="font-size:11px;padding:2px 6px;">VIA 1: COZINHA</span>
          ${roundBadge}
          <div class="date-text">${escapeHtml(formattedDate)}</div>
        </div>
        <div class="right-col">
          <div class="order-num" style="font-size:24px;">${escapeHtml(order.orderNumber)}</div>
          <div class="loc-text" style="font-size:12px;">${escapeHtml(locationLabel)}</div>
        </div>
      </div>
      <div class="customer-row" style="font-size:12px;">
        <strong>CLIENTE:</strong> ${escapeHtml(order.customerName.toUpperCase())}
      </div>
      <div class="items-section">
        ${itemsHtml}
      </div>
      ${obsHtml}
      <div style="text-align:center;font-size:9px;margin-top:4px;border-top:1px dashed #000;padding-top:2px;">
        LINHA DE PRODUÇÃO · MARÉ
      </div>
    </div>
  `;
}

/**
 * 2ª VIA: VIA DO BALCÃO / CAIXA
 * Formatação para controle financeiro interno do operador de caixa e atendente.
 */
function buildCounterHtml(order: Order): string {
  const formattedDate = new Date(order.createdAt).toLocaleString('pt-BR');
  const locationLabel = getLocationLabel(order);
  const paymentMethodLabel =
    order.paymentMethod === 'pix'
      ? 'PIX'
      : order.paymentMethod === 'cartao_balcao'
      ? 'CARTÃO'
      : order.paymentMethod === 'dinheiro_balcao'
      ? 'DINHEIRO'
      : 'BALCÃO / GARÇOM';
  const paymentStatusLabel = order.paymentStatus === 'pago' ? '✓ PAGO' : 'PENDENTE';

  const itemsHtml = order.items
    .map((item) => {
      const optSuffix = item.customization?.selectedOption
        ? ` (${escapeHtml(item.customization.selectedOption)})`
        : '';
      const priceStr = item.totalPrice.toFixed(2).replace('.', ',');
      return `
        <div class="counter-item-row">
          <span>${item.quantity}x ${escapeHtml(item.product.name)}${optSuffix}</span>
          <span class="bold">R$ ${priceStr}</span>
        </div>
      `;
    })
    .join('');

  const totalStr = order.total.toFixed(2).replace('.', ',');

  return `
    <div class="receipt-slip">
      <div class="header-row">
        <div>
          <span class="badge" style="background:#222;color:#fff;">VIA 2: BALCÃO / CAIXA</span>
          <div class="brand-title">MARÉ HAMBURGUERIA</div>
          <div class="date-text">${escapeHtml(formattedDate)}</div>
        </div>
        <div class="right-col">
          <div class="order-num">${escapeHtml(order.orderNumber)}</div>
          <div class="loc-text">${escapeHtml(locationLabel)}</div>
        </div>
      </div>
      <div class="meta-section">
        <div class="flex-between">
          <span>CLIENTE:</span>
          <strong>${escapeHtml(order.customerName.toUpperCase())}</strong>
        </div>
        <div class="flex-between">
          <span>PAGAMENTO:</span>
          <strong>${paymentMethodLabel} · ${paymentStatusLabel}</strong>
        </div>
      </div>
      <div class="items-section">
        ${itemsHtml}
      </div>
      <div class="total-row">
        <span>TOTAL DO PEDIDO:</span>
        <span>R$ ${totalStr}</span>
      </div>
      <div style="text-align:center;font-size:9px;margin-top:5px;border-top:1px dashed #000;padding-top:2px;">
        CONTROLE INTERNO DE CAIXA
      </div>
    </div>
  `;
}

/**
 * 3ª VIA: VIA DO CLIENTE (Cupom de Conferência / Comprovante de Pagamento)
 * Elegante, detalhada, perfeita para o garçom levar até a mesa ou entregar na mão do cliente.
 */
function buildCustomerHtml(
  order: Order,
  paymentDetailsOverride?: { paymentMethodLabel?: string; statusLabel?: string }
): string {
  const formattedDate = new Date(order.createdAt).toLocaleString('pt-BR');
  const locationLabel = getLocationLabel(order);
  const paymentMethodLabel =
    paymentDetailsOverride?.paymentMethodLabel ||
    (order.paymentMethod === 'pix'
      ? 'PIX'
      : order.paymentMethod === 'cartao_balcao'
      ? 'CARTÃO (NA MESA / BALCÃO)'
      : order.paymentMethod === 'dinheiro_balcao'
      ? 'DINHEIRO'
      : 'PAGAMENTO NO CAIXA');
  const paymentStatusLabel = paymentDetailsOverride?.statusLabel || (order.paymentStatus === 'pago' ? 'PAGO' : 'A PAGAR');

  const itemsHtml = order.items
    .map((item) => {
      const opt = item.customization?.selectedOption ? ` - ${escapeHtml(item.customization.selectedOption)}` : '';
      const unitStr = item.unitPrice.toFixed(2).replace('.', ',');
      const totalStr = item.totalPrice.toFixed(2).replace('.', ',');
      return `
        <div class="counter-item-row" style="padding:2px 0;">
          <div>
            <div style="font-weight:bold;">${item.quantity}x ${escapeHtml(item.product.name)}${opt}</div>
            <div style="font-size:9px;color:#333;">Unitário: R$ ${unitStr}</div>
          </div>
          <div style="font-weight:bold;text-align:right;">R$ ${totalStr}</div>
        </div>
      `;
    })
    .join('');

  const totalStr = order.total.toFixed(2).replace('.', ',');

  return `
    <div class="receipt-slip">
      <div class="header-row" style="text-align:center;display:block;border-bottom:1px solid #000;padding-bottom:5px;">
        <div style="font-size:14px;font-weight:900;letter-spacing:1px;">MARÉ HAMBURGUERIA</div>
        <div style="font-size:9px;color:#333;">UMA ONDA DE SABORES · MACAPÁ / AP</div>
        <div style="font-size:9px;color:#444;">${escapeHtml(formattedDate)}</div>
        <div style="margin-top:3px;">
          <span class="badge" style="background:#000;color:#fff;font-size:9px;">VIA 3: CLIENTE</span>
        </div>
      </div>
      <div class="meta-section" style="padding:4px 0;">
        <div class="flex-between">
          <span>LOCAL / CONSUMO:</span>
          <strong style="font-size:12px;">${escapeHtml(locationLabel)}</strong>
        </div>
        <div class="flex-between">
          <span>CLIENTE:</span>
          <strong>${escapeHtml(order.customerName.toUpperCase())}</strong>
        </div>
        <div class="flex-between">
          <span>SENHA / PEDIDO:</span>
          <strong style="font-size:13px;">${escapeHtml(order.orderNumber)}</strong>
        </div>
      </div>
      <div class="items-section" style="border-top:1px dashed #000;border-bottom:1px dashed #000;padding:5px 0;">
        <div style="font-size:9px;font-weight:bold;text-transform:uppercase;margin-bottom:3px;">Itens do Pedido:</div>
        ${itemsHtml}
      </div>
      <div class="total-row" style="font-size:14px;padding-top:4px;">
        <span>TOTAL A PAGAR:</span>
        <span>R$ ${totalStr}</span>
      </div>
      <div style="margin-top:4px;padding:3px;background:#f3f4f6;border:1px solid #000;font-size:9px;">
        <strong>FORMA DE PAGAMENTO:</strong> ${escapeHtml(paymentMethodLabel)} [${escapeHtml(paymentStatusLabel)}]
      </div>
      <div style="text-align:center;font-size:9px;margin-top:6px;padding-top:4px;border-top:1px dotted #888;">
        Obrigado pela preferência!<br />
        Instagram: <strong>@hamburgueriamaremcp</strong>
      </div>
    </div>
  `;
}

/**
 * Imprime a comanda em um iframe limpo e isolado (sem containers flex/fixed do modal),
 * garantindo que o driver da Elgin i7 Plus reconheça a paginação ou imprima cada via individualmente.
 */
export function printThermalOrder(
  order: Order,
  target: 'both' | 'kitchen' | 'counter' | 'customer' | 'all3',
  onAfterPrint?: () => void
): void {
  const existingIframe = document.getElementById('mare-thermal-print-iframe');
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'mare-thermal-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  let pagesHtml = '';

  if (target === 'kitchen') {
    pagesHtml = `<div class="receipt-page single-page">${buildKitchenHtml(order)}</div>`;
  } else if (target === 'counter') {
    pagesHtml = `<div class="receipt-page single-page">${buildCounterHtml(order)}</div>`;
  } else if (target === 'customer') {
    pagesHtml = `<div class="receipt-page single-page">${buildCustomerHtml(order)}</div>`;
  } else if (target === 'both') {
    // 2 Vias padrão: Cozinha + Balcão
    pagesHtml = `
      <div class="receipt-page page-break">${buildKitchenHtml(order)}</div>
      <div class="receipt-page single-page">${buildCounterHtml(order)}</div>
    `;
  } else if (target === 'all3') {
    // 3 Vias: Cozinha + Balcão + Cliente
    pagesHtml = `
      <div class="receipt-page page-break">${buildKitchenHtml(order)}</div>
      <div class="receipt-page page-break">${buildCounterHtml(order)}</div>
      <div class="receipt-page single-page">${buildCustomerHtml(order)}</div>
    `;
  }

  const docContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Comanda ${escapeHtml(order.orderNumber)}</title>
  <style>
    @page {
      margin: 0mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 72mm;
      background: #ffffff;
      color: #000000;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      line-height: 1.3;
    }
    .receipt-page {
      width: 72mm;
      padding: 2mm 1mm 6mm 1mm;
      background: #ffffff;
    }
    .page-break {
      page-break-after: always !important;
      break-after: page !important;
    }
    .single-page {
      page-break-after: auto !important;
      break-after: auto !important;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px dashed #000;
      padding-bottom: 4px;
      margin-bottom: 4px;
    }
    .badge {
      display: inline-block;
      background: #000;
      color: #fff;
      font-weight: bold;
      font-size: 10px;
      padding: 2px 5px;
      text-transform: uppercase;
    }
    .brand-title {
      font-weight: bold;
      font-size: 11px;
      margin-top: 2px;
    }
    .date-text {
      font-size: 9px;
      color: #222;
      margin-top: 2px;
    }
    .right-col {
      text-align: right;
    }
    .order-num {
      font-size: 22px;
      font-weight: 900;
      line-height: 1;
    }
    .loc-text {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .customer-row {
      padding: 4px 0;
      border-bottom: 1px dashed #000;
      font-size: 11px;
      text-transform: uppercase;
    }
    .meta-section {
      padding: 4px 0;
      border-bottom: 1px dashed #000;
      font-size: 10px;
    }
    .flex-between {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .items-section {
      padding: 4px 0;
      border-bottom: 1px dashed #000;
    }
    .item-row {
      padding: 3px 0;
      border-bottom: 1px dotted #888;
    }
    .item-row:last-child {
      border-bottom: none;
    }
    .item-title {
      font-weight: bold;
      font-size: 12px;
    }
    .sub-item {
      font-size: 10px;
      padding-left: 8px;
      margin-top: 1px;
    }
    .bold {
      font-weight: bold;
    }
    .counter-item-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      padding: 2px 0;
    }
    .obs-box {
      margin-top: 4px;
      padding: 4px;
      border: 1px solid #000;
      font-size: 10px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding-top: 5px;
      font-size: 13px;
      font-weight: 900;
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;

  const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!iframeDoc) return;

  iframeDoc.open();
  iframeDoc.write(docContent);
  iframeDoc.close();

  setTimeout(() => {
    const win = iframe.contentWindow;
    if (!win) return;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (onAfterPrint) onAfterPrint();
    };

    win.addEventListener('afterprint', finish, { once: true });

    try {
      win.focus();
      win.print();
    } catch {
      finish();
    }

    setTimeout(finish, 1200);
  }, 150);
}

/**
 * Imprime a VIA DO CLIENTE para a Conta Fechada da Mesa (levada pelo garçom à mesa).
 */
export function printCustomerBill(
  tableSummary: OpenTableSummary,
  paymentMethodLabel: string = 'CARTÃO (MÁQUINA NA MESA)',
  paymentStatusLabel: string = 'CONTA PAGA'
): void {
  const existingIframe = document.getElementById('mare-thermal-print-iframe');
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'mare-thermal-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const nowStr = new Date().toLocaleString('pt-BR');
  const roundsHtml = tableSummary.orders
    .map((ord, idx) => {
      const timeStr =
        ord.formattedTime ||
        new Date(ord.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const itemsRows = ord.items
        .map((it) => {
          const opt = it.customization?.selectedOption
            ? ` (${escapeHtml(it.customization.selectedOption)})`
            : '';
          const unitStr = it.unitPrice.toFixed(2).replace('.', ',');
          const priceStr = it.totalPrice.toFixed(2).replace('.', ',');
          return `
            <div class="counter-item-row" style="padding:1.5px 0;">
              <div>
                <span>${it.quantity}x ${escapeHtml(it.product.name)}${opt}</span>
                <span style="font-size:8px;color:#555;"> (R$ ${unitStr})</span>
              </div>
              <span class="bold">R$ ${priceStr}</span>
            </div>
          `;
        })
        .join('');

      return `
        <div class="item-row" style="padding:4px 0;">
          <div style="font-size:10px;font-weight:bold;margin-bottom:2px;background:#f3f4f6;padding:1px 3px;">
            ${idx + 1}º Pedido (${escapeHtml(ord.orderNumber)}) · ${escapeHtml(timeStr)}
          </div>
          ${itemsRows}
        </div>
      `;
    })
    .join('');

  const grandTotalStr = tableSummary.totalAmount.toFixed(2).replace('.', ',');

  const docContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Conta Cliente Mesa ${escapeHtml(tableSummary.tableNumber)}</title>
  <style>
    @page { margin: 0mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 72mm;
      background: #ffffff;
      color: #000000;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      line-height: 1.3;
    }
    .receipt-page {
      width: 72mm;
      padding: 2mm 1mm 6mm 1mm;
    }
    .badge {
      display: inline-block;
      background: #000;
      color: #fff;
      font-weight: bold;
      font-size: 10px;
      padding: 2px 5px;
      text-transform: uppercase;
    }
    .order-num { font-size: 20px; font-weight: 900; line-height: 1; }
    .meta-section { padding: 4px 0; border-bottom: 1px dashed #000; font-size: 10px; }
    .flex-between { display: flex; justify-content: space-between; margin-bottom: 2px; }
    .items-section { padding: 4px 0; border-bottom: 1px dashed #000; }
    .item-row { padding: 4px 0; border-bottom: 1px dotted #888; }
    .item-row:last-child { border-bottom: none; }
    .counter-item-row { display: flex; justify-content: space-between; font-size: 10px; padding: 1px 0; }
    .bold { font-weight: bold; }
    .total-row { display: flex; justify-content: space-between; padding-top: 6px; font-size: 14px; font-weight: 900; }
  </style>
</head>
<body>
  <div class="receipt-page">
    <div style="text-align:center;border-bottom:1px solid #000;padding-bottom:5px;">
      <div style="font-size:15px;font-weight:900;letter-spacing:1px;">MARÉ HAMBURGUERIA</div>
      <div style="font-size:9px;color:#333;">UMA ONDA DE SABORES · MACAPÁ / AP</div>
      <div style="font-size:9px;">${escapeHtml(nowStr)}</div>
      <div style="margin-top:3px;">
        <span class="badge">VIA DO CLIENTE</span>
      </div>
    </div>
    <div class="meta-section">
      <div class="flex-between">
        <span style="font-size:12px;font-weight:bold;">MESA ${escapeHtml(tableSummary.tableNumber)}:</span>
        <strong style="font-size:12px;">${escapeHtml(tableSummary.customerName.toUpperCase())}</strong>
      </div>
      <div class="flex-between">
        <span>TOTAL DE PEDIDOS:</span>
        <strong>${tableSummary.orders.length} PEDIDO(S) (${tableSummary.totalItemsCount} ITENS)</strong>
      </div>
    </div>
    <div class="items-section">
      ${roundsHtml}
    </div>
    <div class="total-row" style="border-bottom:1px solid #000;padding-bottom:4px;">
      <span>TOTAL CONSUMIDO:</span>
      <span>R$ ${grandTotalStr}</span>
    </div>
    <div style="margin-top:5px;padding:3px;background:#f3f4f6;border:1px solid #000;font-size:10px;">
      <strong>PAGAMENTO:</strong> ${escapeHtml(paymentMethodLabel.toUpperCase())}<br />
      <strong>STATUS:</strong> ${escapeHtml(paymentStatusLabel)}
    </div>
    <div style="text-align:center;font-size:9px;margin-top:6px;padding-top:4px;border-top:1px dotted #888;">
      Obrigado por saborear com a gente!<br />
      Atendimento na mesa por nossa equipe.
    </div>
  </div>
</body>
</html>`;

  const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!iframeDoc) return;
  iframeDoc.open();
  iframeDoc.write(docContent);
  iframeDoc.close();

  setTimeout(() => {
    const win = iframe.contentWindow;
    if (!win) return;
    try {
      win.focus();
      win.print();
    } catch {
      // ignore
    }
  }, 150);
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  order,
  autoPrint = false,
  onClose,
  isInlinePreview = false,
}) => {
  const [kitchenPrinted, setKitchenPrinted] = useState(false);
  const [counterPrinted, setCounterPrinted] = useState(false);
  const [customerPrinted, setCustomerPrinted] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const formattedDate = new Date(order.createdAt).toLocaleString('pt-BR');
  const locationLabel = getLocationLabel(order);

  const handlePrintKitchenOnly = useCallback(() => {
    playTouchSound(550);
    setStatusMessage('Enviando 1ª Via (Cozinha) destacada para a impressora...');
    printThermalOrder(order, 'kitchen', () => {
      setKitchenPrinted(true);
      setStatusMessage('1ª Via (Cozinha) enviada com sucesso!');
    });
  }, [order]);

  const handlePrintCounterOnly = useCallback(() => {
    playTouchSound(550);
    setStatusMessage('Enviando 2ª Via (Balcão / Caixa) destacada para a impressora...');
    printThermalOrder(order, 'counter', () => {
      setCounterPrinted(true);
      setStatusMessage('2ª Via (Balcão / Caixa) enviada com sucesso!');
    });
  }, [order]);

  const handlePrintCustomerOnly = useCallback(() => {
    playTouchSound(550);
    setStatusMessage('Enviando 3ª Via (Cliente) destacada para a impressora...');
    printThermalOrder(order, 'customer', () => {
      setCustomerPrinted(true);
      setStatusMessage('3ª Via (Cliente) enviada com sucesso!');
    });
  }, [order]);

  const handlePrintAll3 = useCallback(() => {
    playTouchSound(550);
    setStatusMessage('Enviando as 3 Vias separadas (Cozinha + Balcão + Cliente)...');
    printThermalOrder(order, 'all3', () => {
      setKitchenPrinted(true);
      setCounterPrinted(true);
      setCustomerPrinted(true);
      setStatusMessage('Todas as 3 vias enviadas!');
    });
  }, [order]);

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        handlePrintKitchenOnly();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, handlePrintKitchenOnly]);

  // Preview das 3 Vias
  const kitchenReceipt = (
    <div className="bg-white text-black font-mono text-[10px] leading-snug p-2.5 w-full max-w-[300px] mx-auto rounded-lg shadow">
      <div className="flex items-center justify-between border-b border-dashed border-black pb-1">
        <div>
          <span className="bg-black text-white px-1.5 py-0.5 font-bold uppercase text-[9px]">
            VIA 1: COZINHA
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
                <div>
                  • {item.burger3DConfig.bunLabel} | {item.burger3DConfig.pattiesCount}x Carne (
                  {item.burger3DConfig.meatDoneness})
                </div>
                <div>
                  • {item.burger3DConfig.cheeseLabel} | {item.burger3DConfig.sauceLabel}
                </div>
                {item.burger3DConfig.selectedAddons.bacon && <div>• + Bacon Crocante</div>}
                {item.burger3DConfig.selectedAddons.cebola_caram && <div>• + Cebola Caram.</div>}
                {item.burger3DConfig.selectedAddons.picles && <div>• + Picles</div>}
                {item.burger3DConfig.selectedAddons.salada_mare && <div>• + Salada Maré</div>}
              </div>
            )}
            {!item.burger3DConfig && item.customization && (
              <div className="text-[9px] pl-2">
                {item.customization.selectedOption && (
                  <div className="font-bold uppercase">
                    • OPÇÃO: {item.customization.selectedOption}
                  </div>
                )}
                {item.product.isBurger && item.customization.meatDoneness && (
                  <div>• Ponto: {item.customization.meatDoneness}</div>
                )}
                {item.customization.removedIngredients.length > 0 && (
                  <div className="font-bold uppercase">
                    • SEM: {item.customization.removedIngredients.join(', ')}
                  </div>
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
                {item.customization.specialNotes && (
                  <div>• Obs: {item.customization.specialNotes}</div>
                )}
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

  const counterReceipt = (
    <div className="bg-white text-black font-mono text-[10px] leading-snug p-2.5 w-full max-w-[300px] mx-auto rounded-lg shadow">
      <div className="flex items-center justify-between border-b border-dashed border-black pb-1">
        <div>
          <span className="bg-zinc-900 text-white px-1.5 py-0.5 font-bold uppercase text-[9px]">
            VIA 2: BALCÃO / CAIXA
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

  const customerReceipt = (
    <div className="bg-white text-black font-mono text-[10px] leading-snug p-2.5 w-full max-w-[300px] mx-auto rounded-lg shadow">
      <div className="text-center border-b border-black pb-1 mb-1">
        <div className="font-bold text-[11px]">MARÉ HAMBURGUERIA</div>
        <span className="bg-black text-white px-1.5 py-0.5 font-bold uppercase text-[8px] inline-block mt-0.5">
          VIA 3: CLIENTE (CONFERÊNCIA)
        </span>
      </div>

      <div className="py-0.5 text-[9px] space-y-0.5 border-b border-dashed border-black">
        <div className="flex justify-between">
          <span>LOCAL:</span>
          <strong className="uppercase">{locationLabel}</strong>
        </div>
        <div className="flex justify-between">
          <span>CLIENTE:</span>
          <strong className="uppercase">{order.customerName}</strong>
        </div>
        <div className="flex justify-between">
          <span>PEDIDO:</span>
          <strong>{order.orderNumber}</strong>
        </div>
      </div>

      <div className="py-1 border-b border-dashed border-black space-y-0.5 text-[9px]">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between">
            <span>
              {item.quantity}x {item.product.name}
            </span>
            <span>R$ {item.totalPrice.toFixed(2).replace('.', ',')}</span>
          </div>
        ))}
      </div>

      <div className="pt-1 flex justify-between text-xs font-black">
        <span>TOTAL DA CONTA:</span>
        <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
      </div>

      <div className="text-center text-[8px] text-zinc-600 mt-2 pt-1 border-t border-dotted border-zinc-400">
        Obrigado pela preferência! Volte sempre!
      </div>
    </div>
  );

  if (isInlinePreview) {
    return (
      <div className="space-y-3">
        {kitchenReceipt}
        {counterReceipt}
        {customerReceipt}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-3 overflow-y-auto">
      <div className="bg-zinc-900 border-t sm:border border-zinc-700 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-3.5 sm:p-5 shadow-2xl relative max-h-[92dvh] overflow-y-auto pb-safe">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-100 font-display text-xs sm:text-sm font-bold uppercase tracking-wider truncate">
            <Printer className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">Impressão em 3 Vias ({order.orderNumber})</span>
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

        {/* Informação sobre guilhotina e corte isolado */}
        <div className="mb-3 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 space-y-1">
          <div className="font-bold text-amber-400 flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 shrink-0" />
            <span>Corte individual na Elgin i7 Plus:</span>
          </div>
          <p className="text-zinc-400 leading-relaxed">
            Cada botão abaixo envia um documento separado, garantindo que a guilhotina corte o papel ao final de cada via.
          </p>
        </div>

        {statusMessage && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Preview na tela */}
        <div className="max-h-[46vh] overflow-y-auto p-3 bg-zinc-950/90 rounded-2xl mb-4 border border-zinc-800 space-y-3">
          {kitchenReceipt}

          <div className="py-1 px-3 rounded-lg bg-zinc-900 border border-dashed border-amber-500/30 text-center font-mono text-[9px] text-amber-400 flex items-center justify-center gap-1.5 select-none">
            <Scissors className="w-3 h-3" />
            <span>CORTE DA IMPRESSORA ENTRE AS VIAS</span>
          </div>

          {counterReceipt}

          <div className="py-1 px-3 rounded-lg bg-zinc-900 border border-dashed border-amber-500/30 text-center font-mono text-[9px] text-amber-400 flex items-center justify-center gap-1.5 select-none">
            <Scissors className="w-3 h-3" />
            <span>CORTE DA IMPRESSORA ENTRE AS VIAS</span>
          </div>

          {customerReceipt}
        </div>

        {/* Botões individuais de corte para as 3 vias */}
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handlePrintKitchenOnly}
              className={`py-3 px-2 rounded-xl font-bold text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-1 active:scale-95 transition-all border ${
                kitchenPrinted
                  ? 'bg-zinc-800 text-emerald-400 border-emerald-500/40'
                  : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 border-amber-400 shadow-md'
              }`}
            >
              <ChefHat className="w-4 h-4 shrink-0" />
              <span>{kitchenPrinted ? '✓ 1ª Cozinha' : '1ª Cozinha'}</span>
            </button>

            <button
              onClick={handlePrintCounterOnly}
              className={`py-3 px-2 rounded-xl font-bold text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-1 active:scale-95 transition-all border ${
                counterPrinted
                  ? 'bg-zinc-800 text-emerald-400 border-emerald-500/40'
                  : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 border-amber-400 shadow-md'
              }`}
            >
              <Receipt className="w-4 h-4 shrink-0" />
              <span>{counterPrinted ? '✓ 2ª Balcão' : '2ª Balcão'}</span>
            </button>

            <button
              onClick={handlePrintCustomerOnly}
              className={`py-3 px-2 rounded-xl font-bold text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-1 active:scale-95 transition-all border ${
                customerPrinted
                  ? 'bg-zinc-800 text-emerald-400 border-emerald-500/40'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 border-emerald-400 shadow-md'
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>{customerPrinted ? '✓ 3ª Cliente' : '3ª Cliente'}</span>
            </button>
          </div>

          <button
            onClick={handlePrintAll3}
            className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all border border-zinc-700"
          >
            <Scissors className="w-4 h-4 text-amber-400" />
            <span>Imprimir Todas as 3 Vias (3 Folhas Destacadas)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
