import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Globe2, 
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  RefreshCw,
  Coins
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { Sale, CountryConfig } from '../types';

interface GeneralSummaryViewProps {
  sales: Sale[];
  allSales: Sale[]; // Full dataset for period comparison
  startDate: string;
  endDate: string;
  countriesConfig?: Record<string, CountryConfig>;
  onRefetch?: () => void;
}

const COUNTRY_COLORS: Record<string, string> = {
  'Colombia': '#3b82f6',
  'Bolivia': '#10b981',
  'Perú': '#f59e0b',
  'Venezuela': '#ec4899',
  'México': '#8b5cf6',
  'Ecuador': '#06b6d4',
  'Otros': '#64748b'
};

const CURRENCY_OPTIONS: Array<{ code: string; label: string; countryKey: string; defaultRate: number; symbol: string }> = [
  { code: 'USD', label: 'Dólar (USD)', countryKey: 'Ecuador', defaultRate: 1, symbol: '$' },
  { code: 'COP', label: 'Peso Colombiano (COP)', countryKey: 'Colombia', defaultRate: 4000, symbol: '$' },
  { code: 'MXN', label: 'Peso Mexicano (MXN)', countryKey: 'México', defaultRate: 18.5, symbol: '$' },
  { code: 'BOB', label: 'Boliviano (BOB)', countryKey: 'Bolivia', defaultRate: 6.9, symbol: 'Bs.' },
  { code: 'PEN', label: 'Sol Peruano (PEN)', countryKey: 'Perú', defaultRate: 3.7, symbol: 'S/' },
  { code: 'VES', label: 'Bolívar Venezolano (VES)', countryKey: 'Venezuela', defaultRate: 36, symbol: 'Bs.' },
];

export default function GeneralSummaryView({ 
  sales, 
  allSales, 
  startDate, 
  endDate,
  countriesConfig = {},
  onRefetch
}: GeneralSummaryViewProps) {
  // Selected Reference Currency state (USD default)
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active currency metadata and conversion rate
  const activeCurrencyConfig = useMemo(() => {
    const opt = CURRENCY_OPTIONS.find(c => c.code === selectedCurrency) || CURRENCY_OPTIONS[0];
    let rate = 1;
    if (opt.code !== 'USD') {
      rate = countriesConfig[opt.countryKey]?.rate || opt.defaultRate;
    }
    return {
      code: opt.code,
      symbol: opt.symbol,
      rate,
      countryKey: opt.countryKey
    };
  }, [selectedCurrency, countriesConfig]);

  // Handle manual cache refetch
  const handleManualRefetch = async () => {
    if (!onRefetch) return;
    setIsRefreshing(true);
    try {
      await onRefetch();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // 1. Calculate Core KPIs converted to reference currency
  const totalSalesUsd = useMemo(() => sales.reduce((acc, s) => acc + s.amountUsd, 0), [sales]);
  const salesCount = sales.length;
  const ticketPromedioUsd = salesCount > 0 ? totalSalesUsd / salesCount : 0;

  const totalSalesConverted = totalSalesUsd * activeCurrencyConfig.rate;
  const ticketPromedioConverted = ticketPromedioUsd * activeCurrencyConfig.rate;

  // 2. Calculate Comparison vs Previous Period
  const periodComparison = useMemo(() => {
    if (!startDate || !endDate || sales.length === 0) return { changePercent: 0, isUp: true };
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return { changePercent: 0, isUp: true };

    const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000);
    const prevStart = new Date(prevEnd.getTime() - diffMs);

    const prevStartStr = prevStart.toISOString().split('T')[0];
    const prevEndStr = prevEnd.toISOString().split('T')[0];

    const prevSales = allSales.filter(s => s.date >= prevStartStr && s.date <= prevEndStr);
    const prevTotalUsd = prevSales.reduce((acc, s) => acc + s.amountUsd, 0);

    if (prevTotalUsd === 0) return { changePercent: 100, isUp: true };
    const diff = totalSalesUsd - prevTotalUsd;
    const pct = (diff / prevTotalUsd) * 100;
    return {
      changePercent: Math.abs(pct),
      isUp: pct >= 0,
      prevTotalUsd
    };
  }, [sales, allSales, startDate, endDate, totalSalesUsd]);

  // 3. Sales by Country Data (Bar Chart converted to Reference Currency)
  const salesByCountryData = useMemo(() => {
    const countryMap: Record<string, { totalUsd: number; count: number }> = {};
    sales.forEach(s => {
      const c = s.country || 'Otros';
      if (!countryMap[c]) countryMap[c] = { totalUsd: 0, count: 0 };
      countryMap[c].totalUsd += s.amountUsd;
      countryMap[c].count += 1;
    });

    return Object.entries(countryMap)
      .map(([pais, val]) => {
        const converted = val.totalUsd * activeCurrencyConfig.rate;
        return {
          pais,
          montoUsd: Math.round(val.totalUsd * 100) / 100,
          montoConverted: Math.round(converted * 100) / 100,
          ventasCount: val.count,
          fill: COUNTRY_COLORS[pais] || '#64748b'
        };
      })
      .sort((a, b) => b.montoConverted - a.montoConverted);
  }, [sales, activeCurrencyConfig]);

  // 4. Time Evolution Data (Line Chart converted to Reference Currency)
  const timeEvolutionData = useMemo(() => {
    const dateMap: Record<string, number> = {};
    sales.forEach(s => {
      dateMap[s.date] = (dateMap[s.date] || 0) + s.amountUsd;
    });

    return Object.entries(dateMap)
      .map(([fecha, montoUsd]) => ({
        fecha,
        montoUsd: Math.round(montoUsd * 100) / 100,
        montoConverted: Math.round((montoUsd * activeCurrencyConfig.rate) * 100) / 100
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [sales, activeCurrencyConfig]);

  // 5. Country Share Data (Pie / Donut Chart)
  const countryShareData = useMemo(() => {
    if (totalSalesUsd === 0) return [];
    return salesByCountryData.map(item => ({
      name: item.pais,
      value: item.montoConverted,
      percentage: Number(((item.montoUsd / totalSalesUsd) * 100).toFixed(1)),
      color: item.fill
    }));
  }, [salesByCountryData, totalSalesUsd]);

  // Helper formatter for converted values
  const formatMoney = (val: number) => {
    return `${activeCurrencyConfig.symbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${activeCurrencyConfig.code}`;
  };

  return (
    <div id="general-summary-level1" className="space-y-6 animate-fade-in">
      
      {/* Banner Header with Controls */}
      <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-[#3b82f6]" /> Nivel 1 — Resumen General Consolidado
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Consolidado global de todos los países convertidos dinámicamente a la moneda de referencia seleccionada.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Reference Currency Selector */}
          <div className="flex items-center gap-2 bg-[#151926] px-3 py-1.5 rounded-lg border border-[#252b42]">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono text-gray-400 font-semibold uppercase">MONEDA:</span>
            <select
              id="reference-currency-select"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="bg-transparent text-white text-xs font-mono font-bold focus:outline-none cursor-pointer"
            >
              {CURRENCY_OPTIONS.map(c => (
                <option key={c.code} value={c.code} className="bg-[#11131c] text-white">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date range badge */}
          <div className="flex items-center gap-2 bg-[#151926] px-3 py-1.5 rounded-lg border border-[#252b42] text-xs font-mono text-gray-300">
            <Calendar className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span>{startDate} → {endDate}</span>
          </div>

          {/* Refetch Manual Cache Button */}
          {onRefetch && (
            <button
              onClick={handleManualRefetch}
              disabled={isRefreshing}
              title="Refrescar datos de Supabase en vivo (Invalidar caché)"
              className="px-3 py-1.5 bg-[#1f2335] hover:bg-[#2d3450] text-[#3b82f6] hover:text-white border border-[#3b82f6]/30 hover:border-[#3b82f6] rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : 'text-[#3b82f6]'}`} />
              <span>{isRefreshing ? 'Refrescando...' : 'Refrescar Datos'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Sales Converted */}
        <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 hover:border-[#2d3450] transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Ventas Totales ({activeCurrencyConfig.code})</span>
              <span className="text-2xl font-display font-extrabold text-emerald-400 mt-1 block">
                {formatMoney(totalSalesConverted)}
              </span>
            </div>
            <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] font-mono text-gray-500">
            {activeCurrencyConfig.code === 'USD' 
              ? 'Facturación consolidada en Dólares' 
              : `Convertido de USD a ${activeCurrencyConfig.code} (Tasa: ${activeCurrencyConfig.rate})`}
          </div>
        </div>

        {/* KPI 2: Total Sales Count */}
        <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 hover:border-[#2d3450] transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Nº Ventas Totales</span>
              <span className="text-2xl font-display font-extrabold text-white mt-1 block">
                {salesCount}
              </span>
            </div>
            <div className="p-2.5 bg-blue-500/10 rounded-lg text-[#3b82f6] border border-blue-500/20">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] font-mono text-gray-500">Transacciones completadas</div>
        </div>

        {/* KPI 3: Ticket Promedio Converted */}
        <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 hover:border-[#2d3450] transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Ticket Promedio ({activeCurrencyConfig.code})</span>
              <span className="text-2xl font-display font-extrabold text-sky-400 mt-1 block">
                {formatMoney(ticketPromedioConverted)}
              </span>
            </div>
            <div className="p-2.5 bg-sky-500/10 rounded-lg text-sky-400 border border-sky-500/20">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] font-mono text-gray-500">Ingreso medio por transacción</div>
        </div>

        {/* KPI 4: Period Comparison */}
        <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 hover:border-[#2d3450] transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">vs. Período Anterior</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-2xl font-display font-extrabold ${periodComparison.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {periodComparison.isUp ? '+' : '-'}{periodComparison.changePercent.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className={`p-2.5 rounded-lg border ${
              periodComparison.isUp 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              {periodComparison.isUp ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-3 text-[11px] font-mono text-gray-500">Comparado con ventana previa</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Ventas por País (Barras en Moneda de Referencia) */}
        <div className="lg:col-span-2 bg-[#11131c] border border-[#1f2335] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-[#1f2335] pb-3">
            <div>
              <h3 className="font-display font-bold text-white text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#3b82f6]" /> Ventas Totales por País ({activeCurrencyConfig.code})
              </h3>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">Comparativa directa en moneda de referencia</p>
            </div>
          </div>
          <div className="h-72 w-full">
            {salesByCountryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">Sin datos para el período</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByCountryData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2335" vertical={false} />
                  <XAxis dataKey="pais" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${activeCurrencyConfig.symbol}${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#151926', borderColor: '#2d3450', borderRadius: '8px', color: '#ffffff', fontSize: '12px' }}
                    itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 600 }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 500 }}
                    formatter={(value: any) => [`${activeCurrencyConfig.symbol}${Number(value).toLocaleString()} ${activeCurrencyConfig.code}`, 'Facturación']}
                  />
                  <Bar dataKey="montoConverted" radius={[4, 4, 0, 0]}>
                    {salesByCountryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 3: % Participación por País (Pie / Dona) */}
        <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 border-b border-[#1f2335] pb-3">
            <div>
              <h3 className="font-display font-bold text-white text-sm flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-purple-400" /> Participación por País
              </h3>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">% sobre la facturación global</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {countryShareData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">Sin datos de participación</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={countryShareData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {countryShareData.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#151926', borderColor: '#2d3450', borderRadius: '8px', color: '#ffffff', fontSize: '12px' }}
                    itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 600 }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 500 }}
                    formatter={(val: any, name: any, item: any) => [
                      `${activeCurrencyConfig.symbol}${Number(val).toLocaleString()} ${activeCurrencyConfig.code} (${item.payload.percentage}%)`, 
                      name
                    ]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    formatter={(value) => <span className="text-xs font-mono text-gray-300">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Chart 2: Evolución Temporal de Ventas (Línea en Moneda de Referencia) */}
      <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4 border-b border-[#1f2335] pb-3">
          <div>
            <h3 className="font-display font-bold text-white text-sm flex items-center gap-2">
              <LineChartIcon className="w-4 h-4 text-emerald-400" /> Evolución de Ventas en el Tiempo ({activeCurrencyConfig.code})
            </h3>
            <p className="text-[11px] text-gray-500 font-mono mt-0.5">Tendencia de facturación diaria acumulada</p>
          </div>
        </div>
        <div className="h-72 w-full">
          {timeEvolutionData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">Sin historial para el rango</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeEvolutionData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2335" vertical={false} />
                <XAxis dataKey="fecha" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${activeCurrencyConfig.symbol}${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151926', borderColor: '#2d3450', borderRadius: '8px', color: '#ffffff', fontSize: '12px' }}
                  itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 600 }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 500 }}
                  formatter={(value: any) => [`${activeCurrencyConfig.symbol}${Number(value).toLocaleString()} ${activeCurrencyConfig.code}`, 'Facturación Diaria']}
                />
                <Line type="monotone" dataKey="montoConverted" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}
