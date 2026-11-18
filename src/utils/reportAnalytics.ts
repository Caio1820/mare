import {
  Order,
  OrdersReportSummary,
  PaymentBreakdownStat,
  PaymentMethod,
  PeriodBreakdownRow,
  ReportPeriodType,
  TopProductStat,
} from '../types';
import { partitionOrderItems } from './kdsStore';

export function getTodayDateInputValue(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getYesterdayDateInputValue(): string {
  const dt = new Date();
  dt.setDate(dt.getDate() - 1);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentMonthInputValue(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getPreviousMonthInputValue(): string {
  const dt = new Date();
  dt.setDate(1);
  dt.setMonth(dt.getMonth() - 1);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getDayBounds(dateStr: string): { startMs: number; endMs: number } {
  const parts = dateStr.split('-').map(Number);
  const y = parts[0] || new Date().getFullYear();
  const m = (parts[1] || 1) - 1;
  const d = parts[2] || 1;
  const start = new Date(y, m, d, 0, 0, 0, 0).getTime();
  const end = new Date(y, m, d, 23, 59, 59, 999).getTime();
  return { startMs: start, endMs: end };
}

export function getMonthBounds(monthStr: string): { startMs: number; endMs: number } {
  const parts = monthStr.split('-').map(Number);
  const y = parts[0] || new Date().getFullYear();
  const m = (parts[1] || 1) - 1;
  const start = new Date(y, m, 1, 0, 0, 0, 0).getTime();
  const end = new Date(y, m + 1, 0, 23, 59, 59, 999).getTime();
  return { startMs: start, endMs: end };
}

export function formatPeriodLabel(periodType: ReportPeriodType, periodKey: string): string {
  if (periodType === 'day') {
    const [y, m, d] = periodKey.split('-');
    if (y && m && d) return `${d}/${m}/${y}`;
    return periodKey;
  }
  const [y, m] = periodKey.split('-');
  if (y && m) {
    const monthNames = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    const monthIdx = Math.max(0, Math.min(11, Number(m) - 1));
    return `${monthNames[monthIdx]} de ${y}`;
  }
  return periodKey;
}

export function formatCurrencyBRL(value: number): string {
  return `R$ ${(Number(value) || 0).toFixed(2).replace('.', ',')}`;
}

export function getPaymentMethodLabel(method?: PaymentMethod | string): string {
  switch (method) {
    case 'pix':
      return 'PIX';
    case 'cartao_balcao':
      return 'Cartão';
    case 'dinheiro_balcao':
      return 'Dinheiro';
    case 'balcao':
    default:
      return 'Balcão / Mesa';
  }
}

export function computeOrdersReport(
  orders: Order[],
  periodType: ReportPeriodType,
  periodKey: string
): OrdersReportSummary {
  let totalRevenue = 0;
  let paidRevenue = 0;
  let pendingRevenue = 0;
  let cancelledOrdersCount = 0;
  let cancelledTotal = 0;
  let localOrdersCount = 0;
  let viagemOrdersCount = 0;
  let mixedOrdersCount = 0;
  let totalItemsCount = 0;
  let localItemsCount = 0;
  let takeawayItemsCount = 0;

  const paymentMap = new Map<
    PaymentMethod,
    { count: number; total: number; paidTotal: number; pendingTotal: number }
  >([
    ['pix', { count: 0, total: 0, paidTotal: 0, pendingTotal: 0 }],
    ['cartao_balcao', { count: 0, total: 0, paidTotal: 0, pendingTotal: 0 }],
    ['dinheiro_balcao', { count: 0, total: 0, paidTotal: 0, pendingTotal: 0 }],
    ['balcao', { count: 0, total: 0, paidTotal: 0, pendingTotal: 0 }],
  ]);

  const productMap = new Map<
    string,
    { productId: string; name: string; quantity: number; revenue: number }
  >();

  const timelineMap = new Map<string, PeriodBreakdownRow>();

  const validOrders: Order[] = [];

  for (const order of orders) {
    const orderTotal = Number(order.total) || 0;

    if (order.status === 'cancelado') {
      cancelledOrdersCount += 1;
      cancelledTotal += orderTotal;
      continue;
    }

    validOrders.push(order);
    totalRevenue += orderTotal;

    const isPaid = order.paymentStatus === 'pago' || !!order.tableClosed;
    if (isPaid) {
      paidRevenue += orderTotal;
    } else {
      pendingRevenue += orderTotal;
    }

    const { localItems, takeawayItems, hasMixedConsumption } = partitionOrderItems(order);
    if (order.orderType === 'viagem') {
      viagemOrdersCount += 1;
    } else if (hasMixedConsumption || takeawayItems.length > 0) {
      mixedOrdersCount += 1;
      localOrdersCount += 1;
    } else {
      localOrdersCount += 1;
    }

    const localQty = localItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
    const takeawayQty = takeawayItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
    localItemsCount += localQty;
    takeawayItemsCount += takeawayQty;
    totalItemsCount += localQty + takeawayQty;

    const pm: PaymentMethod =
      order.paymentMethod === 'pix' ||
      order.paymentMethod === 'cartao_balcao' ||
      order.paymentMethod === 'dinheiro_balcao' ||
      order.paymentMethod === 'balcao'
        ? order.paymentMethod
        : 'balcao';

    const pmEntry = paymentMap.get(pm) || { count: 0, total: 0, paidTotal: 0, pendingTotal: 0 };
    pmEntry.count += 1;
    pmEntry.total += orderTotal;
    if (isPaid) {
      pmEntry.paidTotal += orderTotal;
    } else {
      pmEntry.pendingTotal += orderTotal;
    }
    paymentMap.set(pm, pmEntry);

    for (const item of order.items || []) {
      const qty = Number(item.quantity) || 1;
      const itemRev = Number(item.totalPrice) || 0;
      const prodId = item.product?.id || item.product?.name || 'item';
      const prodName = item.product?.name || 'Item Personalizado';
      const existing = productMap.get(prodId) || {
        productId: prodId,
        name: prodName,
        quantity: 0,
        revenue: 0,
      };
      existing.quantity += qty;
      existing.revenue += itemRev;
      productMap.set(prodId, existing);
    }

    const dt = new Date(order.createdAt || Date.now());
    if (periodType === 'month') {
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${d}`;
      const label = `${d}/${m}`;
      const row = timelineMap.get(key) || { key, label, orderCount: 0, totalRevenue: 0 };
      row.orderCount += 1;
      row.totalRevenue += orderTotal;
      timelineMap.set(key, row);
    } else {
      const hh = String(dt.getHours()).padStart(2, '0');
      const key = hh;
      const label = `${hh}h`;
      const row = timelineMap.get(key) || { key, label, orderCount: 0, totalRevenue: 0 };
      row.orderCount += 1;
      row.totalRevenue += orderTotal;
      timelineMap.set(key, row);
    }
  }

  const totalOrders = validOrders.length;
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const paymentBreakdown: PaymentBreakdownStat[] = Array.from(paymentMap.entries())
    .map(([method, data]) => ({
      method,
      label: getPaymentMethodLabel(method),
      count: data.count,
      total: data.total,
      paidTotal: data.paidTotal,
      pendingTotal: data.pendingTotal,
      percentage: totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const topProducts: TopProductStat[] = Array.from(productMap.values())
    .map((p) => ({
      ...p,
      percentage: totalItemsCount > 0 ? (p.quantity / totalItemsCount) * 100 : 0,
    }))
    .sort((a, b) => {
      if (b.quantity !== a.quantity) return b.quantity - a.quantity;
      return b.revenue - a.revenue;
    });

  const timelineBreakdown: PeriodBreakdownRow[] = Array.from(timelineMap.values()).sort((a, b) =>
    a.key.localeCompare(b.key)
  );

  return {
    periodType,
    periodKey,
    totalRevenue,
    paidRevenue,
    pendingRevenue,
    totalOrders,
    cancelledOrdersCount,
    cancelledTotal,
    localOrdersCount,
    viagemOrdersCount,
    mixedOrdersCount,
    averageTicket,
    totalItemsCount,
    localItemsCount,
    takeawayItemsCount,
    paymentBreakdown,
    topProducts,
    timelineBreakdown,
  };
}

function escapeCsvField(val: string | number): string {
  const str = String(val ?? '');
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportOrdersReportCsv(
  orders: Order[],
  summary: OrdersReportSummary,
  periodLabel: string
): void {
  const lines: string[] = [];

  lines.push(`RELATORIO MARE HAMBURGUERIA;${escapeCsvField(periodLabel)}`);
  lines.push(
    `Pedidos Validos;${summary.totalOrders};Faturamento Total;${summary.totalRevenue
      .toFixed(2)
      .replace('.', ',')};Ticket Medio;${summary.averageTicket
      .toFixed(2)
      .replace('.', ',')};Cancelados;${summary.cancelledOrdersCount}`
  );
  lines.push('');
  lines.push(
    [
      'Data',
      'Hora',
      'Senha',
      'Cliente',
      'Modalidade',
      'Mesa',
      'Itens',
      'Qtd Total',
      'Pagamento',
      'Status Pagamento',
      'Status Preparo',
      'Total (R$)',
    ]
      .map(escapeCsvField)
      .join(';')
  );

  for (const ord of orders) {
    const dt = new Date(ord.createdAt || Date.now());
    const dateStr = dt.toLocaleDateString('pt-BR');
    const timeStr =
      ord.formattedTime ||
      dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const { takeawayItems } = partitionOrderItems(ord);
    const modalidade =
      ord.orderType === 'viagem'
        ? 'Viagem'
        : takeawayItems.length > 0
        ? 'Mesa + Viagem'
        : 'Consumo na Mesa';
    const mesa = ord.orderType === 'local' ? ord.tableNumber || 'Balcao' : '-';
    const itensResumo = (ord.items || [])
      .map((it) => `${it.quantity}x ${it.product?.name || 'Item'}${it.isTakeaway ? ' (Viagem)' : ''}`)
      .join(' | ');
    const qtdTotal = (ord.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
    const pagamento = getPaymentMethodLabel(ord.paymentMethod);
    const statusPgto =
      ord.status === 'cancelado'
        ? 'Cancelado'
        : ord.paymentStatus === 'pago' || ord.tableClosed
        ? 'Pago'
        : 'Pendente';
    const statusPrep =
      ord.status === 'recebido'
        ? 'Recebido'
        : ord.status === 'preparo'
        ? 'Em Preparo'
        : ord.status === 'pronto'
        ? 'Pronto'
        : ord.status === 'cancelado'
        ? 'Cancelado'
        : 'Entregue';
    const valor = (Number(ord.total) || 0).toFixed(2).replace('.', ',');

    lines.push(
      [
        dateStr,
        timeStr,
        ord.orderNumber,
        ord.customerName,
        modalidade,
        mesa,
        itensResumo,
        qtdTotal,
        pagamento,
        statusPgto,
        statusPrep,
        valor,
      ]
        .map(escapeCsvField)
        .join(';')
    );
  }

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `relatorio-mare-${summary.periodKey}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
