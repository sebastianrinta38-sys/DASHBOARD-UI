/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Bot, MessageSquare, BadgeCheck, DollarSign, ArrowUpRight, BarChart3 } from 'lucide-react';
import { Sale } from '../types';

interface BotsSectionProps {
  sales: Sale[];
}

export default function BotsSection({ sales }: BotsSectionProps) {
  const botPerformance = useMemo(() => {
    const bots = [
      {
        name: 'Bot Carpintería Automatizado',
        type: 'Totalmente automatizado (enlaces directos)',
        contacts: 1420,
        conversations: 1200,
        avatar: '🤖'
      },
      {
        name: 'Bot Interactivo Planos',
        type: 'Carrusel de productos e interactivo',
        contacts: 980,
        conversations: 850,
        avatar: '📱'
      },
      {
        name: 'Bot Soporte Ventas',
        type: 'Asistencia manual / híbrido',
        contacts: 410,
        conversations: 390,
        avatar: '🧑‍🔧'
      }
    ];

    return bots.map(bot => {
      const botSales = sales.filter(s => s.bot === bot.name);
      const salesCount = botSales.length;
      const revenueUsd = botSales.reduce((acc, s) => acc + s.amountUsd, 0);
      const conversionRate = bot.contacts > 0 ? (salesCount / bot.contacts) * 100 : 0;
      const averageTicket = salesCount > 0 ? revenueUsd / salesCount : 0;

      return {
        ...bot,
        salesCount,
        revenueUsd,
        conversionRate,
        averageTicket
      };
    });
  }, [sales]);

  return (
    <div id="bots-analytics-section" className="space-y-6">
      
      {/* Bento Grid Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {botPerformance.map((bot) => (
          <div 
            key={bot.name}
            className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 hover:border-[#2d3450] transition-all relative overflow-hidden"
          >
            {/* Top Info */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-[22px] block mb-1">{bot.avatar}</span>
                <h3 className="font-display font-bold text-white text-sm truncate max-w-[200px]">{bot.name}</h3>
                <span className="text-[10px] text-gray-500 font-mono block mt-0.5">{bot.type}</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-800/20 rounded text-[10px] font-mono">
                {bot.conversionRate.toFixed(1)}% Conv
              </span>
            </div>

            {/* Performance metrics */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#1f2335] mt-4">
              <div>
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider block">Ventas (Entes)</span>
                <span className="text-base font-display font-bold text-white">{bot.salesCount}</span>
              </div>
              <div>
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider block">Facturación</span>
                <span className="text-base font-display font-bold text-emerald-400">${bot.revenueUsd.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bots Comparison Table */}
      <div className="bg-[#11131c] border border-[#1f2335] rounded-xl shadow-lg overflow-hidden">
        <div className="p-5 border-b border-[#1f2335]">
          <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#3b82f6]" /> Tabla de Embudos WhatsApp
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-0.5">Visibilidad detallada de la tasa de conversión contacto-a-venta por bot</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f111a] border-b border-[#1f2335]">
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider">Bot WhatsApp</th>
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">Contactos Generados</th>
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">Conversaciones Activas</th>
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">Ventas Reales</th>
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">Ticket Promedio</th>
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">Facturación USD</th>
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">Porcentaje de Cierre</th>
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
                  <td className="p-4 text-right font-mono text-sm text-gray-300">
                    {bot.contacts.toLocaleString()}
                  </td>
                  <td className="p-4 text-right font-mono text-sm text-gray-300">
                    {bot.conversations.toLocaleString()}
                  </td>
                  <td className="p-4 text-right font-mono text-sm font-semibold text-white">
                    {bot.salesCount}
                  </td>
                  <td className="p-4 text-right font-mono text-sm text-gray-300">
                    ${bot.averageTicket.toFixed(1)}
                  </td>
                  <td className="p-4 text-right font-mono text-sm font-bold text-emerald-400">
                    ${bot.revenueUsd.toLocaleString()}
                  </td>
                  <td className="p-4 text-right">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#1c2132] text-[#06b6d4] border border-[#2d3450]">
                      {bot.conversionRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
