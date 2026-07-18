/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ArrowUpDown, 
  CheckSquare, 
  Square, 
  Play, 
  Pause, 
  Trash2, 
  TrendingUp, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Activity, 
  Sparkles 
} from 'lucide-react';
import { AdCampaign, Sale } from '../types';

interface MetaAdsTableProps {
  campaigns: AdCampaign[];
  sales: Sale[];
  onToggleStatus: (id: string) => void;
  onBulkStatusChange: (ids: string[], newStatus: 'active' | 'paused') => void;
  onBulkDelete: (ids: string[]) => void;
}

type SortField = 'campaignName' | 'spend' | 'conversions' | 'cpa' | 'roas';
type SortOrder = 'asc' | 'desc';

export default function MetaAdsTable({
  campaigns,
  sales,
  onToggleStatus,
  onBulkStatusChange,
  onBulkDelete,
}: MetaAdsTableProps) {
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('spend');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    campaignName: true,
    country: true,
    spend: true,
    conversions: true,
    cpa: true,
    roas: true,
    status: true,
    action: true
  });

  // Calculate dynamic sales attribution for ROAS calculations
  const campaignsWithMetrics = useMemo(() => {
    return campaigns.map(camp => {
      // Attribute sales based on country matching
      // If campaign country is 'Todos', it gets sales from all countries that aren't purely local, 
      // or we can attribute proportionally. Let's do country matching:
      let attributedSalesUsd = 0;
      if (camp.country === 'Todos') {
        // Proportional split or general LATAM campaign attribution
        // Let's attribute 20% of all sales to the retargeting campaign
        attributedSalesUsd = sales.reduce((acc, s) => acc + s.amountUsd, 0) * 0.22;
      } else {
        // Match country exactly
        attributedSalesUsd = sales
          .filter(s => s.country === camp.country)
          .reduce((acc, s) => acc + s.amountUsd, 0);
      }

      // ROAS = attributed sales revenue / spend
      const roas = camp.spend > 0 ? (attributedSalesUsd / camp.spend) : 0;
      
      return {
        ...camp,
        roas
      };
    });
  }, [campaigns, sales]);

  // Handle Select All
  const handleSelectAll = () => {
    if (selectedIds.length === campaignsWithMetrics.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(campaignsWithMetrics.map(c => c.id));
    }
  };

  // Handle single Select
  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  // Handle Sort Change
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Sort & Filter data
  const sortedCampaigns = useMemo(() => {
    const sorted = [...campaignsWithMetrics];
    sorted.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }

      return sortOrder === 'asc' 
        ? valA - valB 
        : valB - valA;
    });
    return sorted;
  }, [campaignsWithMetrics, sortField, sortOrder]);

  // Decision state generator (ROAS Traffic Light)
  const getCampaignDecision = (roas: number) => {
    if (roas >= 3.0) {
      return { 
        label: 'Escalar', 
        color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/30',
        dot: 'bg-emerald-400' 
      };
    } else if (roas >= 2.0) {
      return { 
        label: 'Mantener', 
        color: 'text-sky-400 bg-sky-950/40 border-sky-800/30',
        dot: 'bg-sky-400' 
      };
    } else if (roas >= 1.0) {
      return { 
        label: 'Optimizar', 
        color: 'text-amber-400 bg-amber-950/40 border-amber-800/30',
        dot: 'bg-amber-400' 
      };
    } else {
      return { 
        label: 'Pausar', 
        color: 'text-rose-400 bg-rose-950/40 border-rose-800/30',
        dot: 'bg-rose-400' 
      };
    }
  };

  // Bulk Actions
  const handleBulkStatus = (status: 'active' | 'paused') => {
    onBulkStatusChange(selectedIds, status);
    setSelectedIds([]);
  };

  const handleBulkDeleteAction = () => {
    if (confirm(`¿Estás seguro de eliminar las ${selectedIds.length} campañas seleccionadas?`)) {
      onBulkDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  return (
    <div id="meta-ads-section" className="bg-[#11131c] border border-[#1f2335] rounded-xl shadow-xl overflow-hidden mb-6">
      
      {/* Header and Column Visibility Toggle */}
      <div className="p-5 border-b border-[#1f2335] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#3b82f6]" /> Rendimiento de Campañas Meta Ads
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-0.5">Semáforo de Decisiones Basado en Atribución de Ventas Reales (ROAS)</p>
        </div>

        {/* Column Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono text-gray-400 tracking-wider">VER COLUMNAS:</span>
          {Object.keys(visibleColumns).map((col) => {
            const isVisible = visibleColumns[col as keyof typeof visibleColumns];
            return (
              <button
                key={col}
                onClick={() => setVisibleColumns(prev => ({ ...prev, [col]: !isVisible }))}
                className={`px-2 py-1 rounded text-[10px] font-mono border transition-all ${
                  isVisible 
                    ? 'bg-[#1e2336] text-[#3b82f6] border-[#3b82f6]/40' 
                    : 'bg-[#0f111a] text-gray-500 border-[#1f2335]'
                }`}
              >
                {col === 'campaignName' ? 'Campaña' : col.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contextual Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div id="bulk-toolbar" className="bg-[#1f2335]/90 border-b border-[#3b82f6]/30 px-5 py-3 flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 bg-[#3b82f6] rounded-full text-white text-xs font-bold flex items-center justify-center font-mono">
              {selectedIds.length}
            </span>
            <span className="text-xs font-medium text-white">campañas seleccionadas</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatus('active')}
              className="px-3 py-1.5 bg-[#3b82f6]/20 hover:bg-[#3b82f6]/40 border border-[#3b82f6]/40 rounded text-xs font-medium text-white flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3 h-3 text-emerald-400" /> Activar
            </button>
            <button
              onClick={() => handleBulkStatus('paused')}
              className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded text-xs font-medium text-yellow-400 flex items-center gap-1.5 transition-colors"
            >
              <Pause className="w-3 h-3" /> Pausar
            </button>
            <button
              onClick={handleBulkDeleteAction}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded text-xs font-medium text-rose-400 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Responsive Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0f111a] border-b border-[#1f2335]">
              {/* Select Checkbox Column */}
              <th className="p-4 w-10 text-center">
                <button 
                  onClick={handleSelectAll} 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {selectedIds.length === campaignsWithMetrics.length ? (
                    <CheckSquare className="w-4.5 h-4.5 text-[#3b82f6]" />
                  ) : (
                    <Square className="w-4.5 h-4.5" />
                  )}
                </button>
              </th>

              {visibleColumns.status && <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider">Estado</th>}
              
              {visibleColumns.campaignName && (
                <th 
                  className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('campaignName')}
                >
                  <div className="flex items-center gap-1">
                    Campaña <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              )}

              {visibleColumns.country && <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider">País</th>}
              
              {visibleColumns.spend && (
                <th 
                  className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors text-right"
                  onClick={() => handleSort('spend')}
                >
                  <div className="flex items-center gap-1 justify-end">
                    Gasto <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              )}

              {visibleColumns.conversions && (
                <th 
                  className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors text-right"
                  onClick={() => handleSort('conversions')}
                >
                  <div className="flex items-center gap-1 justify-end">
                    Leads WA <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              )}

              {visibleColumns.cpa && (
                <th 
                  className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors text-right"
                  onClick={() => handleSort('cpa')}
                >
                  <div className="flex items-center gap-1 justify-end">
                    CPA (USD) <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              )}

              {visibleColumns.roas && (
                <th 
                  className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors text-right"
                  onClick={() => handleSort('roas')}
                >
                  <div className="flex items-center gap-1 justify-end">
                    ROAS <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              )}

              {visibleColumns.action && <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-center">Acción Directiva</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2335]">
            {sortedCampaigns.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-gray-500 font-mono text-sm">
                  Ninguna campaña de Meta Ads cumple con los filtros activos.
                </td>
              </tr>
            ) : (
              sortedCampaigns.map((camp) => {
                const isSelected = selectedIds.includes(camp.id);
                const decision = getCampaignDecision(camp.roas);
                return (
                  <tr 
                    key={camp.id}
                    className={`hover:bg-[#151926]/50 transition-colors ${isSelected ? 'bg-[#1f2335]/40' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleSelectOne(camp.id)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#3b82f6]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Status Toggle */}
                    {visibleColumns.status && (
                      <td className="p-4">
                        <button
                          onClick={() => onToggleStatus(camp.id)}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                            camp.status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-gray-500/10 text-gray-400 border border-gray-500/10'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${camp.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}></span>
                          {camp.status === 'active' ? 'Activo' : 'Pausado'}
                        </button>
                      </td>
                    )}

                    {/* Campaign Name */}
                    {visibleColumns.campaignName && (
                      <td className="p-4">
                        <div className="font-semibold text-white text-sm truncate max-w-xs sm:max-w-md">
                          {camp.campaignName}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">{camp.id}</div>
                      </td>
                    )}

                    {/* Country Badge */}
                    {visibleColumns.country && (
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                          camp.country === 'Todos' ? 'bg-purple-950/40 text-purple-400 border border-purple-800/20' : 'bg-[#1c2132] text-gray-300 border border-[#2d3450]'
                        }`}>
                          {camp.country}
                        </span>
                      </td>
                    )}

                    {/* Spend */}
                    {visibleColumns.spend && (
                      <td className="p-4 text-right font-mono text-sm font-medium text-white">
                        ${camp.spend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    )}

                    {/* Conversions */}
                    {visibleColumns.conversions && (
                      <td className="p-4 text-right font-mono text-sm text-gray-300">
                        {camp.conversions}
                      </td>
                    )}

                    {/* CPA */}
                    {visibleColumns.cpa && (
                      <td className="p-4 text-right font-mono text-sm text-white">
                        ${camp.cpa.toFixed(2)}
                      </td>
                    )}

                    {/* Dynamic ROAS */}
                    {visibleColumns.roas && (
                      <td className="p-4 text-right font-mono text-sm font-bold text-white">
                        {camp.roas > 0 ? `${camp.roas.toFixed(2)}x` : '0.00x'}
                      </td>
                    )}

                    {/* Decision Action Column */}
                    {visibleColumns.action && (
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold border tracking-wider uppercase ${decision.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${decision.dot}`}></span>
                          {decision.label}
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
