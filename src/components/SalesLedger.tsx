/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sale } from '../types';
import { 
  Receipt, 
  Plus, 
  Trash2, 
  Edit, 
  PhoneCall, 
  ShoppingBag, 
  Bot, 
  Globe, 
  Calendar,
  AlertCircle
} from 'lucide-react';

interface SalesLedgerProps {
  sales: Sale[];
  onOpenCreateModal: () => void;
  onEditSale: (sale: Sale) => void;
  onDeleteSale: (id: string) => void;
}

export default function SalesLedger({
  sales,
  onOpenCreateModal,
  onEditSale,
  onDeleteSale,
}: SalesLedgerProps) {
  return (
    <div id="sales-ledger-section" className="bg-[#11131c] border border-[#1f2335] rounded-xl shadow-xl overflow-hidden">
      
      {/* Header action panel */}
      <div className="p-5 border-b border-[#1f2335] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#3b82f6]" /> Registro General de Ventas WhatsApp
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-0.5">Confirmaciones de pago de clientes (CRM de WhatsApp)</p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-blue-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Registrar Venta WhatsApp
        </button>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0f111a] border-b border-[#1f2335]">
              <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider">Fecha / Cliente</th>
              <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider">Contacto WhatsApp</th>
              <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider">País</th>
              <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider">Infoproducto</th>
              <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider">Bot Origen</th>
              <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">Monto Local</th>
              <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">Conversion USD</th>
              <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2335]">
            {sales.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-gray-500 font-mono text-sm">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-gray-600" />
                    <span>Ningún registro de venta coincide con los filtros aplicados.</span>
                    <button
                      onClick={onOpenCreateModal}
                      className="px-3 py-1.5 bg-[#1f2335] hover:bg-[#2e354f] text-[#3b82f6] border border-[#2d3450] rounded text-xs font-mono mt-2 cursor-pointer"
                    >
                      Crear primera venta manual
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-[#151926]/50 transition-colors">
                  {/* Date & Customer */}
                  <td className="p-4">
                    <div className="font-semibold text-white text-sm">
                      {sale.customerName}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-500" /> {sale.date}
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="p-4">
                    <div className="text-xs text-gray-300 font-mono flex items-center gap-1">
                      <PhoneCall className="w-3 h-3 text-[#3b82f6]" />
                      {sale.phone}
                    </div>
                    <div className="text-[9px] text-gray-500 font-mono">{sale.id}</div>
                  </td>

                  {/* Country */}
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#1c2132] text-gray-300 border border-[#2d3450]">
                      <Globe className="w-2.5 h-2.5 text-gray-400" />
                      {sale.country}
                    </span>
                  </td>

                  {/* Product */}
                  <td className="p-4">
                    <div className="text-xs text-white font-medium max-w-[180px] truncate flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3 text-[#06b6d4] shrink-0" />
                      {sale.product}
                    </div>
                  </td>

                  {/* Bot source */}
                  <td className="p-4">
                    <div className="text-xs text-gray-400 truncate max-w-[140px] flex items-center gap-1">
                      <Bot className="w-3 h-3 text-purple-400 shrink-0" />
                      {sale.bot}
                    </div>
                  </td>

                  {/* Local Price */}
                  <td className="p-4 text-right font-mono text-sm text-gray-300">
                    {sale.amountLocal.toLocaleString()} <span className="text-[10px] text-gray-500 font-bold">{sale.currency}</span>
                  </td>

                  {/* USD equivalence */}
                  <td className="p-4 text-right font-mono text-sm font-bold text-emerald-400">
                    ${sale.amountUsd.toFixed(2)}
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        title="Editar venta"
                        onClick={() => onEditSale(sale)}
                        className="p-1.5 bg-[#1c2132] hover:bg-sky-500/15 text-gray-400 hover:text-sky-400 rounded border border-[#2d3450] transition-all cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Eliminar venta"
                        onClick={() => {
                          if (confirm(`¿Estás seguro de eliminar el registro de ${sale.customerName}?`)) {
                            onDeleteSale(sale.id);
                          }
                        }}
                        className="p-1.5 bg-[#1c2132] hover:bg-rose-500/15 text-gray-400 hover:text-rose-400 rounded border border-[#2d3450] transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
