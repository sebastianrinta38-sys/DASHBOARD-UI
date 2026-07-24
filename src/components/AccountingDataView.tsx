/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  PiggyBank, 
  TrendingUp, 
  Calendar, 
  Download, 
  HelpCircle, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Coins,
  Building2,
  Wrench
} from 'lucide-react';
import { Sale, AdCampaign, FilterState, CountryConfig } from '../types';
import { 
  CURRENCY_OPTIONS, 
  getActiveCurrencyConfig, 
  formatConvertedMoney 
} from '../lib/currency';

interface AccountingDataViewProps {
  sales: Sale[];
  campaigns: AdCampaign[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  countriesConfig?: Record<string, CountryConfig>;
}

const normalizeDateStr = (rawDate?: string): string => {
  if (!rawDate) return '';
  return rawDate.slice(0, 10);
};

export default function AccountingDataView({
  sales,
  campaigns,
  filters,
  setFilters,
  countriesConfig = {},
}: AccountingDataViewProps) {
  // Selected Reference Currency state (default: USD)
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');

  // Active currency metadata and conversion rate
  const activeCurrencyConfig = useMemo(() => {
    return getActiveCurrencyConfig(selectedCurrency, countriesConfig);
  }, [selectedCurrency, countriesConfig]);

  // Local date range state for Historical table initialized from global filters (defaulting to July 2026)
  const [localStartDate, setLocalStartDate] = useState<string>(filters.startDate || '2026-07-01');
  const [localEndDate, setLocalEndDate] = useState<string>(filters.endDate || '2026-07-31');

  // Today's date string (ISO YYYY-MM-DD in local time)
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Specific Day Selector for Main Card (defaults to Today)
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Selected Date formatted nicely (e.g. "Viernes, 24 de Julio 2026")
  const selectedDateFormattedText = useMemo(() => {
    if (!selectedDate) return '';
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, monthIdx, day);
      return dateObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return selectedDate;
  }, [selectedDate]);

  // Map of date -> total sales in USD (consolidado global, todos los países)
  const salesByDateMap = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach(sale => {
      const d = normalizeDateStr(sale.date);
      if (!d) return;
      const current = map.get(d) || 0;
      map.set(d, current + (Number(sale.amountUsd) || 0));
    });
    return map;
  }, [sales]);

  // Map of date -> total Meta spend in USD (consolidado global, todos los países)
  const spendByDateMap = useMemo(() => {
    const map = new Map<string, number>();
    campaigns.forEach(camp => {
      const d = normalizeDateStr(camp.fecha);
      if (!d) return;
      const current = map.get(d) || 0;
      map.set(d, current + (Number(camp.spend) || 0));
    });
    return map;
  }, [campaigns]);

  // ==========================================
  // VISTA 1 — TARJETA PRINCIPAL (Día Seleccionado)
  // ==========================================
  const selectedIngresosUsd = salesByDateMap.get(selectedDate) || 0;
  const selectedGastoUsd = spendByDateMap.get(selectedDate) || 0;
  const selectedUtilidadUsd = selectedIngresosUsd - selectedGastoUsd;
  const selectedAhorroUsd = Math.max(0, selectedUtilidadUsd * 0.30);
  const selectedCapitalUsd = Math.max(0, selectedUtilidadUsd * 0.50);
  const selectedHerramientasUsd = Math.max(0, selectedUtilidadUsd * 0.20);

  const isTodaySelected = selectedDate === todayStr;

  // ==========================================
  // VISTA 2 — HISTÓRICO (Días consolidados en USD)
  // ==========================================
  const historicalDays = useMemo(() => {
    const allDatesSet = new Set<string>();

    if (localStartDate && localEndDate && localStartDate <= localEndDate) {
      let curr = new Date(`${localStartDate}T00:00:00`);
      const end = new Date(`${localEndDate}T00:00:00`);
      
      while (curr <= end) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        allDatesSet.add(`${y}-${m}-${d}`);
        curr.setDate(curr.getDate() + 1);
      }
    } else {
      salesByDateMap.forEach((_, date) => allDatesSet.add(date));
      spendByDateMap.forEach((_, date) => allDatesSet.add(date));
    }

    const rows = Array.from(allDatesSet).map(dateStr => {
      const ingresosUsd = salesByDateMap.get(dateStr) || 0;
      const gastoUsd = spendByDateMap.get(dateStr) || 0;
      const utilidadUsd = ingresosUsd - gastoUsd;
      const ahorroUsd = Math.max(0, utilidadUsd * 0.30);
      const capitalUsd = Math.max(0, utilidadUsd * 0.50);
      const herramientasUsd = Math.max(0, utilidadUsd * 0.20);

      return {
        dateStr,
        ingresosUsd,
        gastoUsd,
        utilidadUsd,
        ahorroUsd,
        capitalUsd,
        herramientasUsd,
      };
    });

    // Ordenada de más reciente a más antigua por defecto (Descending)
    rows.sort((a, b) => b.dateStr.localeCompare(a.dateStr));

    return rows;
  }, [localStartDate, localEndDate, salesByDateMap, spendByDateMap]);

  // Totals for the historical view in USD
  const historicalTotalsUsd = useMemo(() => {
    return historicalDays.reduce(
      (acc, day) => {
        acc.ingresosUsd += day.ingresosUsd;
        acc.gastoUsd += day.gastoUsd;
        acc.utilidadUsd += day.utilidadUsd;
        acc.ahorroUsd += day.ahorroUsd;
        acc.capitalUsd += day.capitalUsd;
        acc.herramientasUsd += day.herramientasUsd;
        return acc;
      },
      { ingresosUsd: 0, gastoUsd: 0, utilidadUsd: 0, ahorroUsd: 0, capitalUsd: 0, herramientasUsd: 0 }
    );
  }, [historicalDays]);

  // Presets for Date Range Selector
  const setQuickRange = (daysOffset: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysOffset);

    const endStr = end.toISOString().split('T')[0];
    const startStr = start.toISOString().split('T')[0];

    setLocalStartDate(startStr);
    setLocalEndDate(endStr);
    setFilters(prev => ({ ...prev, startDate: startStr, endDate: endStr }));
  };

  const setMonthRange = () => {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), 1);

    const endStr = end.toISOString().split('T')[0];
    const startStr = start.toISOString().split('T')[0];

    setLocalStartDate(startStr);
    setLocalEndDate(endStr);
    setFilters(prev => ({ ...prev, startDate: startStr, endDate: endStr }));
  };

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = [
      'Fecha', 
      `Ingresos (${activeCurrencyConfig.code})`, 
      `Gasto (${activeCurrencyConfig.code})`, 
      `Utilidad Total (${activeCurrencyConfig.code})`, 
      `Ahorro 30% (${activeCurrencyConfig.code})`,
      `Capital Negocio 50% (${activeCurrencyConfig.code})`,
      `Herramientas y Sueldos 20% (${activeCurrencyConfig.code})`
    ];

    const rows = historicalDays.map(d => [
      d.dateStr,
      (d.ingresosUsd * activeCurrencyConfig.rate).toFixed(2),
      (d.gastoUsd * activeCurrencyConfig.rate).toFixed(2),
      (d.utilidadUsd * activeCurrencyConfig.rate).toFixed(2),
      (d.ahorroUsd * activeCurrencyConfig.rate).toFixed(2),
      (d.capitalUsd * activeCurrencyConfig.rate).toFixed(2),
      (d.herramientasUsd * activeCurrencyConfig.rate).toFixed(2),
    ]);
    
    rows.push([
      'TOTALES',
      (historicalTotalsUsd.ingresosUsd * activeCurrencyConfig.rate).toFixed(2),
      (historicalTotalsUsd.gastoUsd * activeCurrencyConfig.rate).toFixed(2),
      (historicalTotalsUsd.utilidadUsd * activeCurrencyConfig.rate).toFixed(2),
      (historicalTotalsUsd.ahorroUsd * activeCurrencyConfig.rate).toFixed(2),
      (historicalTotalsUsd.capitalUsd * activeCurrencyConfig.rate).toFixed(2),
      (historicalTotalsUsd.herramientasUsd * activeCurrencyConfig.rate).toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `datos_contables_${activeCurrencyConfig.code}_${localStartDate}_a_${localEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="accounting-data-view" className="space-y-8 animate-fadeIn">
      
      {/* VISTA 1 — TARJETA PRINCIPAL CON SELECTOR DE FECHA */}
      <section id="vista-1-dia" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#121624] via-[#161b2e] to-[#0e121d] border border-[#262c45] p-6 sm:p-8 shadow-2xl">
        {/* Glow effect decorations */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-[#21273e]">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> ANÁLISIS DIARIO CONTABLE
              </span>
              <span className="text-xs font-mono text-gray-300 flex items-center gap-1 capitalize bg-[#1b2034] px-2.5 py-1 rounded-lg border border-[#2d3654]">
                <Calendar className="w-3.5 h-3.5 text-blue-400" /> {selectedDateFormattedText}
              </span>
            </div>
            <h3 className="text-xl font-display font-bold text-white tracking-tight">
              Desglose de Fondos y Utilidad del Día
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              Selecciona una fecha para visualizar y recalcular los ingresos, gastos, utilidad total y distribución táctica de fondos (Consolidado Global).
            </p>
          </div>

          {/* Date Selector & Reference Currency Selector */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Specific Day Selector Input */}
            <div className="flex items-center gap-2 bg-[#1b2034] px-3.5 py-2 rounded-xl border border-[#2d3654] shadow-md">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-mono text-gray-400 font-semibold uppercase">FECHA:</span>
              <input
                id="accounting-single-date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white text-xs font-mono font-bold focus:outline-none cursor-pointer"
              />
              {!isTodaySelected && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className="ml-1 text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 transition-all cursor-pointer"
                  title="Volver al día de hoy"
                >
                  Ir a Hoy
                </button>
              )}
            </div>

            {/* Reference Currency Selector Control */}
            <div className="flex items-center gap-2 bg-[#1b2034] px-3.5 py-2 rounded-xl border border-[#2d3654] shadow-md">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono text-gray-400 font-semibold uppercase">MONEDA:</span>
              <select
                id="accounting-reference-currency-select"
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="bg-transparent text-white text-xs font-mono font-bold focus:outline-none cursor-pointer pr-1"
              >
                {CURRENCY_OPTIONS.map(c => (
                  <option key={c.code} value={c.code} className="bg-[#11131c] text-white">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* CONTEXT DATA BASE (Ingresos & Gasto del día seleccionado) */}
        <div className="relative z-10 mt-6 bg-[#141827] rounded-xl p-4 border border-[#23293f]">
          <div className="flex items-center justify-between mb-3 border-b border-[#1f253a] pb-2">
            <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              Datos Base de Origen ({selectedDate})
            </span>
            <span className="text-[10px] font-mono text-gray-500">
              {activeCurrencyConfig.code === 'USD' ? 'Valores base en USD' : `Convertido a ${activeCurrencyConfig.code}`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ingresos del día */}
            <div className="bg-[#0d101a] rounded-lg p-3 border border-[#1f253a] flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-gray-400 flex items-center gap-1 mb-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" /> Ingresos del Día
                </div>
                <div className="text-xl font-bold font-display text-white">
                  {formatConvertedMoney(selectedIngresosUsd, activeCurrencyConfig)}
                </div>
              </div>
              <span className="text-[10px] font-mono text-gray-500">Suma Ventas</span>
            </div>

            {/* Gasto del día */}
            <div className="bg-[#0d101a] rounded-lg p-3 border border-[#1f253a] flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-gray-400 flex items-center gap-1 mb-1">
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" /> Gasto del Día
                </div>
                <div className="text-xl font-bold font-display text-rose-400">
                  {formatConvertedMoney(selectedGastoUsd, activeCurrencyConfig)}
                </div>
              </div>
              <span className="text-[10px] font-mono text-gray-500">Suma Meta Ads</span>
            </div>
          </div>
        </div>

        {/* NUEVO DESGLOSE DE 4 CASILLAS INDIVIDUALES */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          
          {/* 1. UTILIDAD TOTAL DEL DÍA — VERDE CLARO */}
          <div className="bg-gradient-to-br from-[#0c2419] to-[#081a12] rounded-xl p-5 border border-emerald-500/40 shadow-lg flex flex-col justify-between group hover:border-emerald-400 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> UTILIDAD TOTAL
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Verde Claro
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-display font-black text-emerald-300 tracking-tight my-1">
                {formatConvertedMoney(selectedUtilidadUsd, activeCurrencyConfig)}
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-emerald-900/50 flex items-center justify-between text-[11px] font-mono text-emerald-400/80">
              <span>Fórmula:</span>
              <span className="font-semibold text-emerald-300">Ingresos − Gasto</span>
            </div>
          </div>

          {/* 2. AHORRO (30%) — ROJO */}
          <div className="bg-gradient-to-br from-[#2a1217] to-[#1d0b0f] rounded-xl p-5 border border-rose-500/40 shadow-lg flex flex-col justify-between group hover:border-rose-400 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <PiggyBank className="w-4 h-4 text-rose-400" /> AHORRO (30%)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  Rojo
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-display font-black text-rose-400 tracking-tight my-1">
                {formatConvertedMoney(selectedAhorroUsd, activeCurrencyConfig)}
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-rose-900/50 flex items-center justify-between text-[11px] font-mono text-rose-400/80">
              <span>Fórmula:</span>
              <span className="font-semibold text-rose-300">Utilidad × 30%</span>
            </div>
          </div>

          {/* 3. CAPITAL NEGOCIO (50%) — VERDE OSCURO */}
          <div className="bg-gradient-to-br from-[#06180e] to-[#041009] rounded-xl p-5 border border-emerald-700/60 shadow-lg flex flex-col justify-between group hover:border-emerald-600 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-500" /> CAPITAL NEGOCIO
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800">
                  Verde Oscuro
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-display font-black text-emerald-500 tracking-tight my-1">
                {formatConvertedMoney(selectedCapitalUsd, activeCurrencyConfig)}
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-emerald-950 flex items-center justify-between text-[11px] font-mono text-emerald-600">
              <span>Fórmula:</span>
              <span className="font-semibold text-emerald-500">Utilidad × 50%</span>
            </div>
          </div>

          {/* 4. HERRAMIENTAS Y SUELDOS (20%) — AZUL */}
          <div className="bg-gradient-to-br from-[#0d1d33] to-[#081220] rounded-xl p-5 border border-blue-500/40 shadow-lg flex flex-col justify-between group hover:border-blue-400 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-blue-400" /> HERRAMIENTAS / SUELDOS
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                  Azul
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-display font-black text-blue-400 tracking-tight my-1">
                {formatConvertedMoney(selectedHerramientasUsd, activeCurrencyConfig)}
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-blue-900/50 flex items-center justify-between text-[11px] font-mono text-blue-400/80">
              <span>Fórmula:</span>
              <span className="font-semibold text-blue-300">Utilidad × 20%</span>
            </div>
          </div>

        </div>
      </section>

      {/* VISTA 2 — HISTÓRICO: Tabla con selector de fechas y 4 columnas nuevas */}
      <section id="vista-2-historico" className="bg-[#11131c] border border-[#1f2335] rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* Section Header + Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#1f2335]">
          <div>
            <h3 className="text-lg font-display font-bold text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#3b82f6]" /> Histórico por Día ({activeCurrencyConfig.code})
            </h3>
            <p className="text-xs text-gray-400 font-mono mt-1">
              Desglose consolidado diario del rendimiento y distribución contable. Ordenado de más reciente a más antiguo por defecto.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-[#1b2032] hover:bg-[#252c46] text-gray-300 hover:text-white border border-[#2d3554] rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Descargar reporte en formato CSV con todas las columnas"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" /> Exportar CSV ({activeCurrencyConfig.code})
            </button>
          </div>
        </div>

        {/* Date Selector Control Bar */}
        <div className="bg-[#151926] border border-[#252b42] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono font-semibold text-gray-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#3b82f6]" /> Rango de Fechas:
            </span>

            {/* Quick Filter Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setQuickRange(0)}
                className={`px-2.5 py-1 text-xs font-mono rounded border transition-all cursor-pointer ${
                  localStartDate === todayStr && localEndDate === todayStr
                    ? 'bg-[#3b82f6] text-white border-[#3b82f6] font-bold'
                    : 'bg-[#1c2132] text-gray-300 border-[#2d3450] hover:bg-[#262d44]'
                }`}
              >
                Hoy
              </button>

              <button
                type="button"
                onClick={() => setQuickRange(7)}
                className="px-2.5 py-1 text-xs font-mono rounded bg-[#1c2132] text-gray-300 border border-[#2d3450] hover:bg-[#262d44] transition-all cursor-pointer"
              >
                Últimos 7 días
              </button>

              <button
                type="button"
                onClick={() => setQuickRange(30)}
                className="px-2.5 py-1 text-xs font-mono rounded bg-[#1c2132] text-gray-300 border border-[#2d3450] hover:bg-[#262d44] transition-all cursor-pointer"
              >
                Últimos 30 días
              </button>

              <button
                type="button"
                onClick={setMonthRange}
                className="px-2.5 py-1 text-xs font-mono rounded bg-[#1c2132] text-gray-300 border border-[#2d3450] hover:bg-[#262d44] transition-all cursor-pointer"
              >
                Mes Actual
              </button>
            </div>
          </div>

          {/* Date Picker Custom Inputs */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={localStartDate}
              onChange={(e) => {
                const val = e.target.value;
                setLocalStartDate(val);
                setFilters(prev => ({ ...prev, startDate: val }));
              }}
              className="bg-[#0e111a] border border-[#2d3450] rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-[#3b82f6]"
            />
            <span className="text-xs text-gray-500 font-mono">a</span>
            <input
              type="date"
              value={localEndDate}
              onChange={(e) => {
                const val = e.target.value;
                setLocalEndDate(val);
                setFilters(prev => ({ ...prev, endDate: val }));
              }}
              className="bg-[#0e111a] border border-[#2d3450] rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-[#3b82f6]"
            />
          </div>
        </div>

        {/* Historical Table */}
        <div className="overflow-x-auto rounded-xl border border-[#1f2335]">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-[#161926] text-gray-400 uppercase border-b border-[#1f2335]">
                <th className="py-3 px-4 font-semibold tracking-wider">Fecha</th>
                <th className="py-3 px-4 font-semibold tracking-wider text-right">Ingresos ({activeCurrencyConfig.code})</th>
                <th className="py-3 px-4 font-semibold tracking-wider text-right">Gasto ({activeCurrencyConfig.code})</th>
                <th className="py-3 px-4 font-semibold tracking-wider text-right text-emerald-400 bg-emerald-500/5 border-l border-r border-[#1f2335]">
                  Utilidad Total ({activeCurrencyConfig.code})
                </th>
                <th className="py-3 px-4 font-semibold tracking-wider text-right text-rose-400 bg-rose-500/5">
                  Ahorro (30%) ({activeCurrencyConfig.code})
                </th>
                <th className="py-3 px-4 font-semibold tracking-wider text-right text-emerald-500 bg-emerald-950/20">
                  Capital Negocio (50%) ({activeCurrencyConfig.code})
                </th>
                <th className="py-3 px-4 font-semibold tracking-wider text-right text-blue-400 bg-blue-500/5">
                  Herramientas y Sueldos (20%) ({activeCurrencyConfig.code})
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2335] bg-[#11131c]">
              {historicalDays.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No hay registros en el rango seleccionado ({localStartDate} al {localEndDate}).
                  </td>
                </tr>
              ) : (
                historicalDays.map((day) => {
                  const isSelectedDay = day.dateStr === selectedDate;
                  const isToday = day.dateStr === todayStr;

                  return (
                    <tr 
                      key={day.dateStr} 
                      className={`hover:bg-[#161a29] transition-colors ${isSelectedDay ? 'bg-[#182136] font-semibold' : ''}`}
                    >
                      <td className="py-3 px-4 text-white flex items-center gap-2">
                        <span>{day.dateStr}</span>
                        {isToday && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            HOY
                          </span>
                        )}
                        {isSelectedDay && !isToday && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            SELECCIONADO
                          </span>
                        )}
                        {day.gastoUsd === 0 && (
                          <span title="Sin gasto registrado en Meta Ads para este día" className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
                            Sin Gasto
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-white font-medium">
                        {formatConvertedMoney(day.ingresosUsd, activeCurrencyConfig)}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-400">
                        {formatConvertedMoney(day.gastoUsd, activeCurrencyConfig)}
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold border-l border-r border-[#1f2335] ${day.utilidadUsd >= 0 ? 'text-emerald-400 bg-emerald-500/5' : 'text-rose-400'}`}>
                        {formatConvertedMoney(day.utilidadUsd, activeCurrencyConfig)}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-400 font-bold bg-rose-500/5">
                        {formatConvertedMoney(day.ahorroUsd, activeCurrencyConfig)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-500 font-bold bg-emerald-950/20">
                        {formatConvertedMoney(day.capitalUsd, activeCurrencyConfig)}
                      </td>
                      <td className="py-3 px-4 text-right text-blue-400 font-bold bg-blue-500/5">
                        {formatConvertedMoney(day.herramientasUsd, activeCurrencyConfig)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* TOTAL ROW */}
            {historicalDays.length > 0 && (
              <tfoot>
                <tr className="bg-[#181d2e] text-white border-t-2 border-[#3b82f6] font-bold text-xs sm:text-sm">
                  <td className="py-4 px-4 uppercase tracking-wider font-display flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-400" /> TOTAL RANGO ({activeCurrencyConfig.code})
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-white">
                    {formatConvertedMoney(historicalTotalsUsd.ingresosUsd, activeCurrencyConfig)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-rose-400">
                    {formatConvertedMoney(historicalTotalsUsd.gastoUsd, activeCurrencyConfig)}
                  </td>
                  <td className={`py-4 px-4 text-right font-mono border-l border-r border-[#1f2335] ${historicalTotalsUsd.utilidadUsd >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400'}`}>
                    {formatConvertedMoney(historicalTotalsUsd.utilidadUsd, activeCurrencyConfig)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-rose-400 bg-rose-500/10">
                    {formatConvertedMoney(historicalTotalsUsd.ahorroUsd, activeCurrencyConfig)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-emerald-500 bg-emerald-950/40">
                    {formatConvertedMoney(historicalTotalsUsd.capitalUsd, activeCurrencyConfig)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-blue-400 bg-blue-500/10">
                    {formatConvertedMoney(historicalTotalsUsd.herramientasUsd, activeCurrencyConfig)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Footer info note */}
        <div className="flex items-center gap-2 text-xs font-mono text-gray-500 bg-[#0e111a] p-3 rounded-lg border border-[#1b2032]">
          <HelpCircle className="w-4 h-4 text-gray-400 shrink-0" />
          <span>
            <strong>Nota Contable:</strong> Todos los valores se recalculan en tiempo real usando la moneda de referencia seleccionada (<strong>{activeCurrencyConfig.code}</strong>, Tasa: {activeCurrencyConfig.rate}). Los fondos tácticos corresponden al 30% Ahorro, 50% Capital Negocio y 20% Herramientas/Sueldos sobre la utilidad positiva.
          </span>
        </div>

      </section>

    </div>
  );
}

