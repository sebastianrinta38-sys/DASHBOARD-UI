import React, { useState, useMemo } from 'react';
import { 
  Bot, 
  Globe, 
  BarChart3, 
  LineChart as LineChartIcon, 
  Layers, 
  Award, 
  PieChart as PieChartIcon,
  CheckCircle2
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

interface BotsPerformanceViewProps {
  sales: Sale[];
  rawBots: Array<{ id: string; nombre: string; numero: string; paises?: { nombre: string } }>;
  countriesConfig: Record<string, CountryConfig>;
}

export default function BotsPerformanceView({ sales, rawBots = [], countriesConfig }: BotsPerformanceViewProps) {
  // 1. Calculate Consolidated Performance by Country via Bot Leona
  const totalGlobalUsd = useMemo(() => sales.reduce((acc, s) => acc + s.amountUsd, 0), [sales]);

  const countryBotPerformance = useMemo(() => {
    // Unique countries from sales or config
    const countryList = Array.from(new Set([
      ...sales.map(s => s.country),
      ...Object.keys(countriesConfig)
    ].filter(Boolean)));

    return countryList.map(pais => {
      const countrySales = sales.filter(s => s.country === pais);
      const salesCount = countrySales.length;
      const totalUsd = countrySales.reduce((acc, s) => acc + s.amountUsd, 0);
      const ticketPromedioUsd = salesCount > 0 ? totalUsd / salesCount : 0;
      const pctOfTotal = totalGlobalUsd > 0 ? (totalUsd / totalGlobalUsd) * 100 : 0;
      
      const currency = countrySales[0]?.currency || countriesConfig[pais]?.currency || 'USD';

      return {
        pais,
        botName: 'Leona',
        salesCount,
        totalUsd: Math.round(totalUsd * 100) / 100,
        ticketPromedioUsd: Math.round(ticketPromedioUsd * 100) / 100,
        pctOfTotal: Number(pctOfTotal.toFixed(1)),
        currency
      };
    }).sort((a, b) => b.totalUsd - a.totalUsd);
  }, [sales, countriesConfig, totalGlobalUsd]);

  // Selected Country for Nivel 3 Country-specific Bot Breakdown
  const [selectedBotCountry, setSelectedBotCountry] = useState<string>(
    countryBotPerformance[0]?.pais || 'Colombia'
  );

  // Filter Sales for selected bot country
  const selectedBotSales = useMemo(() => {
    return sales.filter(s => s.country === selectedBotCountry);
  }, [sales, selectedBotCountry]);

  // Desglose por tipo_venta for the selected country's bot Leona
  const botTipoVentaBreakdown = useMemo(() => {
    const map: Record<string, { count: number; totalUsd: number; totalLocal: number }> = {};
    selectedBotSales.forEach(s => {
      const type = s.tipoVenta || 'contribucion_inicial';
      if (!map[type]) map[type] = { count: 0, totalUsd: 0, totalLocal: 0 };
      map[type].count += 1;
      map[type].totalUsd += s.amountUsd;
      map[type].totalLocal += s.amountLocal;
    });

    return Object.entries(map).map(([typeKey, val]) => {
      const ticketPromUsd = val.count > 0 ? val.totalUsd / val.count : 0;
      const ticketPromLocal = val.count > 0 ? val.totalLocal / val.count : 0;
      return {
        tipoVenta: typeKey,
        count: val.count,
        totalUsd: Math.round(val.totalUsd * 100) / 100,
        ticketPromedioUsd: Math.round(ticketPromUsd * 100) / 100,
        totalLocal: Math.round(val.totalLocal * 100) / 100,
        ticketPromedioLocal: Math.round(ticketPromLocal * 100) / 100
      };
    }).sort((a, b) => b.totalUsd - a.totalUsd);
  }, [selectedBotSales]);

  // Trend over time for selected country's bot
  const botTimeTrendData = useMemo(() => {
    const map: Record<string, number> = {};
    selectedBotSales.forEach(s => {
      map[s.date] = (map[s.date] || 0) + s.amountUsd;
    });

    return Object.entries(map)
      .map(([fecha, montoUsd]) => ({
        fecha,
        montoUsd: Math.round(montoUsd * 100) / 100
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [selectedBotSales]);

  return (
    <div id="bots-performance-level3" className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" /> Nivel 3 — Rendimiento de Bots Leona por País
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Comparativa de rendimiento por canalización de WhatsApp Bot (Leona) en cada mercado
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-950/30 text-purple-300 border border-purple-800/30 rounded-lg text-xs font-mono font-semibold">
          <CheckCircle2 className="w-4 h-4 text-purple-400" />
          <span>Bot Unificado: Leona</span>
        </div>
      </div>

      {/* 1. Vista Consolidada (Tabla de Rendimiento por País) */}
      <div className="bg-[#11131c] border border-[#1f2335] rounded-xl shadow-lg overflow-hidden">
        <div className="p-5 border-b border-[#1f2335]">
          <h3 className="font-display font-bold text-white text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#3b82f6]" /> Comparativa Consolidada por País (Bot Leona)
          </h3>
          <p className="text-xs text-gray-500 font-mono mt-0.5">Métricas generales de conversión y facturación por mercado</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f111a] border-b border-[#1f2335]">
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider">País</th>
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider">Bot</th>
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">Ventas Totales</th>
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">Ticket Promedio (USD)</th>
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">Facturación USD</th>
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">% del Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2335]">
              {countryBotPerformance.map((row) => (
                <tr 
                  key={row.pais} 
                  onClick={() => setSelectedBotCountry(row.pais)}
                  className={`hover:bg-[#151926]/80 transition-colors cursor-pointer ${
                    row.pais === selectedBotCountry ? 'bg-[#1f2335]/60' : ''
                  }`}
                >
                  <td className="p-4">
                    <div className="font-semibold text-white text-sm flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-gray-400" />
                      {row.pais}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono bg-purple-950/40 text-purple-300 border border-purple-800/30 font-semibold">
                      <Bot className="w-3 h-3 text-purple-400" /> {row.botName}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono text-sm text-white font-semibold">
                    {row.salesCount}
                  </td>
                  <td className="p-4 text-right font-mono text-sm text-sky-400 font-semibold">
                    ${row.ticketPromedioUsd.toFixed(2)}
                  </td>
                  <td className="p-4 text-right font-mono text-sm font-bold text-emerald-400">
                    ${row.totalUsd.toLocaleString()}
                  </td>
                  <td className="p-4 text-right">
                    <span className="inline-block px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#1c2132] text-[#06b6d4] border border-[#2d3450]">
                      {row.pctOfTotal}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Vista por País Especifico para el Bot Leona */}
      <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1f2335] pb-4">
          <div>
            <h3 className="font-display font-bold text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" /> Detalle del Bot Leona en {selectedBotCountry}
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              Desglose de rendimiento por modalidad de venta y tendencia temporal
            </p>
          </div>

          {/* Quick country switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400">PAÍS:</span>
            <select
              value={selectedBotCountry}
              onChange={(e) => setSelectedBotCountry(e.target.value)}
              className="bg-[#151926] border border-[#252b42] text-white text-xs font-mono rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
            >
              {countryBotPerformance.map(r => (
                <option key={r.pais} value={r.pais}>{r.pais}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Desglose por tipo_venta del Bot */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {botTipoVentaBreakdown.length === 0 ? (
            <div className="col-span-3 p-6 text-center text-gray-500 font-mono text-xs">
              Sin registros para Bot Leona en {selectedBotCountry}
            </div>
          ) : (
            botTipoVentaBreakdown.map((item) => (
              <div key={item.tipoVenta} className="bg-[#151926] border border-[#252b42] rounded-xl p-4">
                <span className="px-2 py-0.5 bg-blue-950/40 text-blue-400 border border-blue-800/30 rounded text-[10px] font-mono font-bold uppercase block w-fit mb-2">
                  {item.tipoVenta}
                </span>
                <div className="text-xl font-display font-extrabold text-white mb-2">
                  {item.count} ventas
                </div>
                <div className="space-y-1 text-xs font-mono border-t border-[#1f2335] pt-2">
                  <div className="flex justify-between text-gray-400">
                    <span>Facturación USD:</span>
                    <span className="text-emerald-400 font-bold">${item.totalUsd.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Ticket Prom. USD:</span>
                    <span className="text-sky-300 font-bold">${item.ticketPromedioUsd.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Gráfica de Tendencia de Ventas en el Tiempo para este Bot */}
        <div className="bg-[#151926] border border-[#252b42] rounded-xl p-4">
          <h4 className="font-display font-bold text-white text-xs flex items-center gap-2 mb-3">
            <LineChartIcon className="w-3.5 h-3.5 text-purple-400" /> Tendencia Temporal (Bot Leona - {selectedBotCountry})
          </h4>
          <div className="h-60 w-full">
            {botTimeTrendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">Sin datos temporales</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={botTimeTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2335" vertical={false} />
                  <XAxis dataKey="fecha" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#151926', borderColor: '#2d3450', borderRadius: '8px', color: '#ffffff', fontSize: '12px' }}
                    itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 600 }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 500 }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()} USD`, 'Facturación Bot']}
                  />
                  <Line type="monotone" dataKey="montoUsd" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
