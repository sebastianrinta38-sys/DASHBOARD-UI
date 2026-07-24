/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell
} from 'recharts';
import { Sale, AdCampaign } from '../types';
import { TrendingUp, BarChart3, Bot } from 'lucide-react';

interface ChartsSectionProps {
  sales: Sale[];
  campaigns: AdCampaign[];
}

export default function ChartsSection({ sales, campaigns }: ChartsSectionProps) {
  // 1. Line Chart Data: Sales Revenue USD vs. Ad Spend USD daily
  const lineChartData = useMemo(() => {
    // Generate dates list for the last 15 active days (to keep the chart clean and crisp on any display size)
    const dates: string[] = [];
    const baseTime = new Date('2026-07-18');
    for (let i = 14; i >= 0; i--) {
      const d = new Date(baseTime.getTime() - i * 24 * 60 * 60 * 1000);
      dates.push(d.toISOString().split('T')[0]);
    }

    // Distribute total spend of active campaigns proportionally across these 15 days
    // Colombian Campaigns spend, etc., can be simulated as daily averages
    const totalDailySpend = campaigns.reduce((acc, c) => acc + c.spend, 0) / 15;

    return dates.map(dateString => {
      // Sum sales for this date
      const daysSales = sales.filter(s => s.date === dateString);
      const revenue = daysSales.reduce((acc, s) => acc + s.amountUsd, 0);
      
      // Let's add slight random fluctuation to daily spend for realism
      const seed = dateString.charCodeAt(dateString.length - 1);
      const spendFluctuation = 1 + ((seed % 10) - 5) / 25; // +/- 20%
      const spend = Math.round(totalDailySpend * spendFluctuation * 100) / 100;

      return {
        fecha: dateString.substring(5), // MM-DD format for readable axes
        'Ventas (USD)': Math.round(revenue * 100) / 100,
        'Gasto Meta (USD)': spend,
      };
    });
  }, [sales, campaigns]);

  // 2. Bar Chart Data: Performance by WhatsApp Bot
  const botChartData = useMemo(() => {
    // Unique bots
    const botNames = ['Bot Carpintería Automatizado', 'Bot Interactivo Planos', 'Bot Soporte Ventas'];

    return botNames.map(name => {
      const botSales = sales.filter(s => s.bot === name);
      const revenue = botSales.reduce((acc, s) => acc + s.amountUsd, 0);
      const salesCount = botSales.length;

      // Simulate contact leads processed by each bot
      // Let's make "Bot Carpintería Automatizado" have high volume, "Bot Soporte" have low volume but high value
      let contacts = 1200;
      if (name === 'Bot Interactivo Planos') contacts = 950;
      if (name === 'Bot Soporte Ventas') contacts = 400; // Manual support, higher closing rate!

      const conversionRate = contacts > 0 ? (salesCount / contacts) * 100 : 0;

      return {
        name: name.replace('Bot ', ''), // shortened for axis labels
        'Facturación (USD)': Math.round(revenue),
        'Ventas Reales': salesCount,
        'Tasa Cierre (%)': Math.round(conversionRate * 10) / 10,
      };
    });
  }, [sales]);

  // Custom tooltips styling for dark dashboard theme
  const customTooltipStyle = {
    contentStyle: {
      backgroundColor: '#151926',
      borderColor: '#2d3450',
      borderRadius: '8px',
      color: '#ffffff',
      fontSize: '12px',
      fontFamily: 'var(--font-mono)'
    },
    itemStyle: {
      color: '#ffffff',
      fontSize: '12px',
      fontWeight: 600
    },
    labelStyle: {
      color: '#94a3b8',
      marginBottom: '4px'
    }
  };

  return (
    <div id="charts-grid-container" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      
      {/* Sales vs Spend Line Chart */}
      <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-display font-bold text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#3b82f6]" /> Ingresos vs Gasto Meta
            </h3>
            <p className="text-[11px] text-gray-500 font-mono">Tendencia de facturación diaria vs inversión de ads</p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-sky-950/40 text-sky-400 rounded border border-sky-800/20">Últimos 15 días</span>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2335" />
              <XAxis 
                dataKey="fecha" 
                stroke="#4a526d" 
                fontSize={10} 
                fontFamily="var(--font-mono)" 
              />
              <YAxis 
                stroke="#4a526d" 
                fontSize={10} 
                fontFamily="var(--font-mono)" 
                tickFormatter={(value) => `$${value}`} 
              />
              <Tooltip {...customTooltipStyle} formatter={(value) => [`$${value}`, '']} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontFamily: 'var(--font-sans)' }} />
              <Line 
                type="monotone" 
                dataKey="Ventas (USD)" 
                stroke="#06b6d4" 
                strokeWidth={3} 
                dot={{ r: 3, stroke: '#06b6d4', strokeWidth: 1, fill: '#11131c' }}
                activeDot={{ r: 5 }} 
              />
              <Line 
                type="monotone" 
                dataKey="Gasto Meta (USD)" 
                stroke="#a855f7" 
                strokeWidth={2} 
                strokeDasharray="4 4"
                dot={{ r: 2, stroke: '#a855f7', strokeWidth: 1, fill: '#11131c' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* WhatsApp Bot Conversion Performance Bar Chart */}
      <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-display font-bold text-white flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#3b82f6]" /> Rendimiento por Bot de WhatsApp
            </h3>
            <p className="text-[11px] text-gray-500 font-mono">Comparativa de facturación e índice de cierre</p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950/40 text-emerald-400 rounded border border-emerald-800/20 flex items-center gap-1">
            <Bot className="w-3 h-3" /> Embudo WA
          </span>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={botChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2335" />
              <XAxis 
                dataKey="name" 
                stroke="#4a526d" 
                fontSize={10} 
                fontFamily="var(--font-sans)" 
              />
              <YAxis 
                stroke="#4a526d" 
                fontSize={10} 
                fontFamily="var(--font-mono)" 
                yAxisId="left"
                tickFormatter={(value) => `$${value}`}
              />
              <YAxis 
                stroke="#4a526d" 
                fontSize={10} 
                fontFamily="var(--font-mono)" 
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip {...customTooltipStyle} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontFamily: 'var(--font-sans)' }} />
              <Bar 
                yAxisId="left"
                dataKey="Facturación (USD)" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
              >
                {botChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : index === 1 ? '#06b6d4' : '#f59e0b'} />
                ))}
              </Bar>
              <Bar 
                yAxisId="right"
                dataKey="Tasa Cierre (%)" 
                fill="#a855f7" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
