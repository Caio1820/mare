import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  Search,
  TrendingUp,
  ShoppingBag,
  UtensilsCrossed,
  CreditCard,
  Award,
  Receipt,
  Cloud,
  HardDrive,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Ban,
} from 'lucide-react';
import { Order, OrderConsumptionFilter, ReportPeriodType } from '../types';
import { fetchReportOrders, partitionOrderItems, resetAllOrderHistory } from '../utils/kdsStore';
import {
  computeOrdersReport,
  exportOrdersReportCsv,
  formatCurrencyBRL,
  formatPeriodLabel,
  getCurrentMonthInputValue,
  getDayBounds,
  getMonthBounds,
  getPaymentMethodLabel,
  getPreviousMonthInputValue,
  getTodayDateInputValue,
  getYesterdayDateInputValue,
} from '../utils/reportAnalytics';
import { playTouchSound } from '../utils/sound';
import { printCashClosingThermal, printThermalReport } from './ThermalReceipt';

interface KitchenReportViewProps {
  onPrintOrder: (order: Order) => void;
}

type ReportSectionTab = 'vendas' | 'fechamento';

export const KitchenReportView: React.FC<KitchenReportViewProps> = ({ onPrintOrder }) => {
  const [sectionTab, setSectionTab] = useState<ReportSectionTab>('vendas');
  const [periodType, setPeriodType] = useState<ReportPeriodType>('day');
  const [selectedDay, setSelectedDay] = useState<string>(getTodayDateInputValue);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthInputValue);
  const [consumptionFilter, setConsumptionFilter] = useState<OrderConsumptionFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [operatorNote, setOperatorNote] = useState<string>('');

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [syncSources, setSyncSources] = useState<{
    firestore: boolean;
    server: boolean;
    local: boolean;
  }>({ firestore: false, server: false, local: true });

  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [resetPassword, setResetPassword] = useState<string>('');
  const [showResetPassword, setShowResetPassword] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string>('');
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const periodKey = periodType === 'day' ? selectedDay : selectedMonth;
  const periodLabel = useMemo(
    () => formatPeriodLabel(periodType, periodKey),
    [periodType, periodKey]
  );

  const loadReportData = useCallback(async () => {
    setIsLoading(true);
    try {
      const bounds =
        periodType === 'day' ? getDayBounds(selectedDay) : getMonthBounds(selectedMonth);
      const res = await fetchReportOrders(bounds.startMs, bounds.endMs);
      setOrders(res.orders);
      setSyncSources(res.sources);
    } finally {
      setIsLoading(false);
    }
  }, [periodType, selectedDay, selectedMonth]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((ord) => {
      if (consumptionFilter === 'local' && ord.orderType !== 'local') return false;
      if (consumptionFilter === 'viagem' && ord.orderType !== 'viagem') {
        const { takeawayItems } = partitionOrderItems(ord);
        if (takeawayItems.length === 0) return false;
      }

      if (q) {
        const matchNumber = (ord.orderNumber || '').toLowerCase().includes(q);
        const matchName = (ord.customerName || '').toLowerCase().includes(q);
        const matchTable = (ord.tableNumber || '').toLowerCase().includes(q);
        if (!matchNumber && !matchName && !matchTable) return false;
      }
      return true;
    });
  }, [orders, consumptionFilter, searchQuery]);

  const summary = useMemo(
    () => computeOrdersReport(filteredOrders, periodType, periodKey),
    [filteredOrders, periodType, periodKey]
  );

  const maxTimelineRevenue = useMemo(() => {
    return summary.timelineBreakdown.reduce((max, row) => Math.max(max, row.totalRevenue), 0);
  }, [summary.timelineBreakdown]);

  const handleExportCsv = () => {
    playTouchSound(580);
    exportOrdersReportCsv(filteredOrders, summary, periodLabel);
  };

  const handlePrintThermal = () => {
    playTouchSound(580);
    if (sectionTab === 'fechamento') {
      printCashClosingThermal(summary, periodLabel, operatorNote);
    } else {
      printThermalReport(summary, periodLabel);
    }
  };

  const handlePrintCashClosing = () => {
    playTouchSound(580);
    printCashClosingThermal(summary, periodLabel, operatorNote);
  };

  const handleOpenResetModal = () => {
    playTouchSound(460);
    setResetPassword('');
    setResetError('');
    setShowResetPassword(false);
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassword.trim()) {
      setResetError('Digite a senha de administrador para confirmar.');
      return;
    }

    setIsResetting(true);
    setResetError('');
    try {
      const result = await resetAllOrderHistory(resetPassword);
      if (!result.ok) {
        setResetError(result.error || 'Senha incorreta.');
        return;
      }

      playTouchSound(620);
      setIsResetModalOpen(false);
      setResetPassword('');
      setResetSuccessMessage(
        'Histórico de testes zerado (nuvem, servidor e navegador). Próxima senha iniciará em #001.'
      );
      await loadReportData();
      setTimeout(() => setResetSuccessMessage(null), 8000);
    } catch {
      setResetError('Erro ao limpar histórico. Tente novamente.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6 pb-safe">
      {resetSuccessMessage && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl px-4 py-3 text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{resetSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setResetSuccessMessage(null)}
            className="text-emerald-300/70 hover:text-emerald-100 p-1"
            aria-label="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* Top Filter & Action Toolbar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 sm:p-5 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <BarChart3 className="w-5 h-5 text-amber-400 shrink-0" />
              <h2 className="font-display text-lg sm:text-xl font-bold uppercase tracking-wide text-zinc-100">
                Controle de Pedidos · {periodLabel}
              </h2>
            </div>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-400 flex-wrap">
              <span className="inline-flex items-center gap-1">
                {syncSources.firestore ? (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Nuvem Firestore + Local</span>
                  </>
                ) : (
                  <>
                    <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-300 font-medium">
                      Histórico Local{syncSources.server ? ' + Servidor' : ' (Offline)'}
                    </span>
                  </>
                )}
              </span>
              <span>•</span>
              <span>Pedidos limpos da fila e mesas fechadas permanecem salvos aqui.</span>
            </div>
          </div>

          {/* Primary Output Actions */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => {
                playTouchSound(520);
                loadReportData();
              }}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[44px] active:scale-95 transition-all"
              title="Atualizar dados do relatório"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Atualizar</span>
            </button>

            <button
              onClick={handlePrintThermal}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[44px] active:scale-95 transition-all shadow-md shadow-amber-500/15"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>
                {sectionTab === 'fechamento'
                  ? 'Imprimir Fechamento (80mm)'
                  : periodType === 'day'
                  ? 'Imprimir Relatório (Dia)'
                  : 'Imprimir Relatório (Mês)'}
              </span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[44px] active:scale-95 transition-all"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Exportar CSV</span>
            </button>

            <button
              type="button"
              onClick={handleOpenResetModal}
              className="px-3 py-2 rounded-xl bg-red-950/45 hover:bg-red-900/65 text-red-300 hover:text-red-100 border border-red-800/60 hover:border-red-500/70 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[44px] active:scale-95 transition-all"
              title="Zerar histórico de pedidos e reiniciar senhas em #001 (requer senha)"
            >
              <Trash2 className="w-4 h-4 shrink-0 text-red-400" />
              <span>Zerar Histórico</span>
            </button>
          </div>
        </div>

        {/* Sub-navigation: Vendas (Dia/Mês) vs Fechamento de Caixa */}
        <div className="flex items-center gap-2 pt-1">
          <div className="inline-flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                playTouchSound(520);
                setSectionTab('vendas');
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all min-h-[38px] ${
                sectionTab === 'vendas'
                  ? 'bg-zinc-800 text-amber-400 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span>Vendas (Dia / Mês)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playTouchSound(520);
                setSectionTab('fechamento');
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all min-h-[38px] ${
                sectionTab === 'fechamento'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 shrink-0" />
              <span>Fechamento de Caixa</span>
            </button>
          </div>
        </div>

        {/* Period & Filter Controls */}
        <div className="pt-3 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
          {/* Mode Switcher: Dia / Mês */}
          <div className="md:col-span-3 flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => {
                playTouchSound(520);
                setPeriodType('day');
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all min-h-[38px] ${
                periodType === 'day'
                  ? 'bg-amber-500 text-zinc-950'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Por Dia
            </button>
            <button
              onClick={() => {
                playTouchSound(520);
                setPeriodType('month');
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all min-h-[38px] ${
                periodType === 'month'
                  ? 'bg-amber-500 text-zinc-950'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Por Mês
            </button>
          </div>

          {/* Native Date / Month Picker + Quick Shortcuts */}
          <div className="md:col-span-4 flex items-center gap-1.5">
            <div className="relative flex-1">
              <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {periodType === 'day' ? (
                <input
                  type="date"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value || getTodayDateInputValue())}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-100 font-mono focus:outline-none min-h-[44px]"
                />
              ) : (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value || getCurrentMonthInputValue())}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-100 font-mono focus:outline-none min-h-[44px]"
                />
              )}
            </div>

            {periodType === 'day' ? (
              <>
                <button
                  onClick={() => {
                    playTouchSound(500);
                    setSelectedDay(getTodayDateInputValue());
                  }}
                  className={`px-2.5 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap min-h-[44px] ${
                    selectedDay === getTodayDateInputValue()
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Hoje
                </button>
                <button
                  onClick={() => {
                    playTouchSound(500);
                    setSelectedDay(getYesterdayDateInputValue());
                  }}
                  className={`px-2.5 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap min-h-[44px] ${
                    selectedDay === getYesterdayDateInputValue()
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Ontem
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    playTouchSound(500);
                    setSelectedMonth(getCurrentMonthInputValue());
                  }}
                  className={`px-2.5 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap min-h-[44px] ${
                    selectedMonth === getCurrentMonthInputValue()
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Este Mês
                </button>
                <button
                  onClick={() => {
                    playTouchSound(500);
                    setSelectedMonth(getPreviousMonthInputValue());
                  }}
                  className={`px-2.5 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap min-h-[44px] ${
                    selectedMonth === getPreviousMonthInputValue()
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Mês Passado
                </button>
              </>
            )}
          </div>

          {/* Consumption Filter + Search */}
          <div className="md:col-span-5 flex flex-col sm:flex-row gap-2">
            <select
              value={consumptionFilter}
              onChange={(e) => setConsumptionFilter(e.target.value as OrderConsumptionFilter)}
              className="bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-zinc-100 font-semibold focus:outline-none min-h-[44px]"
              aria-label="Filtrar por modalidade"
            >
              <option value="all">Todas Modalidades</option>
              <option value="local">Salão / Mesas</option>
              <option value="viagem">Contém Viagem</option>
            </select>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar #senha, cliente ou mesa..."
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none min-h-[44px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading Skeleton State */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 h-28 animate-pulse"
              />
            ))}
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 h-64 animate-pulse" />
        </div>
      ) : sectionTab === 'fechamento' ? (
        <div className="space-y-4 sm:space-y-6">
          {/* 3 Cash Closing KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-zinc-900 border border-emerald-500/35 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Total Recebido (Pago)
                </span>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              </div>
              <div className="font-mono tabular-nums text-2xl sm:text-3xl font-black text-emerald-400">
                {formatCurrencyBRL(summary.paidRevenue)}
              </div>
              <div className="text-xs text-zinc-400">
                Valores já quitados no caixa / PIX / mesas fechadas
              </div>
            </div>

            <div className="bg-zinc-900 border border-amber-500/35 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between text-amber-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Em Aberto (Mesas / Caixa)
                </span>
                <Wallet className="w-4 h-4 shrink-0" />
              </div>
              <div className="font-mono tabular-nums text-2xl sm:text-3xl font-black text-amber-400">
                {formatCurrencyBRL(summary.pendingRevenue)}
              </div>
              <div className="text-xs text-zinc-400">
                Pedidos válidos aguardando acerto no balcão
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Faturamento Válido
                </span>
                <TrendingUp className="w-4 h-4 text-sky-400 shrink-0" />
              </div>
              <div className="font-mono tabular-nums text-2xl sm:text-3xl font-black text-zinc-100">
                {formatCurrencyBRL(summary.totalRevenue)}
              </div>
              <div className="text-xs text-zinc-400 font-mono tabular-nums">
                {summary.totalOrders} pedidos válidos · Ticket {formatCurrencyBRL(summary.averageTicket)}
              </div>
            </div>
          </div>

          {/* Cancelled Orders Audit Banner */}
          {summary.cancelledOrdersCount > 0 && (
            <div className="bg-red-950/30 border border-red-800/50 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-red-200">
              <div className="flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  <strong>{summary.cancelledOrdersCount}</strong>{' '}
                  {summary.cancelledOrdersCount === 1
                    ? 'pedido cancelado na cozinha'
                    : 'pedidos cancelados na cozinha'}{' '}
                  no período (excluídos automaticamente do fechamento de caixa).
                </span>
              </div>
              <span className="font-mono tabular-nums font-bold text-red-300">
                Valor cancelado: {formatCurrencyBRL(summary.cancelledTotal)}
              </span>
            </div>
          )}

          {/* Breakdown Table by Payment Method */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <h3 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-zinc-100">
                  Conferência por Forma de Pagamento · {periodLabel}
                </h3>
              </div>
              <span className="text-xs font-mono tabular-nums text-zinc-400">
                {summary.totalOrders} pedidos válidos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950/70 border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400 font-bold">
                    <th className="py-3 px-4">Forma de Pagamento</th>
                    <th className="py-3 px-4 text-right">Qtd</th>
                    <th className="py-3 px-4 text-right">Recebido (Pago)</th>
                    <th className="py-3 px-4 text-right">Em Aberto</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-xs sm:text-sm font-mono tabular-nums">
                  {summary.paymentBreakdown.map((pm) => (
                    <tr key={pm.method} className="hover:bg-zinc-800/30">
                      <td className="py-3 px-4 font-sans font-bold text-zinc-100">{pm.label}</td>
                      <td className="py-3 px-4 text-right text-zinc-300">{pm.count}</td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                        {formatCurrencyBRL(pm.paidTotal)}
                      </td>
                      <td className="py-3 px-4 text-right text-amber-400 font-semibold">
                        {formatCurrencyBRL(pm.pendingTotal)}
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-100 font-black">
                        {formatCurrencyBRL(pm.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-950/90 border-t-2 border-zinc-700 text-xs sm:text-sm font-mono tabular-nums font-black">
                    <td className="py-3.5 px-4 font-sans uppercase text-zinc-200">Total Geral</td>
                    <td className="py-3.5 px-4 text-right text-zinc-200">{summary.totalOrders}</td>
                    <td className="py-3.5 px-4 text-right text-emerald-400">
                      {formatCurrencyBRL(summary.paidRevenue)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-amber-400">
                      {formatCurrencyBRL(summary.pendingRevenue)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-zinc-100">
                      {formatCurrencyBRL(summary.totalRevenue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Operator Notes + 80mm Cash Closing Print Action */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Observação do Fechamento (Opcional · Sai no cupom 80mm)
              </label>
              <input
                type="text"
                value={operatorNote}
                onChange={(e) => setOperatorNote(e.target.value)}
                maxLength={140}
                placeholder="Ex: Fundo de troco R$ 150,00 · Turno Noite conferido por..."
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none min-h-[44px]"
              />
            </div>

            <button
              type="button"
              onClick={handlePrintCashClosing}
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-display font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 whitespace-nowrap shrink-0 min-h-[48px] active:scale-95 transition-all shadow-lg shadow-amber-500/20"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Imprimir Fechamento de Caixa (80mm)</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 4 KPI Cards (Flat Single-Elevation, Tabular Numerals) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Faturamento Total
                </span>
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
              <div className="font-mono tabular-nums text-xl sm:text-2xl font-black text-emerald-400">
                {formatCurrencyBRL(summary.totalRevenue)}
              </div>
              <div className="text-[11px] text-zinc-400 font-mono tabular-nums flex flex-wrap gap-x-2">
                <span>Pago: {formatCurrencyBRL(summary.paidRevenue)}</span>
                {summary.pendingRevenue > 0 && (
                  <span className="text-amber-400">
                    Aberto: {formatCurrencyBRL(summary.pendingRevenue)}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Total de Pedidos
                </span>
                <Receipt className="w-4 h-4 text-amber-400 shrink-0" />
              </div>
              <div className="font-mono tabular-nums text-xl sm:text-2xl font-black text-zinc-100">
                {summary.totalOrders}
              </div>
              <div className="text-[11px] text-zinc-400 font-mono tabular-nums">
                {summary.localOrdersCount} Salão/Mesa · {summary.viagemOrdersCount} Viagem
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Ticket Médio
                </span>
                <CreditCard className="w-4 h-4 text-sky-400 shrink-0" />
              </div>
              <div className="font-mono tabular-nums text-xl sm:text-2xl font-black text-zinc-100">
                {formatCurrencyBRL(summary.averageTicket)}
              </div>
              <div className="text-[11px] text-zinc-400">Valor médio por pedido</div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Itens Vendidos
                </span>
                <UtensilsCrossed className="w-4 h-4 text-orange-400 shrink-0" />
              </div>
              <div className="font-mono tabular-nums text-xl sm:text-2xl font-black text-zinc-100">
                {summary.totalItemsCount} <span className="text-sm font-semibold text-zinc-400">un</span>
              </div>
              <div className="text-[11px] text-zinc-400 font-mono tabular-nums">
                {summary.localItemsCount} Mesa · {summary.takeawayItemsCount} Viagem
              </div>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            /* Empty State */
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 sm:p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-amber-400 flex items-center justify-center mx-auto">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-zinc-100">
                Nenhum pedido encontrado em {periodLabel}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                Assim que pedidos forem realizados no totem, celular ou balcão neste período, o faturamento, os itens mais vendidos e os detalhes aparecerão aqui automaticamente.
              </p>
              {(consumptionFilter !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setConsumptionFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs uppercase tracking-wider"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Payment Methods + Top Selling Items */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Payment Breakdown */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      <h3 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-zinc-100">
                        Formas de Pagamento
                      </h3>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-zinc-400">
                      {summary.totalOrders} pedidos
                    </span>
                  </div>

                  <div className="space-y-3">
                    {summary.paymentBreakdown.map((pm) => (
                      <div key={pm.method} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-100">{pm.label}</span>
                            <span className="text-[11px] font-mono tabular-nums text-zinc-400">
                              ({pm.count} {pm.count === 1 ? 'pedido' : 'pedidos'})
                            </span>
                          </div>
                          <div className="font-mono tabular-nums text-right">
                            <span className="font-bold text-zinc-100">
                              {formatCurrencyBRL(pm.total)}
                            </span>
                            <span className="text-[11px] text-zinc-400 ml-2">
                              {pm.percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(pm.total > 0 ? 4 : 0, pm.percentage))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Products */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      <h3 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-zinc-100">
                        Top Itens Mais Vendidos
                      </h3>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-zinc-400">
                      {summary.topProducts.length} produtos
                    </span>
                  </div>

                  <div className="divide-y divide-zinc-800/80 max-h-[280px] overflow-y-auto pr-1">
                    {summary.topProducts.slice(0, 12).map((prod, idx) => (
                      <div
                        key={prod.productId}
                        className="py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                              idx === 0
                                ? 'bg-amber-500 text-zinc-950'
                                : idx === 1
                                ? 'bg-zinc-700 text-zinc-100'
                                : idx === 2
                                ? 'bg-orange-900/60 text-orange-300'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-zinc-100 truncate">{prod.name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                          <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-amber-300 font-bold text-xs">
                            {prod.quantity}x
                          </span>
                          <span className="font-bold text-emerald-400 w-20 text-right">
                            {formatCurrencyBRL(prod.revenue)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Monthly Daily Timeline / Day Hourly Timeline */}
              {summary.timelineBreakdown.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <h3 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-zinc-100">
                      {periodType === 'month'
                        ? 'Movimento Diário no Mês (clique no dia para detalhar)'
                        : 'Movimento por Horário do Dia'}
                    </h3>
                    <span className="text-xs font-mono text-zinc-400">
                      {summary.timelineBreakdown.length}{' '}
                      {periodType === 'month' ? 'dias com vendas' : 'faixas de horário'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {summary.timelineBreakdown.map((row) => {
                      const pct =
                        maxTimelineRevenue > 0
                          ? (row.totalRevenue / maxTimelineRevenue) * 100
                          : 0;
                      const isClickableDay = periodType === 'month';
                      return (
                        <button
                          key={row.key}
                          type="button"
                          disabled={!isClickableDay}
                          onClick={() => {
                            if (isClickableDay) {
                              playTouchSound(520);
                              setSelectedDay(row.key);
                              setPeriodType('day');
                            }
                          }}
                          className={`text-left p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5 ${
                            isClickableDay
                              ? 'hover:border-amber-500/50 cursor-pointer transition-colors'
                              : 'cursor-default'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                            <span className="font-bold text-zinc-200">{row.label}</span>
                            <span className="text-zinc-400">
                              {row.orderCount} {row.orderCount === 1 ? 'ped.' : 'peds.'}
                            </span>
                            <span className="font-bold text-emerald-400">
                              {formatCurrencyBRL(row.totalRevenue)}
                            </span>
                          </div>
                          <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.max(4, pct)}%` }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Detailed Orders History Table / Mobile Cards */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                    <h3 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-zinc-100">
                      Histórico Detalhado de Pedidos
                    </h3>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-zinc-400">
                    {filteredOrders.length} registros
                  </span>
                </div>

                {/* Desktop Data Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-950/70 border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400 font-bold">
                        <th className="py-3 px-4">Senha / Hora</th>
                        <th className="py-3 px-4">Cliente & Local</th>
                        <th className="py-3 px-4">Itens do Pedido</th>
                        <th className="py-3 px-4">Pagamento</th>
                        <th className="py-3 px-4 text-right">Valor</th>
                        <th className="py-3 px-4 text-right">Comanda</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/80 text-xs">
                      {filteredOrders.map((ord) => {
                        const dt = new Date(ord.createdAt || Date.now());
                        const dateStr = dt.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                        });
                        const timeStr =
                          ord.formattedTime ||
                          dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                        const { takeawayItems } = partitionOrderItems(ord);
                        const isCancelled = ord.status === 'cancelado';
                        const isPaid = ord.paymentStatus === 'pago' || !!ord.tableClosed;
                        const locLabel =
                          ord.orderType === 'viagem'
                            ? 'Viagem'
                            : ord.tableNumber
                            ? `Mesa ${ord.tableNumber}${takeawayItems.length > 0 ? ' + Viagem' : ''}`
                            : 'Salão';

                        return (
                          <tr
                            key={ord.id}
                            className={`transition-colors ${
                              isCancelled ? 'bg-red-950/15 opacity-75' : 'hover:bg-zinc-800/40'
                            }`}
                          >
                            <td className="py-2.5 px-4 font-mono tabular-nums whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`font-black text-sm ${
                                    isCancelled ? 'text-red-400 line-through' : 'text-amber-400'
                                  }`}
                                >
                                  {ord.orderNumber}
                                </span>
                                {isCancelled && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/30 text-[10px] font-bold uppercase text-red-400">
                                    <Ban className="w-2.5 h-2.5" />
                                    Cancelado
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-400">
                                {dateStr} · {timeStr}
                              </div>
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="font-bold text-zinc-100 truncate max-w-[180px]">
                                {ord.customerName}
                              </div>
                              <div className="text-[11px] text-zinc-400">{locLabel}</div>
                            </td>
                            <td className="py-2.5 px-4 text-zinc-300 max-w-[300px]">
                              <div className="line-clamp-2">
                                {(ord.items || [])
                                  .map(
                                    (it) =>
                                      `${it.quantity}x ${it.product?.name || 'Item'}${
                                        it.isTakeaway ? ' (Viagem)' : ''
                                      }`
                                  )
                                  .join(', ')}
                              </div>
                              {isCancelled && ord.cancelReason && (
                                <div className="text-[11px] text-red-400 mt-0.5">
                                  Motivo: {ord.cancelReason}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-4 whitespace-nowrap">
                              <div className="font-semibold text-zinc-200">
                                {getPaymentMethodLabel(ord.paymentMethod)}
                              </div>
                              {isCancelled ? (
                                <span className="text-[10px] font-bold uppercase text-red-400">
                                  Excluído do caixa
                                </span>
                              ) : (
                                <span
                                  className={`text-[10px] font-bold uppercase ${
                                    isPaid ? 'text-emerald-400' : 'text-amber-400'
                                  }`}
                                >
                                  {isPaid ? 'Pago' : 'Em Aberto'}
                                </span>
                              )}
                            </td>
                            <td
                              className={`py-2.5 px-4 text-right font-mono tabular-nums font-bold whitespace-nowrap ${
                                isCancelled ? 'text-red-400 line-through' : 'text-zinc-100'
                              }`}
                            >
                              {formatCurrencyBRL(ord.total)}
                            </td>
                            <td className="py-2.5 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => {
                                  playTouchSound(520);
                                  onPrintOrder(ord);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[11px] font-mono inline-flex items-center gap-1"
                              >
                                <Printer className="w-3.5 h-3.5 text-amber-400" />
                                <span>Ver</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards List */}
                <div className="md:hidden divide-y divide-zinc-800">
                  {filteredOrders.map((ord) => {
                    const dt = new Date(ord.createdAt || Date.now());
                    const dateStr = dt.toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                    });
                    const timeStr =
                      ord.formattedTime ||
                      dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const { takeawayItems } = partitionOrderItems(ord);
                    const isCancelled = ord.status === 'cancelado';
                    const isPaid = ord.paymentStatus === 'pago' || !!ord.tableClosed;
                    const locLabel =
                      ord.orderType === 'viagem'
                        ? 'Viagem'
                        : ord.tableNumber
                        ? `Mesa ${ord.tableNumber}${takeawayItems.length > 0 ? ' + Viagem' : ''}`
                        : 'Salão';

                    return (
                      <div key={ord.id} className={`p-3.5 space-y-2 ${isCancelled ? 'bg-red-950/15 opacity-75' : ''}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`font-mono font-black text-base ${
                                  isCancelled ? 'text-red-400 line-through' : 'text-amber-400'
                                }`}
                              >
                                {ord.orderNumber}
                              </span>
                              <span className="font-bold text-sm text-zinc-100 truncate">
                                {ord.customerName}
                              </span>
                              {isCancelled && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/30 text-[10px] font-bold uppercase text-red-400">
                                  <Ban className="w-2.5 h-2.5" />
                                  Cancelado
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono">
                              {dateStr} · {timeStr} · {locLabel}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div
                              className={`font-mono tabular-nums font-black text-sm ${
                                isCancelled ? 'text-red-400 line-through' : 'text-emerald-400'
                              }`}
                            >
                              {formatCurrencyBRL(ord.total)}
                            </div>
                            <div
                              className={`text-[10px] font-bold uppercase ${
                                isCancelled
                                  ? 'text-red-400'
                                  : isPaid
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                              }`}
                            >
                              {getPaymentMethodLabel(ord.paymentMethod)} ·{' '}
                              {isCancelled ? 'Cancelado' : isPaid ? 'Pago' : 'Em Aberto'}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-zinc-300">
                          {(ord.items || [])
                            .map(
                              (it) =>
                                `${it.quantity}x ${it.product?.name || 'Item'}${
                                  it.isTakeaway ? ' (Viagem)' : ''
                                }`
                            )
                            .join(', ')}
                          {isCancelled && ord.cancelReason && (
                            <div className="text-[11px] text-red-400 mt-0.5">
                              Motivo: {ord.cancelReason}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              playTouchSound(520);
                              onPrintOrder(ord);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-mono inline-flex items-center gap-1.5 min-h-[36px]"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-400" />
                            <span>Ver Comanda</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Password-Protected Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold uppercase text-zinc-100">
                    Zerar Histórico de Pedidos
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Confirmação com senha de administrador
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-950/35 border border-red-800/50 text-xs text-red-200 space-y-1.5 leading-relaxed">
              <p className="font-bold text-red-300">
                Atenção: esta ação é irreversível.
              </p>
              <p>
                Todos os pedidos salvos na <strong>nuvem (Firestore)</strong>, no{' '}
                <strong>servidor local</strong> e no <strong>navegador</strong> serão apagados e a numeração diária voltará para <strong>#001</strong>.
              </p>
            </div>

            <form onSubmit={handleConfirmReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Senha de Administrador:
                </label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={resetPassword}
                    onChange={(e) => {
                      setResetPassword(e.target.value);
                      if (resetError) setResetError('');
                    }}
                    placeholder="Digite a senha..."
                    autoFocus
                    autoComplete="off"
                    className={`w-full bg-zinc-950 border rounded-xl pl-3.5 pr-11 py-3 text-sm text-zinc-100 font-mono tracking-widest focus:outline-none ${
                      resetError
                        ? 'border-red-500 ring-2 ring-red-500/20'
                        : 'border-zinc-700 focus:border-amber-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                    title={showResetPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showResetPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {resetError && (
                  <div className="mt-2 text-xs text-red-400 font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  disabled={isResetting}
                  className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isResetting || !resetPassword.trim()}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-display font-bold text-xs uppercase tracking-wider min-h-[44px]"
                >
                  {isResetting ? 'Limpando...' : 'Zerar Tudo Agora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
