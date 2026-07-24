import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import GeneralSummaryView from './components/GeneralSummaryView';
import CountryDetailView from './components/CountryDetailView';
import BotsPerformanceView from './components/BotsPerformanceView';
import MetaAdsView from './components/MetaAdsView';
import SalesLedger from './components/SalesLedger';
import CreateSaleModal from './components/CreateSaleModal';
import CatalogManagement from './components/CatalogManagement';
import { Sale, AdCampaign, FilterState, Product } from './types';
import { useDashboardData } from './hooks/useDashboardData';
import { CheckCircle2, AlertTriangle, Info, Plus, X, Database } from 'lucide-react';

const normalizeCountry = (str?: string) => {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

export default function App() {
  // Live dataset and mutations powered by TanStack Query + Supabase / Drizzle
  const {
    isLoading,
    isError,
    error,
    refetch,
    sales,
    campaigns,
    products,
    countriesConfig,
    rawBots,
    resumenPorAnuncio,
    createSale,
    updateSale,
    deleteSale,
    toggleCampaign,
    bulkCampaignStatus,
    bulkDeleteCampaigns,
    saveProduct,
    updateCountryRate,
  } = useDashboardData();

  // Active view state (Default: 'dashboard' = Nivel 1)
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Filters State - Default covering July 2026 sales
  const [filters, setFilters] = useState<FilterState>({
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    country: 'All',
    bot: 'All'
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Toast notification system
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'info'; id: number } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    const id = Date.now();
    setToast({ message, type, id });
  };

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
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      country: 'All',
      bot: 'All'
    });
    setSearchQuery('');
    showToast('Filtros restablecidos al rango del mes actual.', 'info');
  };

  // Modal Control States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // Filter computation logic (Memoized)
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Date Check
      if (filters.startDate && sale.date < filters.startDate) return false;
      if (filters.endDate && sale.date > filters.endDate) return false;
      
      // Country Check (Accent normalized)
      if (filters.country !== 'All' && normalizeCountry(sale.country) !== normalizeCountry(filters.country)) return false;
      
      // Bot Check
      if (filters.bot !== 'All' && sale.bot !== filters.bot) return false;

      // Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = sale.customerName.toLowerCase().includes(query);
        const matchesPhone = sale.phone.toLowerCase().includes(query);
        const matchesId = sale.id.toLowerCase().includes(query);
        return matchesName || matchesPhone || matchesId;
      }

      return true;
    });
  }, [sales, filters, searchQuery]);

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
  const handleDeleteSale = async (id: string) => {
    const deletedSale = sales.find(s => s.id === id);
    try {
      await deleteSale(id);
      showToast(`Venta de ${deletedSale?.customerName || 'Cliente'} eliminada de Supabase.`, 'warning');
    } catch (err: any) {
      showToast(`Error al eliminar venta: ${err.message}`, 'warning');
    }
  };

  // Submit modal creator or editor
  const handleSaleFormSubmit = async (saleData: Omit<Sale, 'id'>) => {
    try {
      if (editingSale) {
        await updateSale({
          id: editingSale.id,
          data: {
            clienteNombre: saleData.customerName,
            clienteTelefono: saleData.phone,
            productoId: saleData.productoId,
            paisId: saleData.paisId,
            botId: saleData.botId,
            montoLocal: saleData.amountLocal,
            montoUsd: saleData.amountUsd,
            moneda: saleData.currency,
            fecha: saleData.date,
            tipoVenta: saleData.tipoVenta,
            diaSemana: saleData.diaSemana,
            hora: saleData.hora,
            banco: saleData.banco,
            idAnuncio: saleData.idAnuncio,
            linkMedia: saleData.linkMedia,
            linkSource: saleData.linkSource,
          }
        });
        showToast(`Venta de ${saleData.customerName} actualizada en Supabase con éxito.`);
      } else {
        await createSale({
          clienteNombre: saleData.customerName,
          clienteTelefono: saleData.phone,
          productoId: saleData.productoId!,
          paisId: saleData.paisId!,
          botId: saleData.botId,
          montoLocal: saleData.amountLocal,
          montoUsd: saleData.amountUsd,
          moneda: saleData.currency,
          fecha: saleData.date,
          tipoVenta: saleData.tipoVenta,
          diaSemana: saleData.diaSemana,
          hora: saleData.hora,
          banco: saleData.banco,
          idAnuncio: saleData.idAnuncio,
          linkMedia: saleData.linkMedia,
          linkSource: saleData.linkSource,
        });
        showToast(`Venta guardada en Supabase: ${saleData.customerName} por ${saleData.amountLocal.toLocaleString()} ${saleData.currency}.`);
      }
    } catch (err: any) {
      showToast(`Error guardando venta: ${err.message}`, 'warning');
    }
  };

  return (
    <div id="dashboard-app-root" className="min-h-screen bg-[#0b0c10] text-[#e4e6eb] font-sans flex">
      {/* Persistent Left Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userEmail="sebastianrinta38@gmail.com" />

      {/* Main Layout Container */}
      <main className="flex-1 pl-64 min-h-screen flex flex-col">
        
        {/* Global sticky notification toast */}
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
                {activeTab === 'dashboard' && 'Nivel 1 — Resumen General Consolidado'}
                {activeTab === 'country' && 'Nivel 2 — Detalle por País'}
                {activeTab === 'bots' && 'Nivel 3 — Rendimiento de Bots Leona'}
                {activeTab === 'ledger' && 'Registro General de Ventas'}
                {activeTab === 'catalog' && 'Gestión de Países y Conversiones'}
              </h2>
              <p className="text-xs text-gray-400 font-mono mt-1 flex items-center gap-2">
                <span>
                  {activeTab === 'dashboard' && 'Visión unificada de facturación y métricas globales en USD'}
                  {activeTab === 'country' && 'Análisis en moneda local y desglose aislado por tipo de venta'}
                  {activeTab === 'bots' && 'Comparativa de conversión y ventas por país via Bot Leona'}
                  {activeTab === 'ledger' && 'Historial trazable de pagos y clientes de WhatsApp'}
                  {activeTab === 'catalog' && 'Configuración de tasas de cambio por país'}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  <Database className="w-3 h-3" /> Supabase Live
                </span>
              </p>
            </div>

            {/* Quick manual log trigger */}
            <div className="flex items-center gap-3">
              {isLoading && (
                <span className="text-[11px] text-amber-400 font-mono flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> Sincronizando...
                </span>
              )}
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
            countriesConfig={countriesConfig}
            botsList={rawBots}
          />

          {/* RENDER ACTIVE TAB PANELS */}

          {/* NIVEL 1 — Resumen General (Moneda de Referencia USD/COP/MXN/etc) */}
          {activeTab === 'dashboard' && (
            <GeneralSummaryView 
              sales={filteredSales} 
              allSales={sales}
              startDate={filters.startDate}
              endDate={filters.endDate}
              countriesConfig={countriesConfig}
              onRefetch={refetch}
            />
          )}

          {/* NIVEL 2 — Detalle por País (Moneda Local) */}
          {activeTab === 'country' && (
            <CountryDetailView 
              sales={filteredSales}
              countriesConfig={countriesConfig}
              selectedCountry={filters.country}
              onSelectCountry={(country) => setFilters(prev => ({ ...prev, country }))}
            />
          )}

          {/* NIVEL 3 — Rendimiento Bots Leona */}
          {activeTab === 'bots' && (
            <BotsPerformanceView 
              sales={filteredSales}
              rawBots={rawBots}
              countriesConfig={countriesConfig}
            />
          )}

          {/* NIVEL 4 — Meta Ads & ROAS por Anuncio */}
          {activeTab === 'ads' && (
            <MetaAdsView 
              sales={filteredSales}
              campaigns={campaigns}
              countriesConfig={countriesConfig}
              onRefetch={refetch}
              onShowToast={showToast}
            />
          )}

          {/* Registro General de Ventas */}
          {activeTab === 'ledger' && (
            <SalesLedger 
              sales={filteredSales}
              onOpenCreateModal={handleOpenCreateModal}
              onEditSale={handleOpenEditModal}
              onDeleteSale={handleDeleteSale}
            />
          )}

          {/* Gestión de Catálogo y Países */}
          {activeTab === 'catalog' && (
            <CatalogManagement 
              products={products}
              onSaveProduct={saveProduct}
              countriesConfig={countriesConfig}
              onUpdateCountryRate={updateCountryRate}
              onShowToast={showToast}
              onRefreshData={refetch}
            />
          )}

        </div>

        {/* Global Footer */}
        <footer className="py-6 px-8 border-t border-[#1f2335] bg-[#0c0d12] mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-gray-500">
            <span>Dashboard de Ventas y Anuncios · Conectado a Supabase Real Data</span>
            <div className="flex items-center gap-3">
              <span>BASE DE DATOS: <strong className="text-emerald-400">● CONECTADA (SUPABASE)</strong></span>
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
        botsList={rawBots}
      />
    </div>
  );
}
