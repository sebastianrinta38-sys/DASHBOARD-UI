/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle, 
  PauseCircle, 
  CheckCircle2, 
  HelpCircle,
  Clock,
  ArrowRight,
  BrainCircuit
} from 'lucide-react';
import { AdCampaign, Sale, AIAdvisorRecommendation } from '../types';

interface AIAdvisorProps {
  campaigns: AdCampaign[];
  sales: Sale[];
  activeCountry: string;
}

export default function AIAdvisor({ campaigns, sales, activeCountry }: AIAdvisorProps) {
  const [recommendations, setRecommendations] = useState<AIAdvisorRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [progressStep, setProgressStep] = useState(0);

  // Live progress simulation logs to make long LLM queries look fluid and responsive
  const progressLogs = [
    'Estableciendo canal seguro con Gemini 3.5...',
    'Estructurando resumen de transacciones de WhatsApp...',
    'Calculando correlaciones de ROAS atribuidas por país...',
    'Contrastando CPA contra márgenes de infoproductos...',
    'Generando recomendaciones de escala presupuestaria...'
  ];

  const fetchAIRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    setProgressStep(0);

    // Dynamic timer to cycle through progress logs
    const interval = setInterval(() => {
      setProgressStep(prev => (prev < progressLogs.length - 1 ? prev + 1 : prev));
    }, 700);

    try {
      // Calculate a quick summary of sales to keep payload lightweight and compliant
      const totalRevenue = sales.reduce((acc, s) => acc + s.amountUsd, 0);
      const salesByCountry = sales.reduce((acc, s) => {
        acc[s.country] = (acc[s.country] || 0) + s.amountUsd;
        return acc;
      }, {} as { [key: string]: number });

      const salesSummary = {
        totalSalesCount: sales.length,
        totalRevenueUsd: totalRevenue,
        salesByCountry
      };

      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaigns,
          salesSummary,
          countryFilter: activeCountry
        })
      });

      if (!response.ok) {
        throw new Error('La solicitud al servidor falló con código ' + response.status);
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setIsSimulated(data.isSimulated || false);
    } catch (err: any) {
      console.error('Error in AI analysis:', err);
      setError('No pudimos procesar el análisis con Inteligencia Artificial. Revisa tu conexión.');
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  // Run initial loading on tab mount
  useEffect(() => {
    fetchAIRecommendations();
  }, [campaigns.length, sales.length, activeCountry]);

  // Color mapper for recommendation action
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'Escalar':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/30',
          desc: 'Aumentar presupuesto diario'
        };
      case 'Mantener':
        return {
          icon: Clock,
          color: 'text-sky-400 bg-sky-950/40 border-sky-800/30',
          desc: 'Presupuesto estable, optimizar copies'
        };
      case 'Optimizar':
        return {
          icon: AlertTriangle,
          color: 'text-amber-400 bg-amber-950/40 border-amber-800/30',
          desc: 'Revisar embudo y segmentación'
        };
      case 'Pausar':
        return {
          icon: PauseCircle,
          color: 'text-rose-400 bg-rose-950/40 border-rose-800/30',
          desc: 'Pausar anuncios temporalmente'
        };
      default:
        return {
          icon: HelpCircle,
          color: 'text-gray-400 bg-gray-950/40 border-gray-800/30',
          desc: 'Requiere revisión'
        };
    }
  };

  return (
    <div id="ai-advisor-container" className="space-y-6">
      
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-[#171a2a] to-[#121422] border border-[#232840] rounded-xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/10">
            <BrainCircuit className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
              Asistente de Presupuestos e Inteligencia Artificial
            </h2>
            <p className="text-xs text-gray-400 font-mono mt-1 max-w-xl leading-relaxed">
              Gemini analiza en tiempo real la correspondencia entre la facturación real recolectada por tus Bots de WhatsApp y el gasto publicitario de Meta Ads, emitiendo sugerencias de escala precisas por país.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAIRecommendations}
          disabled={isLoading}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-500/10 disabled:opacity-50 self-start md:self-center cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refrescar Recomendaciones
        </button>
      </div>

      {/* Simulated Key Advisory Message */}
      {isSimulated && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3 text-xs text-amber-400 font-mono">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Recomendador Inteligente Optimizado</strong>: Mostrando sugerencias analíticas de contingencia. Modifica tu GEMINI_API_KEY para habilitar consultas interactivas integrales.
          </span>
        </div>
      )}

      {/* SKELETON LOADING STATE */}
      {isLoading ? (
        <div id="ai-loading-skeletons" className="space-y-4">
          {/* Progress Indicator */}
          <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-6 h-6 text-[#3b82f6] animate-spin" />
            <p className="text-xs font-mono text-gray-300 animate-pulse">{progressLogs[progressStep]}</p>
            <div className="w-48 h-1.5 bg-[#151926] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${((progressStep + 1) / progressLogs.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Skeletons Cards */}
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#11131c] border border-[#1f2335] rounded-xl p-6 space-y-4 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-4 w-1/3 bg-[#1e2336] rounded"></div>
                <div className="h-6 w-20 bg-[#1e2336] rounded-full"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-[#1c2132] rounded"></div>
                <div className="h-3 w-5/6 bg-[#1c2132] rounded"></div>
              </div>
              <div className="h-8 w-1/2 bg-[#1c2132] rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        /* ERROR STATE */
        <div id="ai-error-state" className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-sm font-semibold text-white">Análisis con IA Temporalmente Suspendido</h3>
          <p className="text-xs text-gray-400 font-mono max-w-md mx-auto">{error}</p>
          <button 
            onClick={fetchAIRecommendations}
            className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-mono border border-rose-500/30 transition-all cursor-pointer"
          >
            Reintentar Análisis
          </button>
        </div>
      ) : recommendations.length === 0 ? (
        /* EMPTY STATE */
        <div id="ai-empty-state" className="bg-[#11131c] border border-[#1f2335] rounded-xl p-8 text-center space-y-3">
          <HelpCircle className="w-8 h-8 text-gray-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">Sin Recomendaciones Activas</h3>
          <p className="text-xs text-gray-500 font-mono max-w-sm mx-auto">
            Por favor, asegúrate de tener campañas en Meta Ads registradas y ventas reales para iniciar el análisis automático.
          </p>
        </div>
      ) : (
        /* RENDER RECOMMENDATIONS */
        <div id="ai-recommendations-list" className="space-y-4">
          {recommendations.map((rec) => {
            const badge = getActionBadge(rec.action);
            const BadgeIcon = badge.icon;
            
            return (
              <div 
                key={rec.campaignId}
                className="bg-[#11131c] border border-[#1f2335] rounded-xl p-6 hover:border-[#2e354f] transition-all relative overflow-hidden"
              >
                {/* Visual Accent corresponding to decision color */}
                <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${rec.action === 'Escalar' ? 'bg-emerald-500' : rec.action === 'Mantener' ? 'bg-sky-500' : rec.action === 'Optimizar' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-display font-bold text-white flex items-center gap-2">
                      {rec.campaignName}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">ID: {rec.campaignId}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-400">Atribución ROAS: <strong className="text-white">{rec.roas.toFixed(2)}x</strong></span>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold border ${badge.color}`}>
                      <BadgeIcon className="w-3.5 h-3.5" />
                      {rec.action}
                    </span>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="space-y-2 mb-4">
                  <span className="text-[10px] font-mono tracking-wider text-gray-500 block uppercase">Diagnóstico Analítico</span>
                  <p className="text-xs text-gray-300 leading-relaxed font-sans">{rec.reason}</p>
                </div>

                {/* Concrete Presupuestary Action */}
                <div className="p-3 bg-[#151926] border border-[#22273b] rounded-lg flex items-start gap-2.5">
                  <div className="p-1.5 bg-blue-500/10 text-[#3b82f6] rounded mt-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-gray-400 block uppercase leading-tight">Acción Presupuestaria Sugerida</span>
                    <p className="text-xs text-[#3b82f6] font-semibold mt-0.5 leading-tight">{rec.budgetRecommendation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
