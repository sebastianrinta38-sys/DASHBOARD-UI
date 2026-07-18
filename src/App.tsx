/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import KPICards from './components/KPICards';
import ChartsSection from './components/ChartsSection';
import MetaAdsTable from './components/MetaAdsTable';
import SalesLedger from './components/SalesLedger';
import BotsSection from './components/BotsSection';
import AIAdvisor from './components/AIAdvisor';
import CreateSaleModal from './components/CreateSaleModal';
import CatalogManagement from './components/CatalogManagement';
import { Sale, AdCampaign, FilterState, Product } from './types';
import { INITIAL_SALES, INITIAL_CAMPAIGNS, PRODUCTS, EXCHANGE_RATES } from './data/mockData';
import { CheckCircle2, AlertTriangle, Info, Sparkles, X, Plus } from 'lucide-react';

export default function App() {
  // Core application states (loaded with rich default mock data)
  const [sales, setSales] = useState<Sale[]>(() => {
    const local = localStorage.getItem('woodads_sales');
    return local ? JSON.parse(local) : INITIAL_SALES;
  });

  const [campaigns, setCampaigns] = useState<AdCampaign[]>(() => {
    const local = localStorage.getItem('woodads_campaigns');
    return local ? JSON.parse(local) : INITIAL_CAMPAIGNS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const local = localStorage.getItem('woodads_products');
    return local ? JSON.parse(local) : PRODUCTS;
  });

  const [countriesConfig, setCountriesConfig] = useState<Record<string, { currency: string; rate: number }>>(() => {
    const local = localStorage.getItem('woodads_countries_config');
    return local ? JSON.parse(local) : EXCHANGE_RATES;
  });

  // Persist states to localStorage for instant subsequent loads
  useEffect(() => {
    localStorage.setItem('woodads_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('woodads_campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem('woodads_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('woodads_countries_config', JSON.stringify(countriesConfig));
  }, [countriesConfig]);

  // Active view state
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    startDate: '2026-06-18', // 30 days range by default
    endDate: '2026-07-18',
    country: 'All',
    bot: 'All',
    product: 'All'
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Toast notification system
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'info'; id: number } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    const id = Date.now();
    setToast({ message, type, id });
  };

  // Auto clear toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Reset Filters Handler
  const handleResetFilters = () => {
    setFilters({
      startDate: '2026-06-18',
      endDate: '2026-07-18',
      country: 'All',
      bot: 'All',
      product: 'All'
    });
    setSearchQuery('');
    showToast('Filtros restablecidos al periodo de 30 días.', 'info');
  };

  // Modal Control States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // Filter computation logic (Memoized for peak TanStack/React performance)
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Date Check
      if (sale.date < filters.startDate || sale.date > filters.endDate) return false;
      
      // Country Check
      if (filters.country !== 'All' && sale.country !== filters.country) return false;
      
      // Bot Check
      if (filters.bot !== 'All' && sale.bot !== filters.bot) return false;
      
      // Product Check
      if (filters.product !== 'All' && sale.product !== filters.product) return false;

      // Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = sale.customerName.toLowerCase().includes(query);
        const matchesPhone = sale.phone.toLowerCase().includes(query);
        const matchesProduct = sale.product.toLowerCase().includes(query);
        const matchesId = sale.id.toLowerCase().includes(query);
        return matchesName || matchesPhone || matchesProduct || matchesId;
      }

      return true;
    });
  }, [sales, filters, searchQuery]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(camp => {
      // Country Check
      if (filters.country !== 'All' && camp.country !== filters.country && camp.country !== 'Todos') return false;

      // Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = camp.campaignName.toLowerCase().includes(query);
        const matchesCountry = camp.country.toLowerCase().includes(query);
        const matchesId = camp.id.toLowerCase().includes(query);
        return matchesName || matchesCountry || matchesId;
      }

      return true;
    });
  }, [campaigns, filters, searchQuery]);

  // MUTATIONS (Optimistic UI state changes with immediate toast updates)

  // Toggle single Campaign status
  const handleToggleCampaignStatus = (id: string) => {
    setCampaigns(prev => prev.map(camp => {
      if (camp.id === id) {
        const newStatus = camp.status === 'active' ? 'paused' : 'active';
        showToast(`Campaña ${camp.campaignName} cambiada a ${newStatus === 'active' ? 'Activa' : 'Pausada'}.`, 'info');
        return { ...camp, status: newStatus };
      }
      return camp;
    }));
  };

  // Bulk status update for multi-selection in Meta Ads Table
  const handleBulkCampaignStatusChange = (ids: string[], newStatus: 'active' | 'paused') => {
    setCampaigns(prev => prev.map(camp => {
      if (ids.includes(camp.id)) {
        return { ...camp, status: newStatus };
      }
      return camp;
    }));
    showToast(`Estado de ${ids.length} campañas modificado a ${newStatus === 'active' ? 'Activo' : 'Pausado'}.`, 'success');
  };

  // Bulk delete for multi-selection
  const handleBulkCampaignDelete = (ids: string[]) => {
    setCampaigns(prev => prev.filter(camp => !ids.includes(camp.id)));
    showToast(`${ids.length} campañas eliminadas correctamente.`, 'warning');
  };

  // Open creator modal
  const handleOpenCreateModal = () => {
    setEditingSale(null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (sale: Sale) => {
    setEditingSale(sale);
    setIsModalOpen(true);
  };

  // Delete transaction
  const handleDeleteSale = (id: string) => {
    const deletedSale = sales.find(s => s.id === id);
    setSales(prev => prev.filter(s => s.id !== id));
    showToast(`Venta de ${deletedSale?.customerName || 'Cliente'} eliminada.`, 'warning');
  };

  // Submit modal creator or editor
  const handleSaleFormSubmit = (saleData: Omit<Sale, 'id'>) => {
    if (editingSale) {
      // Editing Mode
      setSales(prev => prev.map(s => {
        if (s.id === editingSale.id) {
          return { ...s, ...saleData };
        }
        return s;
      }));
      showToast(`Venta de ${saleData.customerName} actualizada con éxito.`);
    } else {
      // Create Mode (Optimistic addition)
      const newSale: Sale = {
        id: `SALE-${Math.floor(10000 + Math.random() * 90000)}`,
        ...saleData
      };
      setSales(prev => [newSale, ...prev]);
      showToast(`Venta registrada: ${saleData.customerName} por ${saleData.amountLocal.toLocaleString()} ${saleData.currency}.`);
    }
  };

  return (
    <div id="dashboard-app-root" className="min-h-screen bg-[#0b0c10] text-[#e4e6eb] font-sans flex">
      {/* Persistent Left Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userEmail="sebastianrinta38@gmail.com" />

      {/* Main Layout Container */}
      <main className="flex-1 pl-64 min-h-screen flex flex-col">
        
        {/* Global sticky/floating notification toast */}
        {toast && (
          <div 
            id="toast-notification"
            className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border transition-all duration-300 transform translate-y-0 ${
              toast.type === 'success' 
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' 
                : toast.type === 'warning'
                ? 'bg-rose-950/90 text-rose-300 border-rose-500/40'
                : 'bg-sky-950/90 text-sky-300 border-sky-500/40'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : toast.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            ) : (
              <Info className="w-5 h-5 text-sky-400" />
            )}
            <span className="text-xs font-semibold font-mono">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-gray-400 hover:text-white ml-2 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Outer view frame content padding */}
        <div className="p-8 flex-1 max-w-7xl w-full mx-auto space-y-6">
          
          {/* Header section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1f2335]">
            <div>
              <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
                {activeTab === 'dashboard' && 'Resumen Ejecutivo Multipaís'}
                {activeTab === 'ads' && 'Monitoreo de Meta Ads'}
                {activeTab === 'bots' && 'Embudo de Bots WhatsApp'}
                {activeTab === 'ledger' && 'Libro de Ventas Reales'}
                {activeTab === 'advisor' && 'Recomendaciones Estratégicas de IA'}
                {activeTab === 'catalog' && 'Gestión de Catálogo e Integraciones'}
              </h2>
              <p className="text-xs text-gray-400 font-mono mt-1">
                {activeTab === 'dashboard' && 'Visión unificada de ventas y retornos publicitarios (ROAS)'}
                {activeTab === 'ads' && 'Campañas activas, costes de adquisición y decisiones presupuestarias'}
                {activeTab === 'bots' && 'Monitoreo de conversiones de leads a clientes en tus flujos automatizados'}
                {activeTab === 'ledger' && 'Historial de pagos conciliados y ventas manuales registradas'}
                {activeTab === 'advisor' && 'Directrices técnicas impulsadas por Gemini para escalar o pausar campañas'}
                {activeTab === 'catalog' && 'Administración dinámica de tus infoproductos activos y conversiones cambiarias'}
              </p>
            </div>

            {/* Quick manual log trigger */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-mono hidden md:inline">JULIO 18, 2026</span>
              <button
                onClick={handleOpenCreateModal}
                className="px-3.5 py-1.5 bg-[#1f2335] hover:bg-[#2d3450] text-[#3b82f6] hover:text-white border border-[#3b82f6]/30 hover:border-[#3b82f6] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Registrar Venta
              </button>
            </div>
          </div>

          {/* Core Controls & Filter bar */}
          <TopBar 
            filters={filters} 
            setFilters={setFilters} 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onResetFilters={handleResetFilters}
            products={products}
            countriesConfig={countriesConfig}
          />

          {/* RENDER ACTIVE TAB PANELS */}

          {/* 1. Dashboard Overview */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              {/* KPIs Section */}
              <KPICards 
                sales={filteredSales} 
                campaigns={filteredCampaigns} 
                activeCountry={filters.country} 
                countriesConfig={countriesConfig}
              />

              {/* Recharts Graphics */}
              <ChartsSection sales={filteredSales} campaigns={filteredCampaigns} />

              {/* Core campaigns table */}
              <MetaAdsTable 
                campaigns={filteredCampaigns} 
                sales={filteredSales}
                onToggleStatus={handleToggleCampaignStatus}
                onBulkStatusChange={handleBulkCampaignStatusChange}
                onBulkDelete={handleBulkCampaignDelete}
              />
            </div>
          )}

          {/* 2. Stand-alone Meta Ads list */}
          {activeTab === 'ads' && (
            <div className="animate-fade-in">
              <KPICards 
                sales={filteredSales} 
                campaigns={filteredCampaigns} 
                activeCountry={filters.country} 
                countriesConfig={countriesConfig}
              />
              <MetaAdsTable 
                campaigns={filteredCampaigns} 
                sales={filteredSales}
                onToggleStatus={handleToggleCampaignStatus}
                onBulkStatusChange={handleBulkCampaignStatusChange}
                onBulkDelete={handleBulkCampaignDelete}
              />
            </div>
          )}

          {/* 3. Stand-alone WhatsApp Bots statistics */}
          {activeTab === 'bots' && (
            <div className="animate-fade-in">
              <BotsSection sales={filteredSales} />
            </div>
          )}

          {/* 4. Sales transactions ledger with Edit/Delete capabilities */}
          {activeTab === 'ledger' && (
            <div className="animate-fade-in">
              <SalesLedger 
                sales={filteredSales}
                onOpenCreateModal={handleOpenCreateModal}
                onEditSale={handleOpenEditModal}
                onDeleteSale={handleDeleteSale}
              />
            </div>
          )}

          {/* 5. Gemini AI Advisor panel */}
          {activeTab === 'advisor' && (
            <div className="animate-fade-in">
              <AIAdvisor 
                campaigns={filteredCampaigns} 
                sales={filteredSales} 
                activeCountry={filters.country} 
              />
            </div>
          )}

          {/* 6. Dynamic Catalog Management */}
          {activeTab === 'catalog' && (
            <div className="animate-fade-in">
              <CatalogManagement 
                products={products}
                setProducts={setProducts}
                countriesConfig={countriesConfig}
                setCountriesConfig={setCountriesConfig}
                onShowToast={showToast}
              />
            </div>
          )}

        </div>

        {/* Global Footer */}
        <footer className="py-6 px-8 border-t border-[#1f2335] bg-[#0c0d12] mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-gray-500">
            <span>Dashboard de Ventas y Anuncios · Hecho para Sebastián · 2026</span>
            <div className="flex items-center gap-3">
              <span>ESTADO DE SISTEMAS: <strong className="text-emerald-400">● ÓPTIMO</strong></span>
              <span>·</span>
              <span>CRM WHATSAPP: <strong className="text-emerald-400">● SINCRONIZADO</strong></span>
            </div>
          </div>
        </footer>
      </main>

      {/* Shared Sales Creation / Editing Modal */}
      <CreateSaleModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaleFormSubmit}
        initialSale={editingSale}
        products={products}
        countriesConfig={countriesConfig}
      />
    </div>
  );
}
