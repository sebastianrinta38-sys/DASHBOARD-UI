import React, { useState, useMemo } from 'react';
import { 
  Globe, 
  DollarSign, 
  ShoppingCart, 
  Award, 
  Tag, 
  BarChart3, 
  LineChart as LineChartIcon,
  Layers,
  Calendar
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
  Cell 
} from 'recharts';
import { Sale, CountryConfig } from '../types';

interface CountryDetailViewProps {
  sales: Sale[];
  countriesConfig: Record<string, CountryConfig>;
  selectedCountry: string;
  onSelectCountry: (country: string) => void;
}

const TIPO_VENTA_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  'contribucion_inicial': { 
    label: 'Contribución Inicial', 
    color: '#3b82f6',
    desc: 'Venta principal de entrada'
  },
  'downsell_45': {
    label: 'Downsell $45',
    color: '#06b6d4',
    desc: 'Oferta nivel $45'
  },
  'downsell_30': { 
    label: 'Downsell $30', 
    color: '#ec4899',
    desc: 'Oferta nivel $30'
  },
  'downsell_25': { 
    label: 'Downsell $25', 
    color: '#8b5cf6',
    desc: 'Oferta nivel $25'
  },
  'downsell_15': { 
    label: 'Downsell $15', 
    color: '#f59e0b',
    desc: 'Oferta nivel $15'
  },
  'downsell_5k': { 
    label: 'Downsell $5k', 
    color: '#10b981',
    desc: 'Oferta nivel $5,000 local'
  },
  'downsell_9k': { 
    label: 'Downsell $9k', 
    color: '#6366f1',
    desc: 'Oferta nivel $9,000 local'
  },
  'downsell_3': { 
    label: 'Downsell $3', 
    color: '#14b8a6',
    desc: 'Oferta nivel $3'
  },
  'downsell_2': { 
    label: 'Downsell $2', 
    color: '#f43f5e',
    desc: 'Oferta nivel $2'
  },
  'downsell_1': { 
    label: 'Downsell $1', 
    color: '#eab308',
    desc: 'Oferta nivel $1'
  }
};

const normalizeCountry = (str?: string) => {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

export default function CountryDetailView({ 
  sales, 
  countriesConfig, 
  selectedCountry, 
  onSelectCountry 
}: CountryDetailViewProps) {
  // Available Countries list
  const availableCountries = useMemo(() => {
    const fromConfig = Object.keys(countriesConfig);
    if (fromConfig.length > 0) return fromConfig;
    return Array.from(new Set(sales.map(s => s.country).filter(Boolean)));
  }, [countriesConfig, sales]);

  // Active Country State (if selectedCountry is 'All', default to the first available country)
  const activeCountry = selectedCountry !== 'All' ? selectedCountry : (availableCountries[0] || 'Colombia');

  // Filter Sales for active country (Accent insensitive)
  const countrySales = useMemo(() => {
    return sales.filter(s => normalizeCountry(s.country) === normalizeCountry(activeCountry));
  }, [sales, activeCountry]);

  // Currency code for active country
  const activeConfig = Object.entries(countriesConfig).find(([k]) => normalizeCountry(k) === normalizeCountry(activeCountry));
  const activeCurrency = countrySales[0]?.currency || activeConfig?.[1]?.currency || 'COP';

  // 1. Core Local KPIs
  const totalSalesLocal = useMemo(() => countrySales.reduce((acc, s) => acc + s.amountLocal, 0), [countrySales]);
  const salesCount = countrySales.length;
  const ticketPromedioLocal = salesCount > 0 ? totalSalesLocal / salesCount : 0;

  // 2. Breakdown per tipo_venta (Calculated separately)
  const tipoVentaBreakdown = useMemo(() => {
    const map: Record<string, { count: number; totalLocal: number }> = {};
    countrySales.forEach(s => {
      const type = s.tipoVenta || 'contribucion_inicial';
      if (!map[type]) map[type] = { count: 0, totalLocal: 0 };
      map[type].count += 1;
      map[type].totalLocal += s.amountLocal;
    });

    return Object.entries(map).map(([typeKey, val]) => {
      const meta = TIPO_VENTA_LABELS[typeKey] || { 
        label: typeKey, 
        color: '#8b5cf6', 
        desc: 'Modalidad de venta' 
      };
      const ticketProm = val.count > 0 ? val.totalLocal / val.count : 0;
      return {
        tipoVenta: typeKey,
        label: meta.label,
        color: meta.color,
        desc: meta.desc,
        count: val.count,
        totalLocal: Math.round(val.totalLocal * 100) / 100,
        ticketPromedioLocal: Math.round(ticketProm * 100) / 100
      };
    }).sort((a, b) => b.totalLocal - a.totalLocal);
  }, [countrySales]);

  // 3. Time Evolution Data in Local Currency (Line Chart)
  const timeEvolutionLocalData = useMemo(() => {
    const dateMap: Record<string, number> = {};
    countrySales.forEach(s => {
      dateMap[s.date] = (dateMap[s.date] || 0) + s.amountLocal;
    });

    return Object.entries(dateMap)
      .map(([fecha, montoLocal]) => ({
        fecha,
        montoLocal: Math.round(montoLocal * 100) / 100
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [countrySales]);

  return (
    <div id="country-detail-level2" className="space-y-6 animate-fade-in">
      
      {/* Country Selector Header Tabs */}
      <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f2335] pb-4 mb-4">
          <div>
            <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" /> Nivel 2 — Detalle por País ({activeCountry})
            </h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              Valores calculados en moneda local (<span className="text-emerald-400 font-bold">{activeCurrency}</span>)
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
            <span>SELECCIONAR PAÍS:</span>
          </div>
        </div>

        {/* Tab Buttons for Countries */}
        <div className="flex flex-wrap items-center gap-2">
          {availableCountries.map((cName) => {
            const curr = countriesConfig[cName]?.currency || 'LOCAL';
            const isActive = cName === activeCountry;
            return (
              <button
                key={cName}
                onClick={() => onSelectCountry(cName)}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
                  isActive 
                    ? 'bg-[#3b82f6] text-white border-[#3b82f6] shadow-lg shadow-blue-500/20' 
                    : 'bg-[#151926] text-gray-400 hover:text-white border-[#252b42] hover:border-[#3b82f6]/50'
                }`}
              >
                <Globe className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                <span>{cName}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#1f2335] text-gray-400'
                }`}>
                  {curr}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Local KPIs Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: Local Revenue */}
        <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 hover:border-[#2d3450] transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                Ventas Totales ({activeCurrency})
              </span>
              <span className="text-2xl font-display font-extrabold text-emerald-400 mt-1 block">
                {totalSalesLocal.toLocaleString()} <span className="text-xs font-mono text-emerald-500">{activeCurrency}</span>
              </span>
            </div>
            <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] font-mono text-gray-500">Facturación local en {activeCountry}</div>
        </div>

        {/* KPI 2: Sales Count */}
        <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 hover:border-[#2d3450] transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Nº de Ventas</span>
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

        {/* KPI 3: Local Ticket Promedio */}
        <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 hover:border-[#2d3450] transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                Ticket Promedio Global ({activeCurrency})
              </span>
              <span className="text-2xl font-display font-extrabold text-sky-400 mt-1 block">
                {ticketPromedioLocal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-mono text-sky-500">{activeCurrency}</span>
              </span>
            </div>
            <div className="p-2.5 bg-sky-500/10 rounded-lg text-sky-400 border border-sky-500/20">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] font-mono text-gray-500">Promedio general ponderado</div>
        </div>
      </div>

      {/* Key Feature: Desglose por tipo_venta con Ticket Promedio INDIVIDUAL */}
      <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 shadow-xl">
        <div className="border-b border-[#1f2335] pb-3 mb-4">
          <h3 className="font-display font-bold text-white text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" /> Desglose por Tipo de Venta (Moneda Local: {activeCurrency})
          </h3>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Cada modalidad cuenta con su propio Ticket Promedio aislado para evitar distorsiones entre ofertas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tipoVentaBreakdown.length === 0 ? (
            <div className="col-span-3 p-8 text-center text-gray-500 font-mono text-xs">
              Sin registros de ventas en {activeCountry} para el período.
            </div>
          ) : (
            tipoVentaBreakdown.map((item) => (
              <div 
                key={item.tipoVenta}
                className="bg-[#151926] border border-[#252b42] rounded-xl p-4 hover:border-[#3b82f6]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span 
                      className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border"
                      style={{ backgroundColor: `${item.color}15`, color: item.color, borderColor: `${item.color}30` }}
                    >
                      {item.label}
                    </span>
                    <span className="text-xs font-mono font-semibold text-gray-300">
                      {item.count} ventas
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono mb-3">{item.desc}</p>
                </div>

                <div className="space-y-2 pt-3 border-t border-[#1f2335]">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-400">Facturación Local:</span>
                    <span className="font-bold text-emerald-400">
                      {item.totalLocal.toLocaleString()} {activeCurrency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-400 font-semibold">Ticket Promedio:</span>
                    <span className="font-extrabold text-sky-300">
                      {item.ticketPromedioLocal.toLocaleString()} {activeCurrency}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Ventas por tipo_venta (Barras Moneda Local) */}
        <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-[#1f2335] pb-3">
            <div>
              <h3 className="font-display font-bold text-white text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#3b82f6]" /> Facturación por Tipo de Venta ({activeCurrency})
              </h3>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">Monto acumulado por oferta en {activeCountry}</p>
            </div>
          </div>
          <div className="h-72 w-full">
            {tipoVentaBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tipoVentaBreakdown} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2335" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#151926', borderColor: '#2d3450', borderRadius: '8px', color: '#ffffff', fontSize: '12px' }}
                    itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 600 }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 500 }}
                    formatter={(value: any) => [`${Number(value).toLocaleString()} ${activeCurrency}`, 'Facturación Local']}
                  />
                  <Bar dataKey="totalLocal" radius={[4, 4, 0, 0]}>
                    {tipoVentaBreakdown.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Evolución en el tiempo (Línea Moneda Local) */}
        <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-[#1f2335] pb-3">
            <div>
              <h3 className="font-display font-bold text-white text-sm flex items-center gap-2">
                <LineChartIcon className="w-4 h-4 text-emerald-400" /> Evolución Temporal ({activeCurrency})
              </h3>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">Comportamiento diario de ventas en {activeCountry}</p>
            </div>
          </div>
          <div className="h-72 w-full">
            {timeEvolutionLocalData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">Sin datos para el período</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeEvolutionLocalData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2335" vertical={false} />
                  <XAxis dataKey="fecha" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#151926', borderColor: '#2d3450', borderRadius: '8px', color: '#ffffff', fontSize: '12px' }}
                    itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 600 }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 500 }}
                    formatter={(value: any) => [`${Number(value).toLocaleString()} ${activeCurrency}`, 'Facturación Diaria']}
                  />
                  <Line type="monotone" dataKey="montoLocal" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
