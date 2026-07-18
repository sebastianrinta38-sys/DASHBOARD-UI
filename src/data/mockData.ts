/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sale, AdCampaign } from '../types';

export const EXCHANGE_RATES = {
  Colombia: { currency: 'COP', rate: 4000 },
  Bolivia: { currency: 'BOB', rate: 6.9 },
  Perú: { currency: 'PEN', rate: 3.7 },
  Venezuela: { currency: 'VES', rate: 36.0 },
} as const;

export const PRODUCTS = [
  { name: 'Guía Completa de Carpintería Pro', usdPrice: 15 },
  { name: 'Plano Banco de Trabajo Ergonómico', usdPrice: 10 },
  { name: 'Plano Cama Multifuncional con Cajones', usdPrice: 20 },
  { name: 'Combo 5 Planos de Muebles Modernos', usdPrice: 35 },
];

export const BOTS = [
  'Bot Carpintería Automatizado',
  'Bot Interactivo Planos',
  'Bot Soporte Ventas'
];

export const COUNTRIES = ['Colombia', 'Bolivia', 'Perú', 'Venezuela'] as const;

// Helper to generate mock sales over the last 30 days (June 18, 2026 to July 18, 2026)
const generateMockSales = (): Sale[] => {
  const sales: Sale[] = [];
  const firstNames = ['Sebastián', 'Carlos', 'María', 'Andrés', 'Sofía', 'Alejandro', 'Gabriel', 'Laura', 'Julio', 'Juan', 'Diego', 'Patricia', 'Adriana', 'Martín', 'Camila', 'Luis', 'Ignacio', 'Natalia', 'Verónica', 'Emilio'];
  const lastNames = ['Gómez', 'Rojas', 'Silva', 'Rodríguez', 'Pérez', 'Torres', 'Mendoza', 'Sánchez', 'Vargas', 'Morales', 'Castro', 'Herrera', 'Martínez', 'Ramírez', 'Flores', 'Gutiérrez', 'Ortega', 'Díaz', 'Ríos', 'Espinoza'];
  
  const countryCodes = {
    Colombia: '+57',
    Bolivia: '+591',
    Perú: '+51',
    Venezuela: '+58'
  };

  // Generate around 150 sales spread across 30 days
  const baseTime = new Date('2026-07-18T12:00:00-07:00');
  
  for (let i = 0; i < 185; i++) {
    const dayOffset = Math.floor(i / 6); // roughly 6 sales per day
    const saleDate = new Date(baseTime.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    const dateString = saleDate.toISOString().split('T')[0];
    
    const country = COUNTRIES[i % COUNTRIES.length];
    const productObj = PRODUCTS[Math.floor((i * 7) % PRODUCTS.length)];
    const bot = BOTS[Math.floor((i * 3) % BOTS.length)];
    
    const firstName = firstNames[Math.floor((i * 13) % firstNames.length)];
    const lastName = lastNames[Math.floor((i * 17) % lastNames.length)];
    const customerName = `${firstName} ${lastName}`;
    
    const phone = `${countryCodes[country]} 9${Math.floor(10000000 + Math.random() * 90000000)}`;
    const usdPrice = productObj.usdPrice;
    const rateInfo = EXCHANGE_RATES[country];
    const amountLocal = Math.round(usdPrice * rateInfo.rate);

    sales.push({
      id: `SALE-${1000 + i}`,
      date: dateString,
      customerName,
      phone,
      country,
      product: productObj.name,
      bot,
      amountLocal,
      currency: rateInfo.currency as any,
      amountUsd: usdPrice,
    });
  }
  
  return sales.sort((a, b) => b.date.localeCompare(a.date));
};

export const INITIAL_SALES: Sale[] = generateMockSales();

export const INITIAL_CAMPAIGNS: AdCampaign[] = [
  {
    id: 'CAMP-001',
    campaignName: 'Ads Carpintería Colombia - Conversiones',
    country: 'Colombia',
    spend: 480,
    impressions: 92000,
    clicks: 3800,
    cpa: 3.75,
    conversions: 128,
    status: 'active'
  },
  {
    id: 'CAMP-002',
    campaignName: 'Ads Planos Bolivia - Mensajes',
    country: 'Bolivia',
    spend: 195,
    impressions: 48000,
    clicks: 2200,
    cpa: 2.29,
    conversions: 85,
    status: 'active'
  },
  {
    id: 'CAMP-003',
    campaignName: 'Ads Cama Multifuncional Perú',
    country: 'Perú',
    spend: 340,
    impressions: 68000,
    clicks: 3100,
    cpa: 4.78,
    conversions: 71,
    status: 'active'
  },
  {
    id: 'CAMP-004',
    campaignName: 'Ads Combo Muebles Venezuela',
    country: 'Venezuela',
    spend: 160,
    impressions: 34000,
    clicks: 1400,
    cpa: 1.92,
    conversions: 83,
    status: 'active'
  },
  {
    id: 'CAMP-005',
    campaignName: 'Ads Retargeting LATAM - Todos',
    country: 'Todos',
    spend: 110,
    impressions: 21000,
    clicks: 980,
    cpa: 1.32,
    conversions: 83,
    status: 'active'
  },
  {
    id: 'CAMP-006',
    campaignName: 'Ads Banco Carpintero - Colombia Antiguo',
    country: 'Colombia',
    spend: 210,
    impressions: 38000,
    clicks: 1500,
    cpa: 7.00,
    conversions: 30,
    status: 'paused'
  }
];
