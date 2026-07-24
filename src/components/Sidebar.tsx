/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  Megaphone, 
  Bot, 
  Receipt, 
  Sparkles, 
  Settings, 
  LogOut,
  Hammer,
  TrendingUp,
  Globe,
  PiggyBank
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userEmail: string;
}

export default function Sidebar({ activeTab, setActiveTab, userEmail }: SidebarProps) {
  const navItems: Array<{ id: string; label: string; icon: any; disabled: boolean; badge?: string }> = [
    { id: 'dashboard', label: '1. Resumen General (USD)', icon: LayoutDashboard, disabled: false },
    { id: 'country', label: '2. Detalle por País', icon: Globe, disabled: false },
    { id: 'bots', label: '3. Rendimiento Bots Leona', icon: Bot, disabled: false },
    { id: 'ads', label: '4. Meta Ads & ROAS', icon: Megaphone, disabled: false },
    { id: 'ledger', label: 'Registro de Ventas', icon: Receipt, disabled: false },
    { id: 'accounting', label: 'Datos Contables', icon: PiggyBank, disabled: false },
  ];

  return (
    <aside id="sidebar-nav" className="w-64 bg-[#11131c] border-r border-[#1f2335] flex flex-col h-screen fixed left-0 top-0 z-20">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#1f2335] flex items-center space-x-3">
        <div className="w-9 h-9 bg-gradient-to-tr from-[#3b82f6] to-[#06b6d4] rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/10">
          <Hammer className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg leading-tight text-white tracking-wide">
            WoodAds <span className="text-xs font-mono font-medium text-[#3b82f6]">v2.0</span>
          </h1>
          <p className="text-[10px] text-gray-500 font-mono tracking-wider">CONSTRUCCIÓN LATAM</p>
        </div>
      </div>

      {/* Navigation Group */}
      <div className="flex-1 px-4 py-6 space-y-7 overflow-y-auto">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase px-3">JERARQUÍA DASHBOARD</span>
          <nav className="mt-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              if (item.disabled) {
                return (
                  <div
                    key={item.id}
                    title="Sección en desarrollo — Próximamente"
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-transparent cursor-not-allowed opacity-60"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4 text-gray-600" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
              }
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? 'bg-[#1f2335] text-white border-l-2 border-[#3b82f6] pl-2' 
                      : 'text-gray-400 hover:bg-[#151926] hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#3b82f6]' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase px-3">CONFIGURACIÓN</span>
          <nav className="mt-3 space-y-1">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === 'catalog' 
                  ? 'bg-[#1f2335] text-white border-l-2 border-[#3b82f6] pl-2' 
                  : 'text-gray-400 hover:bg-[#151926] hover:text-white'
              }`}
            >
              <Settings className={`w-4 h-4 ${activeTab === 'catalog' ? 'text-[#3b82f6]' : 'text-gray-400'}`} />
              <span>Catálogo y Países</span>
            </button>
          </nav>
        </div>
      </div>

      {/* User Information Profile footer */}
      <div className="p-4 border-t border-[#1f2335] bg-[#141722] flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-[#1e2336] flex items-center justify-center font-display font-semibold text-sm text-[#3b82f6] border border-[#2d3450]">
          {userEmail ? userEmail.substring(0, 2).toUpperCase() : 'SE'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">Sebastián Rinta</p>
          <p className="text-[10px] text-gray-400 font-mono truncate">{userEmail || 'sebastian@gmail.com'}</p>
        </div>
        <button 
          title="Cerrar Sesión" 
          onClick={() => alert('Acción de cierre de sesión segura simulada')}
          className="text-gray-500 hover:text-red-400 transition-colors duration-150"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
