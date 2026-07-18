/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Google GenAI client if the key is available
const apiKey = process.env.GEMINI_API_KEY;
const isRealApiKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '';

let aiClient: GoogleGenAI | null = null;
if (isRealApiKey) {
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API endpoint for Campaign Analysis via Gemini
app.post('/api/gemini/analyze', async (req, res) => {
  const { campaigns, salesSummary, countryFilter } = req.body;

  if (!campaigns || !salesSummary) {
    return res.status(400).json({ error: 'Missing campaigns or salesSummary data' });
  }

  // Fallback / Mock Data if API key is not configured yet
  const getMockRecommendations = () => {
    return [
      {
        campaignId: 'CAMP-001',
        campaignName: 'Ads Carpintería Colombia - Conversiones',
        roas: 3.4,
        cpa: 3.75,
        action: 'Escalar',
        reason: 'El ROAS de 3.4 supera el umbral de escala rentable (3.0). El CPA de $3.75 es extremadamente competitivo para el mercado colombiano.',
        budgetRecommendation: 'Incrementar el presupuesto diario en un 20% cada 3 días, monitoreando que el CPA se mantenga por debajo de los $4.50.'
      },
      {
        campaignId: 'CAMP-002',
        campaignName: 'Ads Planos Bolivia - Mensajes',
        roas: 2.6,
        cpa: 2.29,
        action: 'Mantener',
        reason: 'Rendimiento sólido con ROAS de 2.6 en el rango intermedio (2.0 - 3.0). Gran volumen de leads desde el bot de WhatsApp.',
        budgetRecommendation: 'Mantener el presupuesto estable. Realizar pruebas A/B de creativos para intentar bajar el CPA a $2.00.'
      },
      {
        campaignId: 'CAMP-003',
        campaignName: 'Ads Cama Multifuncional Perú',
        roas: 1.4,
        cpa: 4.78,
        action: 'Optimizar',
        reason: 'ROAS bajo de 1.4. El CPA de $4.78 está presionando los márgenes del producto de $20 en Perú.',
        budgetRecommendation: 'Detener creativos de menor rendimiento. Revisar el flujo del bot de WhatsApp para mejorar la tasa de conversión contacto-a-venta.'
      },
      {
        campaignId: 'CAMP-004',
        campaignName: 'Ads Combo Muebles Venezuela',
        roas: 4.2,
        cpa: 1.92,
        action: 'Escalar',
        reason: 'Excelente rendimiento con ROAS de 4.2. El combo de planos a $35 está convirtiendo sumamente bien debido a la oferta empaquetada.',
        budgetRecommendation: 'Duplicar el presupuesto de esta campaña de forma inmediata. Es la de mayor retorno por dólar invertido.'
      },
      {
        campaignId: 'CAMP-005',
        campaignName: 'Ads Retargeting LATAM - Todos',
        roas: 4.8,
        cpa: 1.32,
        action: 'Escalar',
        reason: 'La campaña de retargeting tiene el ROAS más alto (4.8). Aprovecha la audiencia tibia que interactuó previamente con los bots.',
        budgetRecommendation: 'Aumentar presupuesto un 30% para absorber todo el tráfico tibio acumulado de los países activos.'
      },
      {
        campaignId: 'CAMP-006',
        campaignName: 'Ads Banco Carpintero - Colombia Antiguo',
        roas: 0.8,
        cpa: 7.00,
        action: 'Pausar',
        reason: 'ROAS crítico de 0.8 y un CPA insostenible de $7.00. El producto tiene baja demanda o la audiencia se saturó.',
        budgetRecommendation: 'Mantener pausada. Rediseñar por completo la oferta o cambiar los planos promocionados por el banco clásico.'
      }
    ];
  };

  if (!aiClient) {
    // Return high quality simulation to keep application fully functional
    return res.json({
      recommendations: getMockRecommendations(),
      isSimulated: true,
      message: 'Utilizando recomendación local optimizada. Configura tu GEMINI_API_KEY en Secrets para análisis en tiempo real.'
    });
  }

  try {
    const prompt = `
      Eres un consultor experto en Growth Marketing, Meta Ads y WhatsApp Automation para infoproductos en Latinoamérica.
      Analiza el rendimiento de las siguientes campañas de anuncios de Meta y la facturación correspondiente en WhatsApp.
      País seleccionado en el filtro actual: ${countryFilter || 'Todos'}.

      Datos de Campañas de Meta Ads:
      ${JSON.stringify(campaigns, null, 2)}

      Resumen de Ventas vía Bots de WhatsApp:
      ${JSON.stringify(salesSummary, null, 2)}

      Reglas de Semáforo de Decisiones ROAS:
      - ROAS > 3.0: "Escalar" (Sugerir aumento de presupuesto controlado).
      - ROAS 2.0 a 3.0: "Mantener" (Recomendar estabilización y pruebas de creativos).
      - ROAS 1.0 a 2.0: "Optimizar" (Recomendar revisión de copies, segmentación o flujo del bot de WhatsApp).
      - ROAS < 1.0: "Pausar" (Apagar temporalmente la campaña por CPA alto e insostenible).

      Genera una lista de recomendaciones de optimización técnica para cada campaña utilizando el formato estructurado requerido.
      Evita generalidades. Sé directo, técnico y ofrece acciones concretas en español.
    `;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Eres un analista de datos de marketing con foco en optimización de presupuestos de anuncios (Meta Ads) y automatización de embudos de WhatsApp.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['recommendations'],
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['campaignId', 'campaignName', 'roas', 'cpa', 'action', 'reason', 'budgetRecommendation'],
                properties: {
                  campaignId: { type: Type.STRING },
                  campaignName: { type: Type.STRING },
                  roas: { type: Type.NUMBER },
                  cpa: { type: Type.NUMBER },
                  action: { type: Type.STRING, description: 'Debe ser uno de: Escalar, Mantener, Optimizar, Pausar' },
                  reason: { type: Type.STRING, description: 'Explicación detallada del por qué de la acción basándose en ROAS y CPA' },
                  budgetRecommendation: { type: Type.STRING, description: 'Acción presupuestaria concreta recomendada' }
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = JSON.parse(resultText);
    return res.json({
      recommendations: parsed.recommendations,
      isSimulated: false
    });

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.json({
      recommendations: getMockRecommendations(),
      isSimulated: true,
      error: error.message || 'Error consultando a la API de Gemini'
    });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
