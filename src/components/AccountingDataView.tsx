/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  PiggyBank, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download, 
  HelpCircle, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  ShieldCheck,
  Coins
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

  // Local date range state initialized from global filters (defaulting to current month / July 2026)
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

  // Today's Date formatted nicely (e.g. "Viernes, 24 de Julio 2026")
  const todayFormattedText = useMemo(() => {
    const parts = todayStr.split('-');
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
    return todayStr;
  }, [todayStr]);

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
  // VISTA 1 — HOY (Valores base en USD)
  // ==========================================
  const todayIngresosUsd = salesByDateMap.get(todayStr) || 0;
  const todayGastoUsd = spendByDateMap.get(todayStr) || 0;
  const todayUtilidadUsd = todayIngresosUsd - todayGastoUsd;
  const todayAhorroSugeridoUsd = Math.max(0, todayUtilidadUsd * 0.30);

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
      const ahorroSugeridoUsd = Math.max(0, utilidadUsd * 0.30);

      return {
        dateStr,
        ingresosUsd,
        gastoUsd,
        utilidadUsd,
        ahorroSugeridoUsd,
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
        acc.ahorroSugeridoUsd += day.ahorroSugeridoUsd;
        return acc;
      },
      { ingresosUsd: 0, gastoUsd: 0, utilidadUsd: 0, ahorroSugeridoUsd: 0 }
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
      `Utilidad (${activeCurrencyConfig.code})`, 
      `Ahorro Sugerido 30% (${activeCurrencyConfig.code})`
    ];

    const rows = historicalDays.map(d => [
      d.dateStr,
      (d.ingresosUsd * activeCurrencyConfig.rate).toFixed(2),
      (d.gastoUsd * activeCurrencyConfig.rate).toFixed(2),
      (d.utilidadUsd * activeCurrencyConfig.rate).toFixed(2),
      (d.ahorroSugeridoUsd * activeCurrencyConfig.rate).toFixed(2),
    ]);
    
    rows.push([
      'TOTALES',
      (historicalTotalsUsd.ingresosUsd * activeCurrencyConfig.rate).toFixed(2),
      (historicalTotalsUsd.gastoUsd * activeCurrencyConfig.rate).toFixed(2),
      (historicalTotalsUsd.utilidadUsd * activeCurrencyConfig.rate).toFixed(2),
      (historicalTotalsUsd.ahorroSugeridoUsd * activeCurrencyConfig.rate).toFixed(2),
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
      
      {/* VISTA 1 — HOY: Tarjeta Destacada Ahorro Sugerido */}
      <section id="vista-1-hoy" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#121624] via-[#161b2e] to-[#0e121d] border border-[#262c45] p-6 sm:p-8 shadow-2xl">
        {/* Glow effect decorations */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-[#21273e]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> HOY EN TIEMPO REAL
              </span>
              <span className="text-xs font-mono text-gray-400 flex items-center gap-1 capitalize">
                <Calendar className="w-3.5 h-3.5 text-gray-500" /> {todayFormattedText}
              </span>
            </div>
            <h3 className="text-xl font-display font-bold text-white tracking-tight">
              Cálculo de Ahorro Sugerido del Día
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              Fondo de reserva estratégico del 30% reservado sobre la utilidad nula o positiva de hoy (Consolidado Global todos los países).
            </p>
          </div>

          {/* Reference Currency Selector Control */}
          <div className="flex items-center gap-3">
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

            {/* Badge indicator */}
            <div className="hidden sm:flex items-center gap-2 bg-[#1b2034] px-4 py-2 rounded-xl border border-[#2d3654]">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div className="text-left">
                <p className="text-[10px] font-mono text-gray-400 uppercase">Regla de Reserva</p>
                <p className="text-xs font-bold text-emerald-400 font-mono">30% de Utilidad Diaria</p>
              </div>
            </div>
          </div>
        </div>

        {/* HERO NUMBER CARD — AHORRO SUGERIDO DE HOY */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mt-6">
          
          {/* Main Hero Highlight Column */}
          <div className="lg:col-span-6 bg-gradient-to-br from-[#182338] to-[#121929] rounded-xl p-6 border border-emerald-500/30 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-emerald-400 animate-bounce" /> AHORRO SUGERIDO DE HOY ({activeCurrencyConfig.code})
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                30% Utilidad
              </span>
            </div>

            <div className="my-2">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 tracking-tight">
                {formatConvertedMoney(todayAhorroSugeridoUsd, activeCurrencyConfig)}
              </div>
              <p className="text-xs text-gray-400 font-mono mt-2 flex items-center gap-1.5">
                <span>
                  {activeCurrencyConfig.code === 'USD'
                    ? 'Reflejo en tiempo real de las ventas registradas hoy en Dólares.'
                    : `Convertido de USD a ${activeCurrencyConfig.code} (Tasa: ${activeCurrencyConfig.rate})`}
                </span>
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#252f4a] flex items-center justify-between text-xs font-mono text-gray-400">
              <span>Estado del cálculo:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                ● Calculado al vuelo
              </span>
            </div>
          </div>

          {/* Supporting Stats Cards (Ingresos, Gasto, Utilidad) */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Ingresos de hoy */}
            <div className="bg-[#141827] rounded-xl p-4 border border-[#23293f] flex flex-col justify-between hover:border-[#353d5e] transition-all">
              <div>
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-[11px] font-mono font-medium">Ingresos ({activeCurrencyConfig.code})</span>
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold font-display text-white">
                  {formatConvertedMoney(todayIngresosUsd, activeCurrencyConfig)}
                </div>
              </div>
              <p className="text-[10px] font-mono text-gray-500 mt-3">SUMA de ventas.monto_usd</p>
            </div>

            {/* Gasto de hoy */}
            <div className="bg-[#141827] rounded-xl p-4 border border-[#23293f] flex flex-col justify-between hover:border-[#353d5e] transition-all">
              <div>
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-[11px] font-mono font-medium">Gasto ({activeCurrencyConfig.code})</span>
                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold font-display text-rose-400">
                  {formatConvertedMoney(todayGastoUsd, activeCurrencyConfig)}
                </div>
              </div>
              <p className="text-[10px] font-mono text-gray-500 mt-3">SUMA de campanas_meta.gasto</p>
            </div>

            {/* Utilidad de hoy */}
            <div className="bg-[#141827] rounded-xl p-4 border border-[#23293f] flex flex-col justify-between hover:border-[#353d5e] transition-all">
              <div>
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-[11px] font-mono font-medium">Utilidad ({activeCurrencyConfig.code})</span>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${todayUtilidadUsd >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {todayUtilidadUsd >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                </div>
                <div className={`text-xl sm:text-2xl font-bold font-display ${todayUtilidadUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatConvertedMoney(todayUtilidadUsd, activeCurrencyConfig)}
                </div>
              </div>
              <p className="text-[10px] font-mono text-gray-500 mt-3">Ingresos − Gasto Meta</p>
            </div>

          </div>

        </div>
      </section>

      {/* VISTA 2 — HISTÓRICO: Tabla con selector de fechas y moneda de referencia */}
      <section id="vista-2-historico" className="bg-[#11131c] border border-[#1f2335] rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* Section Header + Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#1f2335]">
          <div>
            <h3 className="text-lg font-display font-bold text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#3b82f6]" /> Histórico por Día ({activeCurrencyConfig.code})
            </h3>
            <p className="text-xs text-gray-400 font-mono mt-1">
              Desglose consolidado diario del rendimiento contable. Ordenado de más reciente a más antiguo por defecto.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-[#1b2032] hover:bg-[#252c46] text-gray-300 hover:text-white border border-[#2d3554] rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Descargar reporte en formato CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" /> Exportar CSV ({activeCurrencyConfig.code})
            </button>
          </div>
        </div>

        {/* Date Selector Control Bar (Compatible con el resto del dashboard) */}
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
                <th className="py-3 px-4 font-semibold tracking-wider text-right">Gasto Meta ({activeCurrencyConfig.code})</th>
                <th className="py-3 px-4 font-semibold tracking-wider text-right">Utilidad ({activeCurrencyConfig.code})</th>
                <th className="py-3 px-4 font-semibold tracking-wider text-right text-emerald-400">
                  Ahorro Sugerido 30% ({activeCurrencyConfig.code})
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2335] bg-[#11131c]">
              {historicalDays.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No hay registros de ventas ni anuncios en el rango seleccionado ({localStartDate} al {localEndDate}).
                  </td>
                </tr>
              ) : (
                historicalDays.map((day) => {
                  const isToday = day.dateStr === todayStr;
                  const isNegativeUtilidad = day.utilidadUsd < 0;

                  return (
                    <tr 
                      key={day.dateStr} 
                      className={`hover:bg-[#161a29] transition-colors ${isToday ? 'bg-[#182136]/50 font-semibold' : ''}`}
                    >
                      <td className="py-3 px-4 text-white flex items-center gap-2">
                        <span>{day.dateStr}</span>
                        {isToday && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            HOY
                          </span>
                        )}
                        {day.gastoUsd === 0 && (
                          <span title="Sin gasto registrado en campanas_meta para este día" className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
                            Sin Gasto Meta
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-white font-medium">
                        {formatConvertedMoney(day.ingresosUsd, activeCurrencyConfig)}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-400">
                        {formatConvertedMoney(day.gastoUsd, activeCurrencyConfig)}
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${isNegativeUtilidad ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {formatConvertedMoney(day.utilidadUsd, activeCurrencyConfig)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-300 font-bold bg-emerald-500/5">
                        {formatConvertedMoney(day.ahorroSugeridoUsd, activeCurrencyConfig)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* TOTAL ROW (Sum of full selected date range converted to reference currency) */}
            {historicalDays.length > 0 && (
              <tfoot>
                <tr className="bg-[#181d2e] text-white border-t-2 border-[#3b82f6] font-bold text-sm">
                  <td className="py-4 px-4 uppercase tracking-wider font-display flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-400" /> TOTAL RANGO ({activeCurrencyConfig.code})
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-white">
                    {formatConvertedMoney(historicalTotalsUsd.ingresosUsd, activeCurrencyConfig)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-rose-400">
                    {formatConvertedMoney(historicalTotalsUsd.gastoUsd, activeCurrencyConfig)}
                  </td>
                  <td className={`py-4 px-4 text-right font-mono ${historicalTotalsUsd.utilidadUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatConvertedMoney(historicalTotalsUsd.utilidadUsd, activeCurrencyConfig)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-emerald-300 bg-emerald-500/10 text-base">
                    {formatConvertedMoney(historicalTotalsUsd.ahorroSugeridoUsd, activeCurrencyConfig)}
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
            <strong>Nota Contable:</strong> Todos los valores se recalculan en tiempo real usando la moneda de referencia seleccionada (<strong>{activeCurrencyConfig.code}</strong>, Tasa: {activeCurrencyConfig.rate}). El ahorro sugerido corresponde al 30% de la utilidad del periodo.
          </span>
        </div>

      </section>

    </div>
  );
}
