/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Bot, MessageSquare, BadgeCheck, DollarSign, ArrowUpRight, BarChart3, Layers, Globe } from 'lucide-react';
import { Sale, ResumenPorAnuncio } from '../types';

interface BotsSectionProps {
  sales: Sale[];
  rawBots?: Array<{ id: string; nombre: string; numero: string; paises?: { nombre: string } }>;
  resumenPorAnuncio?: ResumenPorAnuncio[];
}

export default function BotsSection({ sales, rawBots = [], resumenPorAnuncio = [] }: BotsSectionProps) {
  // Dynamically compute bot performance for all unique bots present in rawBots or sales
  const botPerformance = useMemo(() => {
    // Collect all bot names
    const botNames = Array.from(
      new Set([
        ...rawBots.map(b => b.nombre),
        ...sales.map(s => s.bot)
      ].filter(Boolean))
    );

    return botNames.map(name => {
      const botSales = sales.filter(s => s.bot === name);
      const salesCount = botSales.length;
      const revenueUsd = botSales.reduce((acc, s) => acc + s.amountUsd, 0);
      const averageTicket = salesCount > 0 ? revenueUsd / salesCount : 0;
      
      // Info from rawBots
      const rawInfo = rawBots.find(b => b.nombre === name);
      const phoneNum = rawInfo?.numero || 'Activo';

      return {
        name,
        phoneNum,
        salesCount,
        revenueUsd,
        averageTicket,
      };
    });
  }, [sales, rawBots]);

  return (
    <div id="bots-analytics-section" className="space-y-6">
      
      {/* Bento Grid Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {botPerformance.map((bot) => (
          <div 
            key={bot.name}
            className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 hover:border-[#2d3450] transition-all relative overflow-hidden flex flex-col justify-between"
          >
            {/* Top Info */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-[20px] block mb-1">🤖</span>
                <h3 className="font-display font-bold text-white text-sm truncate max-w-[170px]">{bot.name}</h3>
                <span className="text-[10px] text-gray-500 font-mono block mt-0.5">{bot.phoneNum}</span>
              </div>
              <span className="px-2 py-0.5 bg-blue-950/40 text-blue-400 border border-blue-800/20 rounded text-[10px] font-mono">
                {bot.salesCount} Ventas
              </span>
            </div>

            {/* Performance metrics */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#1f2335] mt-2">
              <div>
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider block">Facturación</span>
                <span className="text-base font-display font-bold text-emerald-400">${bot.revenueUsd.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider block">Ticket Prom.</span>
                <span className="text-sm font-display font-bold text-gray-200">${bot.averageTicket.toFixed(1)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bots Comparison Table */}
      <div className="bg-[#11131c] border border-[#1f2335] rounded-xl shadow-lg overflow-hidden">
        <div className="p-5 border-b border-[#1f2335]">
          <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#3b82f6]" /> Rendimiento por Bot de WhatsApp
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-0.5">Métricas dinámicas calculadas desde las ventas en Supabase</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f111a] border-b border-[#1f2335]">
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider">Bot WhatsApp</th>
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">Ventas Reales</th>
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">Ticket Promedio</th>
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">Facturación Total USD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2335]">
              {botPerformance.map((bot) => (
                <tr key={bot.name} className="hover:bg-[#151926]/50 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-white text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span>
                      {bot.name}
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono text-sm font-semibold text-white">
                    {bot.salesCount}
                  </td>
                  <td className="p-4 text-right font-mono text-sm text-gray-300">
                    ${bot.averageTicket.toFixed(2)}
                  </td>
                  <td className="p-4 text-right font-mono text-sm font-bold text-emerald-400">
                    ${bot.revenueUsd.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supabase View: resumen_por_anuncio */}
      {resumenPorAnuncio.length > 0 && (
        <div className="bg-[#11131c] border border-[#1f2335] rounded-xl shadow-lg overflow-hidden">
          <div className="p-5 border-b border-[#1f2335]">
            <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" /> Vista Supabase: Resumen por Anuncio (Meta Ads & Bots)
            </h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">Datos agregados directamente de la vista SQL <code className="text-purple-300 font-bold">resumen_por_anuncio</code></p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0f111a] border-b border-[#1f2335]">
                  <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider">ID Anuncio</th>
                  <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider">País</th>
                  <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider">Bot</th>
                  <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">Número Ventas</th>
                  <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">Facturación</th>
                  <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">Ticket Promedio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2335]">
                {resumenPorAnuncio.map((row, idx) => (
                  <tr key={`${row.idAnuncio}-${row.pais}-${idx}`} className="hover:bg-[#151926]/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-sky-400 font-medium">
                      {row.idAnuncio}
                    </td>
                    <td className="p-4 text-xs text-gray-300 font-mono">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#1c2132] border border-[#2d3450]">
                        <Globe className="w-2.5 h-2.5 text-gray-400" />
                        {row.pais}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-purple-300 font-mono">
                      {row.bot}
                    </td>
                    <td className="p-4 text-right font-mono text-sm text-white font-semibold">
                      {row.numeroVentas}
                    </td>
                    <td className="p-4 text-right font-mono text-sm font-bold text-emerald-400">
                      ${row.facturacion.toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-mono text-sm text-gray-300">
                      ${row.ticketPromedio.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
