/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, RotateCcw, Calendar, Globe, Bot, ShoppingBag, SlidersHorizontal, CalendarDays } from 'lucide-react';
import { FilterState, Product } from '../types';
import { BOTS } from '../data/mockData';

interface TopBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onResetFilters: () => void;
  products: Product[];
  countriesConfig: Record<string, { currency: string; rate: number }>;
}

export default function TopBar({
  filters,
  setFilters,
  searchQuery,
  setSearchQuery,
  onResetFilters,
  products,
  countriesConfig,
}: TopBarProps) {
  const [customDays, setCustomDays] = useState<string>('');

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, country: e.target.value }));
  };

  const handleBotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, bot: e.target.value }));
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, product: e.target.value }));
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Pre-sets for quick filters (e.g. today, last 7 days, last 30 days)
  const setQuickDateRange = (days: number) => {
    const today = new Date('2026-07-18');
    const start = new Date('2026-07-18');
    start.setDate(today.getDate() - days);
    
    setFilters(prev => ({
      ...prev,
      startDate: start.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    }));
    setCustomDays('');
  };

  const setSpecificDayOffset = (offsetDays: number) => {
    const targetDate = new Date('2026-07-18');
    targetDate.setDate(targetDate.getDate() - offsetDays);
    const dateStr = targetDate.toISOString().split('T')[0];
    
    setFilters(prev => ({
      ...prev,
      startDate: dateStr,
      endDate: dateStr
    }));
    setCustomDays('');
  };

  return (
    <div id="top-bar-controls" className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 mb-6 shadow-xl">
      {/* Search and Quick date selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-[#1f2335]">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, teléfono o campaña..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151926] border border-[#252b42] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[10px] text-gray-400 font-mono hidden sm:inline tracking-wider">ACCESOS RÁPIDOS:</span>
          
          {/* Ranges */}
          <button 
            onClick={() => setQuickDateRange(0)}
            className={`px-2.5 py-1 bg-[#1c2132] hover:bg-[#252b42] text-xs font-mono rounded border text-gray-300 transition-colors cursor-pointer ${
              filters.startDate === '2026-07-18' && filters.endDate === '2026-07-18' ? 'border-[#3b82f6] text-white bg-[#1f2335]' : 'border-[#2d3450]'
            }`}
          >
            Hoy
          </button>
          <button 
            onClick={() => setSpecificDayOffset(1)}
            className={`px-2.5 py-1 bg-[#1c2132] hover:bg-[#252b42] text-xs font-mono rounded border text-gray-300 transition-colors cursor-pointer ${
              filters.startDate === '2026-07-17' && filters.endDate === '2026-07-17' ? 'border-[#3b82f6] text-white bg-[#1f2335]' : 'border-[#2d3450]'
            }`}
          >
            Ayer
          </button>
          <button 
            onClick={() => setQuickDateRange(7)}
            className={`px-2.5 py-1 bg-[#1c2132] hover:bg-[#252b42] text-xs font-mono rounded border text-gray-300 transition-colors cursor-pointer ${
              filters.startDate === '2026-07-11' && filters.endDate === '2026-07-18' ? 'border-[#3b82f6] text-white bg-[#1f2335]' : 'border-[#2d3450]'
            }`}
          >
            Últimos 7d
          </button>
          <button 
            onClick={() => setQuickDateRange(30)}
            className={`px-2.5 py-1 bg-[#1c2132] hover:bg-[#252b42] text-xs font-mono rounded border text-gray-300 transition-colors cursor-pointer ${
              filters.startDate === '2026-06-18' && filters.endDate === '2026-07-18' ? 'border-[#3b82f6] text-white bg-[#1f2335]' : 'border-[#2d3450]'
            }`}
          >
            Últimos 30d
          </button>

          {/* Custom range in days */}
          <div className="flex items-center gap-1 bg-[#151926] border border-[#252b42] rounded px-2 py-0.5">
            <span className="text-[9px] text-gray-400 font-mono uppercase">Rango:</span>
            <input 
              type="number"
              min="1"
              max="180"
              placeholder="Días"
              value={customDays}
              onChange={(e) => {
                const val = e.target.value;
                setCustomDays(val);
                const num = parseInt(val, 10);
                if (!isNaN(num) && num > 0) {
                  setQuickDateRange(num);
                }
              }}
              className="w-10 bg-transparent text-white text-xs font-mono font-bold focus:outline-none"
            />
            <span className="text-[9px] text-gray-500 font-mono">d</span>
          </div>

          {/* Specific day date picker */}
          <div className="flex items-center gap-1.5 bg-[#151926] border border-[#252b42] rounded px-2 py-0.5">
            <CalendarDays className="w-3 h-3 text-[#3b82f6]" />
            <span className="text-[9px] text-gray-400 font-mono uppercase">Día específico:</span>
            <input 
              type="date"
              value={filters.startDate === filters.endDate ? filters.startDate : ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  setFilters(prev => ({
                    ...prev,
                    startDate: val,
                    endDate: val
                  }));
                  setCustomDays('');
                }
              }}
              className="bg-transparent text-white text-[11px] font-mono focus:outline-none scheme-dark cursor-pointer h-4"
            />
          </div>

          <button 
            onClick={onResetFilters}
            title="Restablecer filtros"
            className="p-1.5 bg-[#1c2132] hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded border border-[#2d3450] transition-all ml-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid of Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Country Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono tracking-wider text-gray-400 flex items-center gap-1 uppercase">
            <Globe className="w-3 h-3 text-[#3b82f6]" /> País
          </label>
          <div className="relative">
            <select
              value={filters.country}
              onChange={handleCountryChange}
              className="w-full bg-[#151926] border border-[#252b42] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#3b82f6] appearance-none cursor-pointer"
            >
              <option value="All">Todos los Países</option>
              {Object.keys(countriesConfig).map(cName => (
                <option key={cName} value={cName}>
                  {cName} ({countriesConfig[cName].currency})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bot Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono tracking-wider text-gray-400 flex items-center gap-1 uppercase">
            <Bot className="w-3 h-3 text-[#3b82f6]" /> Bot de Origen
          </label>
          <select
            value={filters.bot}
            onChange={handleBotChange}
            className="w-full bg-[#151926] border border-[#252b42] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#3b82f6] appearance-none cursor-pointer"
          >
            <option value="All">Todos los Bots</option>
            {BOTS.map(bot => (
              <option key={bot} value={bot}>{bot}</option>
            ))}
          </select>
        </div>

        {/* Product Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono tracking-wider text-gray-400 flex items-center gap-1 uppercase">
            <ShoppingBag className="w-3 h-3 text-[#3b82f6]" /> Infoproducto
          </label>
          <select
            value={filters.product}
            onChange={handleProductChange}
            className="w-full bg-[#151926] border border-[#252b42] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#3b82f6] appearance-none cursor-pointer"
          >
            <option value="All">Todos los Productos</option>
            {products.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono tracking-wider text-gray-400 flex items-center gap-1 uppercase">
            <Calendar className="w-3 h-3 text-[#3b82f6]" /> Fecha Inicio
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
            className="w-full bg-[#151926] border border-[#252b42] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#3b82f6] scheme-dark cursor-pointer"
          />
        </div>

        {/* End Date */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono tracking-wider text-gray-400 flex items-center gap-1 uppercase">
            <Calendar className="w-3 h-3 text-[#3b82f6]" /> Fecha Fin
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
            className="w-full bg-[#151926] border border-[#252b42] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#3b82f6] scheme-dark cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
