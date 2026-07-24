import React, { useState, useMemo } from 'react';
import { 
  Megaphone, 
  DollarSign, 
  TrendingUp, 
  Award, 
  Globe, 
  Upload, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Trash2, 
  Layers,
  ArrowUpRight,
  HelpCircle,
  Filter,
  Coins
} from 'lucide-react';
import { Sale, AdCampaign, CountryConfig } from '../types';
import MetaAdsCSVUploadModal from './MetaAdsCSVUploadModal';
import { clearMetaAdsApi } from '../lib/api';

interface MetaAdsViewProps {
  sales: Sale[];
  campaigns: AdCampaign[];
  countriesConfig: Record<string, CountryConfig>;
  onRefetch: () => void;
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

const normalizeText = (str: string = '') => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

const format2Dec = (val: number) => {
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const CURRENCY_OPTIONS: Array<{ code: string; label: string; countryKey: string; defaultRate: number; symbol: string }> = [
  { code: 'USD', label: 'Dólar (USD)', countryKey: 'Ecuador', defaultRate: 1, symbol: '$' },
  { code: 'COP', label: 'Peso Colombiano (COP)', countryKey: 'Colombia', defaultRate: 4000, symbol: '$' },
  { code: 'MXN', label: 'Peso Mexicano (MXN)', countryKey: 'México', defaultRate: 18.5, symbol: '$' },
  { code: 'BOB', label: 'Boliviano (BOB)', countryKey: 'Bolivia', defaultRate: 6.9, symbol: 'Bs.' },
  { code: 'PEN', label: 'Sol Peruano (PEN)', countryKey: 'Perú', defaultRate: 3.7, symbol: 'S/' },
  { code: 'VES', label: 'Bolívar Venezolano (VES)', countryKey: 'Venezuela', defaultRate: 36, symbol: 'Bs.' },
];

export default function MetaAdsView({
  sales,
  campaigns,
  countriesConfig,
  onRefetch,
  onShowToast
}: MetaAdsViewProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('All');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [startDateFilter, setStartDateFilter] = useState<string>('2026-07-01');
  const [endDateFilter, setEndDateFilter] = useState<string>('2026-07-31');
  const [searchAdQuery, setSearchAdQuery] = useState<string>('');
  const [isClearing, setIsClearing] = useState(false);

  // Reference currency conversion config
  const activeCurrencyConfig = useMemo(() => {
    const opt = CURRENCY_OPTIONS.find(c => c.code === selectedCurrency) || CURRENCY_OPTIONS[0];
    let rate = 1;
    if (opt.code !== 'USD') {
      rate = countriesConfig[opt.countryKey]?.rate || opt.defaultRate;
    }
    return {
      ...opt,
      rate
    };
  }, [selectedCurrency, countriesConfig]);

  // Available countries for dropdowns
  const availableCountries = useMemo(() => {
    return Object.keys(countriesConfig);
  }, [countriesConfig]);

  // 1. Group Raw Ads by Ad ID (codigo_campana) & compute Ad ID metrics in selected Date Range & Country
  const adPerformanceList = useMemo(() => {
    // Filter campaigns by date range & ensure country exists
    const filteredCamp = campaigns.filter(c => {
      if (!c.paisId || c.country === 'País sin identificar') return false;
      // Date Check
      if (startDateFilter && c.fecha && c.fecha < startDateFilter) return false;
      if (endDateFilter && c.fecha && c.fecha > endDateFilter) return false;
      return true;
    });

    // Unique Ad IDs
    const adMap: Record<string, {
      codigoCampana: string;
      nombre: string;
      paisName: string;
      paisId?: string | null;
      gastoUsd: number;
    }> = {};

    // 1. Group Raw Ads by Ad ID: Process Meta Campaigns FIRST to get exact names & country info from DB
    filteredCamp.forEach(c => {
      const adId = (c.codigoCampana || c.id || '').trim();
      if (!adId) return;

      if (!adMap[adId]) {
        adMap[adId] = {
          codigoCampana: adId,
          nombre: c.campaignName && c.campaignName !== 'Anuncio' ? c.campaignName : `Anuncio (${adId})`,
          paisName: c.country || '',
          paisId: c.paisId || null,
          gastoUsd: 0,
        };
      } else {
        if (c.campaignName && c.campaignName !== 'Anuncio') {
          adMap[adId].nombre = c.campaignName;
        }
        if (c.country) adMap[adId].paisName = c.country;
        if (c.paisId) adMap[adId].paisId = c.paisId;
      }
      adMap[adId].gastoUsd += c.spend || 0;
    });

    // 2. Include Ad IDs present in Sales ONLY if they are not already in Meta Campaigns
    sales.forEach(s => {
      if (s.idAnuncio && s.paisId && s.country && s.country !== 'País sin identificar') {
        const adId = s.idAnuncio.trim();
        if (!adMap[adId]) {
          adMap[adId] = {
            codigoCampana: adId,
            nombre: `Anuncio (${adId})`,
            paisName: s.country,
            paisId: s.paisId,
            gastoUsd: 0,
          };
        }
      }
    });

    // Compute metrics for each Ad ID
    return Object.values(adMap).map(ad => {
      // Find matching sales by id_anuncio
      const matchingSales = sales.filter(s => {
        if (!s.idAnuncio || s.idAnuncio.trim() !== ad.codigoCampana.trim()) return false;
        // Date Check
        if (startDateFilter && s.date < startDateFilter) return false;
        if (endDateFilter && s.date > endDateFilter) return false;
        return true;
      });

      const ingresosUsd = matchingSales.reduce((acc, s) => acc + s.amountUsd, 0);
      const ventasCount = matchingSales.length;
      const gastoUsd = ad.gastoUsd;
      const roas = gastoUsd > 0 ? ingresosUsd / gastoUsd : (ingresosUsd > 0 ? 999 : 0);
      const utilidadUsd = ingresosUsd - gastoUsd;
      const ticketMedioUsd = ventasCount > 0 ? ingresosUsd / ventasCount : 0;

      // Determine ROAS Traffic Light Status
      let semaforo: { label: string; text: string; bgClass: string; borderClass: string; textClass: string } = {
        label: 'Apagar',
        text: 'Apagar',
        bgClass: 'bg-rose-950/60',
        borderClass: 'border-rose-800/50',
        textClass: 'text-rose-400'
      };

      if (roas >= 2.0) {
        semaforo = {
          label: 'Escalar',
          text: 'Escalar',
          bgClass: 'bg-emerald-950/60',
          borderClass: 'border-emerald-800/50',
          textClass: 'text-emerald-400'
        };
      } else if (roas >= 1.5) {
        semaforo = {
          label: 'Mantener',
          text: 'Mantener',
          bgClass: 'bg-blue-950/60',
          borderClass: 'border-blue-800/50',
          textClass: 'text-blue-400'
        };
      } else if (roas >= 1.0) {
        semaforo = {
          label: 'Optimizar',
          text: 'Optimizar',
          bgClass: 'bg-amber-950/60',
          borderClass: 'border-amber-800/50',
          textClass: 'text-amber-400'
        };
      }

      return {
        ...ad,
        ingresosUsd: Math.round(ingresosUsd * 100) / 100,
        gastoUsd: Math.round(gastoUsd * 100) / 100,
        ventasCount,
        roas: Math.round(roas * 100) / 100,
        utilidadUsd: Math.round(utilidadUsd * 100) / 100,
        ticketMedioUsd: Math.round(ticketMedioUsd * 100) / 100,
        semaforo
      };
    });
  }, [campaigns, sales, startDateFilter, endDateFilter]);

  // Filter & Group Ad Performance List: PRIMERO por País, LUEGO por Nombre del Anuncio
  const filteredAdList = useMemo(() => {
    return adPerformanceList.filter(ad => {
      // Country Filter
      if (selectedCountryFilter !== 'All') {
        const normSelected = normalizeText(selectedCountryFilter);
        const normAdCountry = normalizeText(ad.paisName);
        if (normAdCountry !== normSelected) return false;
      }

      // Search Query Filter
      if (searchAdQuery.trim() !== '') {
        const q = normalizeText(searchAdQuery);
        const normName = normalizeText(ad.nombre);
        const normId = normalizeText(ad.codigoCampana);
        if (!normName.includes(q) && !normId.includes(q)) return false;
      }

      return true;
    }).sort((a, b) => {
      // 1. Group/Sort by Country Name Alphabetically
      const countryCompare = a.paisName.localeCompare(b.paisName, 'es', { sensitivity: 'base' });
      if (countryCompare !== 0) return countryCompare;

      // 2. Within same Country, sort by Ad Name Alphabetically
      return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
    });
  }, [adPerformanceList, selectedCountryFilter, searchAdQuery]);

  // Consolidated KPIs in reference currency
  const globalKpis = useMemo(() => {
    const totalIngresosUsd = filteredAdList.reduce((acc, a) => acc + a.ingresosUsd, 0);
    const totalGastoUsd = filteredAdList.reduce((acc, a) => acc + a.gastoUsd, 0);
    const totalVentas = filteredAdList.reduce((acc, a) => acc + a.ventasCount, 0);
    const totalUtilidadUsd = totalIngresosUsd - totalGastoUsd;
    const roasGlobal = totalGastoUsd > 0 ? totalIngresosUsd / totalGastoUsd : 0;
    const ticketMedioUsd = totalVentas > 0 ? totalIngresosUsd / totalVentas : 0;

    const rate = activeCurrencyConfig.rate;

    return {
      totalIngresos: Math.round(totalIngresosUsd * rate * 100) / 100,
      totalGasto: Math.round(totalGastoUsd * rate * 100) / 100,
      totalUtilidad: Math.round(totalUtilidadUsd * rate * 100) / 100,
      roasGlobal: Math.round(roasGlobal * 100) / 100,
      ticketMedioGlobal: Math.round(ticketMedioUsd * rate * 100) / 100,
      totalVentas
    };
  }, [filteredAdList, activeCurrencyConfig]);

  // Clear all Meta Ads
  const handleClearAllMetaAds = async () => {
    if (!confirm('¿Estás seguro de borrar todas las impresiones y gastos de Meta Ads importados?')) return;
    setIsClearing(true);
    try {
      await clearMetaAdsApi();
      onShowToast('Reportes de Meta Ads borrados correctamente.', 'warning');
      onRefetch();
    } catch (err: any) {
      onShowToast(`Error al borrar reportes: ${err.message}`, 'warning');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div id="meta-ads-level4" className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#06b6d4]" /> Nivel 4 — Monitoreo de Meta Ads & ROAS por Anuncio
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Cruce estricto por <span className="text-emerald-400 font-bold">Ad ID</span> con ventas de Supabase. Medición de ROAS, Utilidad y Semáforo por Anuncio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-[#3b82f6] hover:bg-blue-600 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Cargar Reporte CSV (Meta)
          </button>

          {campaigns.length > 0 && (
            <button
              onClick={handleClearAllMetaAds}
              disabled={isClearing}
              className="px-3 py-2 bg-[#151926] hover:bg-rose-950/60 text-gray-400 hover:text-rose-400 border border-[#252b42] hover:border-rose-800/40 rounded-lg text-xs font-mono transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar (Currency, Country & Date Range) */}
      <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Reference Currency Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Coins className="w-3 h-3 text-amber-400" /> MONEDA:
            </label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="bg-[#151926] border border-[#252b42] text-white text-xs font-mono font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#3b82f6] cursor-pointer"
            >
              {CURRENCY_OPTIONS.map(c => (
                <option key={c.code} value={c.code} className="bg-[#11131c] text-white">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Country Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Globe className="w-3 h-3 text-[#3b82f6]" /> PAÍS:
            </label>
            <select
              value={selectedCountryFilter}
              onChange={(e) => setSelectedCountryFilter(e.target.value)}
              className="bg-[#151926] border border-[#252b42] text-white text-xs font-mono rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#3b82f6] cursor-pointer"
            >
              <option value="All">Todos los Países</option>
              {availableCountries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Date Range Start */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#3b82f6]" /> FECHA INICIO:
            </label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="bg-[#151926] border border-[#252b42] text-white text-xs font-mono rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#3b82f6] scheme-dark cursor-pointer"
            />
          </div>

          {/* Date Range End */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#3b82f6]" /> FECHA FIN:
            </label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="bg-[#151926] border border-[#252b42] text-white text-xs font-mono rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#3b82f6] scheme-dark cursor-pointer"
            />
          </div>

        </div>

        {/* Search Input for Ads */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por Nombre o Ad ID..."
            value={searchAdQuery}
            onChange={(e) => setSearchAdQuery(e.target.value)}
            className="w-full bg-[#151926] border border-[#252b42] text-white text-xs font-mono rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
          />
        </div>
      </div>

      {/* 5 Core KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: ROAS Global */}
        <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 hover:border-[#2d3450] transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">ROAS {selectedCountryFilter === 'All' ? 'Global' : selectedCountryFilter}</span>
              <span className={`text-2xl font-display font-extrabold mt-1 block ${
                globalKpis.roasGlobal >= 2.0 ? 'text-emerald-400' : globalKpis.roasGlobal >= 1.5 ? 'text-blue-400' : globalKpis.roasGlobal >= 1.0 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {globalKpis.roasGlobal.toFixed(2)}x
              </span>
            </div>
            <div className="p-2.5 bg-blue-500/10 rounded-lg text-[#3b82f6] border border-blue-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] font-mono text-gray-500">Ingresos / Gasto total</div>
        </div>

        {/* KPI 2: Ingresos Totales */}
        <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 hover:border-[#2d3450] transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Ingresos Totales ({activeCurrencyConfig.code})</span>
              <span className="text-2xl font-display font-extrabold text-emerald-400 mt-1 block">
                {activeCurrencyConfig.symbol}{format2Dec(globalKpis.totalIngresos)}
              </span>
            </div>
            <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] font-mono text-gray-500">Formato 2 decimales</div>
        </div>

        {/* KPI 3: Gasto Total */}
        <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 hover:border-[#2d3450] transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Gasto Total ({activeCurrencyConfig.code})</span>
              <span className="text-2xl font-display font-extrabold text-rose-400 mt-1 block">
                {activeCurrencyConfig.symbol}{format2Dec(globalKpis.totalGasto)}
              </span>
            </div>
            <div className="p-2.5 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20">
              <Megaphone className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] font-mono text-gray-500">Inversión en anuncios Meta</div>
        </div>

        {/* KPI 4: Utilidad Total */}
        <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 hover:border-[#2d3450] transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Utilidad Total ({activeCurrencyConfig.code})</span>
              <span className={`text-2xl font-display font-extrabold mt-1 block ${globalKpis.totalUtilidad >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {activeCurrencyConfig.symbol}{format2Dec(globalKpis.totalUtilidad)}
              </span>
            </div>
            <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] font-mono text-gray-500">Ingresos menos Gasto</div>
        </div>

        {/* KPI 5: Ticket Medio Global */}
        <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 hover:border-[#2d3450] transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Ticket Medio ({activeCurrencyConfig.code})</span>
              <span className="text-2xl font-display font-extrabold text-sky-400 mt-1 block">
                {activeCurrencyConfig.symbol}{format2Dec(globalKpis.ticketMedioGlobal)}
              </span>
            </div>
            <div className="p-2.5 bg-sky-500/10 rounded-lg text-sky-400 border border-sky-500/20">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] font-mono text-gray-500">Promedio por venta de anuncio</div>
        </div>

      </div>

      {/* Tabla de Rendimiento por Anuncio (Agrupado por País) */}
      <div className="bg-[#11131c] border border-[#1f2335] rounded-xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-[#1f2335] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" /> Tabla de Rendimiento por Anuncio (Agrupado por País)
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              Agrupado alfabéticamente por País y Anuncio. Valores en <strong className="text-white">{activeCurrencyConfig.code}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
            <span>MOSTRANDO <strong className="text-white">{filteredAdList.length}</strong> ANUNCIOS</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f111a] border-b border-[#1f2335]">
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider">Nombre del Anuncio — Ad ID</th>
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider">País</th>
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">Ingresos ({activeCurrencyConfig.code})</th>
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">Gasto ({activeCurrencyConfig.code})</th>
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">ROAS</th>
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">Utilidad ({activeCurrencyConfig.code})</th>
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-right">Ticket Medio ({activeCurrencyConfig.code})</th>
                <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-wider text-center">Semáforo ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2335]">
              {filteredAdList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500 font-mono text-xs">
                    No se encontraron anuncios para los filtros seleccionados. Carga un reporte CSV de Meta Ads para ver datos.
                  </td>
                </tr>
              ) : (
                filteredAdList.map((ad, idx) => {
                  const rate = activeCurrencyConfig.rate;
                  const ingresosConv = ad.ingresosUsd * rate;
                  const gastoConv = ad.gastoUsd * rate;
                  const utilidadConv = ad.utilidadUsd * rate;
                  const ticketMedioConv = ad.ticketMedioUsd * rate;

                  // Render Country Section Header when country changes in "All" view
                  const isFirstOfCountry = idx === 0 || filteredAdList[idx - 1].paisName !== ad.paisName;

                  return (
                    <React.Fragment key={ad.codigoCampana}>
                      {isFirstOfCountry && selectedCountryFilter === 'All' && (
                        <tr className="bg-[#151926] border-y border-[#252b42]">
                          <td colSpan={8} className="px-4 py-2 text-xs font-mono font-bold text-[#3b82f6] tracking-wider uppercase bg-[#131724]">
                            <span className="flex items-center gap-2">
                              <Globe className="w-3.5 h-3.5 text-[#3b82f6]" />
                              <span>{ad.paisName}</span>
                            </span>
                          </td>
                        </tr>
                      )}
                      <tr className="hover:bg-[#151926]/80 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-white text-sm leading-snug">
                            {ad.nombre} <span className="text-gray-400 font-mono text-xs font-normal"> — {ad.codigoCampana}</span>
                          </div>
                          <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                            <span>{ad.ventasCount} ventas</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-lg border bg-[#151926] text-gray-300 border-[#252b42]">
                            <Globe className="w-3 h-3 text-gray-400" />
                            {ad.paisName}
                          </span>
                        </td>

                        <td className="p-4 text-right font-mono text-sm font-bold text-emerald-400">
                          {activeCurrencyConfig.symbol}{format2Dec(ingresosConv)}
                        </td>

                        <td className="p-4 text-right font-mono text-sm text-gray-300">
                          {activeCurrencyConfig.symbol}{format2Dec(gastoConv)}
                        </td>

                        <td className="p-4 text-right font-mono text-sm font-extrabold text-white">
                          {ad.roas === 999 ? '∞' : `${ad.roas.toFixed(2)}x`}
                        </td>

                        <td className={`p-4 text-right font-mono text-sm font-bold ${utilidadConv >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {activeCurrencyConfig.symbol}{format2Dec(utilidadConv)}
                        </td>

                        <td className="p-4 text-right font-mono text-sm text-sky-400">
                          {activeCurrencyConfig.symbol}{format2Dec(ticketMedioConv)}
                        </td>

                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold border ${ad.semaforo.bgClass} ${ad.semaforo.borderClass} ${ad.semaforo.textClass}`}>
                            {ad.semaforo.text === 'Escalar' && '🟢'}
                            {ad.semaforo.text === 'Mantener' && '🔵'}
                            {ad.semaforo.text === 'Optimizar' && '🟡'}
                            {ad.semaforo.text === 'Apagar' && '🔴'}
                            <span>{ad.semaforo.label}</span>
                          </span>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV Upload Modal */}
      <MetaAdsCSVUploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        countriesConfig={countriesConfig}
        onSuccess={(insertedCount, ignoredCount) => {
          let msg = `Se procesaron ${insertedCount} anuncios.`;
          if (ignoredCount > 0) {
            msg += ` Se ignoraron ${ignoredCount} sin país identificable en el nombre.`;
          }
          onShowToast(msg, 'success');
          onRefetch();
        }}
      />

    </div>
  );
}
