/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Sale {
  id: string;
  code?: string;
  date: string;
  customerName: string;
  phone: string;
  country: string;
  product: string;
  bot: string;
  amountLocal: number;
  currency: string;
  amountUsd: number;
  paisId?: string;
  productoId?: string;
  botId?: string;
  tipoVenta?: string;
  diaSemana?: string;
  hora?: string;
  banco?: string;
  idAnuncio?: string;
  linkMedia?: string;
  linkSource?: string;
}

export interface ResumenPorAnuncio {
  idAnuncio: string;
  pais: string;
  bot: string;
  numeroVentas: number;
  facturacion: number;
  ticketPromedio: number;
}

export interface AdCampaign {
  id: string;
  codigoCampana?: string;
  campaignName: string;
  country: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpa: number;
  roas?: number;
  conversions: number;
  status: 'active' | 'paused';
  paisId?: string;
  fecha?: string;
}

export interface BotPerformance {
  botName: string;
  contacts: number;
  conversations: number;
  salesCount: number;
  revenueUsd: number;
}

export interface CountryPerformance {
  country: string;
  revenueUsd: number;
  spendUsd: number;
  salesCount: number;
  roas: number;
  ticketPromedio: number;
}

export interface FilterState {
  startDate: string;
  endDate: string;
  country: string;
  bot: string;
}

export interface TipoVentaBreakdown {
  tipoVenta: string;
  label: string;
  count: number;
  totalLocal: number;
  ticketPromedioLocal: number;
}

export interface Product {
  id?: string;
  name: string;
  usdPrice: number;
  category?: string;
}

export interface CountryConfig {
  id?: string;
  name?: string;
  currency: string;
  rate: number;
}

export interface AIAdvisorRecommendation {
  campaignId: string;
  campaignName: string;
  roas: number;
  cpa: number;
  action: 'Escalar' | 'Mantener' | 'Optimizar' | 'Pausar';
  reason: string;
  budgetRecommendation: string;
}
