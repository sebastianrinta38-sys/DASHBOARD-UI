/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Sale {
  id: string;
  date: string;
  customerName: string;
  phone: string;
  country: string;
  product: string;
  bot: string;
  amountLocal: number;
  currency: string;
  amountUsd: number;
}

export interface AdCampaign {
  id: string;
  campaignName: string;
  country: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpa: number;
  conversions: number;
  status: 'active' | 'paused';
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
  product: string;
}

export interface Product {
  name: string;
  usdPrice: number;
}

export interface CountryConfig {
  name: string;
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
