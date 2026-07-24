/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

import { supabaseServer, supabaseAdmin } from './src/db/index.js';
import { insertVentaSchema, updateVentaSchema } from './src/db/schema.js';

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

// ----------------------------------------------------
// SUPABASE REAL DATA ENDPOINTS (DRINK & DRIZZLE BACKEND)
// ----------------------------------------------------

// 1. Fetch complete dashboard dataset from Supabase
app.get('/api/dashboard/all', async (req, res) => {
  try {
    const [paisesRes, productosRes, botsRes, campanasRes, ventasRes, resumenRes] = await Promise.all([
      supabaseServer.from('paises').select('*').order('nombre'),
      supabaseServer.from('productos').select('*').order('nombre'),
      supabaseServer.from('bots_whatsapp').select('*, paises(nombre)').order('nombre'),
      supabaseServer.from('campanas_meta').select('*, paises(nombre)').order('created_at', { ascending: false }),
      supabaseServer.from('ventas').select('*, paises(nombre), productos(nombre), bots_whatsapp(nombre)').order('fecha', { ascending: false }),
      supabaseServer.from('resumen_por_anuncio').select('*')
    ]);

    if (paisesRes.error) throw paisesRes.error;
    if (productosRes.error) throw productosRes.error;
    if (botsRes.error) throw botsRes.error;
    if (campanasRes.error) throw campanasRes.error;
    if (ventasRes.error) throw ventasRes.error;

    return res.json({
      paises: paisesRes.data,
      productos: productosRes.data,
      bots: botsRes.data,
      campanas: campanasRes.data,
      ventas: ventasRes.data,
      resumenPorAnuncio: resumenRes.data || [],
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return res.status(500).json({ error: error.message || 'Error fetching dashboard data' });
  }
});

// 2. Create Sale (Validated with Zod)
app.post('/api/sales', async (req, res) => {
  try {
    const parseResult = insertVentaSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Datos de venta inválidos', details: parseResult.error.format() });
    }

    const val = parseResult.data;
    const codigoVenta = `SALE-${Math.floor(10000 + Math.random() * 90000)}`;

    const { data, error } = await supabaseServer.from('ventas').insert({
      codigo_venta: codigoVenta,
      cliente_nombre: val.clienteNombre,
      cliente_telefono: val.clienteTelefono,
      producto_id: val.productoId,
      pais_id: val.paisId,
      bot_id: val.botId || null,
      monto_local: val.montoLocal,
      monto_usd: val.montoUsd,
      moneda: val.moneda,
      fecha: val.fecha || new Date().toISOString().split('T')[0],
      estado: val.estado || 'completada',
      tipo_venta: val.tipoVenta || 'contribucion_inicial',
      dia_semana: val.diaSemana || null,
      hora: val.hora || null,
      banco: val.banco || null,
      id_anuncio: val.idAnuncio || null,
      link_media: val.linkMedia || null,
      link_source: val.linkSource || null,
    }).select('*, paises(nombre), productos(nombre), bots_whatsapp(nombre)').single();

    if (error) throw error;
    return res.json(data);
  } catch (error: any) {
    console.error('Error creating sale:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 3. Update Sale (Validated with Zod)
app.put('/api/sales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const parseResult = updateVentaSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Datos de venta inválidos', details: parseResult.error.format() });
    }

    const val = parseResult.data;
    const updateData: Record<string, any> = {};
    if (val.clienteNombre !== undefined) updateData.cliente_nombre = val.clienteNombre;
    if (val.clienteTelefono !== undefined) updateData.cliente_telefono = val.clienteTelefono;
    if (val.productoId !== undefined) updateData.producto_id = val.productoId;
    if (val.paisId !== undefined) updateData.pais_id = val.paisId;
    if (val.botId !== undefined) updateData.bot_id = val.botId;
    if (val.montoLocal !== undefined) updateData.monto_local = val.montoLocal;
    if (val.montoUsd !== undefined) updateData.monto_usd = val.montoUsd;
    if (val.moneda !== undefined) updateData.moneda = val.moneda;
    if (val.fecha !== undefined) updateData.fecha = val.fecha;
    if (val.estado !== undefined) updateData.estado = val.estado;
    if (val.tipoVenta !== undefined) updateData.tipo_venta = val.tipoVenta;
    if (val.diaSemana !== undefined) updateData.dia_semana = val.diaSemana;
    if (val.hora !== undefined) updateData.hora = val.hora;
    if (val.banco !== undefined) updateData.banco = val.banco;
    if (val.idAnuncio !== undefined) updateData.id_anuncio = val.idAnuncio;
    if (val.linkMedia !== undefined) updateData.link_media = val.linkMedia;
    if (val.linkSource !== undefined) updateData.link_source = val.linkSource;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer
      .from('ventas')
      .update(updateData)
      .eq('id', id)
      .select('*, paises(nombre), productos(nombre), bots_whatsapp(nombre)')
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (error: any) {
    console.error('Error updating sale:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 4. Delete Sale
app.delete('/api/sales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseServer.from('ventas').delete().eq('id', id);
    if (error) throw error;
    return res.json({ success: true, id });
  } catch (error: any) {
    console.error('Error deleting sale:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 5. Toggle Single Campaign Status
app.patch('/api/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['active', 'paused'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const { data, error } = await supabaseServer
      .from('campanas_meta')
      .update({
        estado: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, paises(nombre)')
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (error: any) {
    console.error('Error updating campaign status:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 6. Bulk Campaign Status Change
app.post('/api/campaigns/bulk-status', async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !status || !['active', 'paused'].includes(status)) {
      return res.status(400).json({ error: 'Parámetros inválidos' });
    }

    const { error } = await supabaseServer
      .from('campanas_meta')
      .update({
        estado: status,
        updated_at: new Date().toISOString()
      })
      .in('id', ids);

    if (error) throw error;
    return res.json({ success: true, ids, status });
  } catch (error: any) {
    console.error('Error bulk updating campaigns:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 7. Bulk Delete Campaigns
app.post('/api/campaigns/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'IDs inválidos' });
    }

    const { error } = await supabaseServer.from('campanas_meta').delete().in('id', ids);
    if (error) throw error;
    return res.json({ success: true, ids });
  } catch (error: any) {
    console.error('Error bulk deleting campaigns:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Server-side CSV Helper Functions
const normalizeTextServer = (str: string = '') => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

const normalizeAlphaNum = (str: string = '') => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
};

const parseCSVLinesServer = (text: string): string[][] => {
  const lines: string[][] = [];
  let curRow: string[] = [];
  let curVal = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        curVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      curRow.push(curVal.trim());
      curVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      curRow.push(curVal.trim());
      if (curRow.some(cell => cell.length > 0)) {
        lines.push(curRow);
      }
      curRow = [];
      curVal = '';
    } else {
      curVal += char;
    }
  }

  if (curVal || curRow.length > 0) {
    curRow.push(curVal.trim());
    if (curRow.some(cell => cell.length > 0)) {
      lines.push(curRow);
    }
  }

  return lines;
};

const detectCountryIdServer = (adName: string, dbPaises: Array<{ id: string; nombre: string }>): string | null => {
  if (!adName) return null;
  const norm = normalizeTextServer(adName);
  const tokens = norm.split(/[^a-z0-9]+/).filter(Boolean);

  const countryPatterns: Array<{ keywords: string[]; nameKey: string }> = [
    { keywords: ['mexico', 'mex', 'mx'], nameKey: 'México' },
    { keywords: ['colombia', 'col', 'co'], nameKey: 'Colombia' },
    { keywords: ['bolivia', 'bol', 'bo'], nameKey: 'Bolivia' },
    { keywords: ['ecuador', 'ecu', 'ec'], nameKey: 'Ecuador' },
    { keywords: ['peru', 'pen', 'per', 'pe'], nameKey: 'Perú' },
    { keywords: ['venezuela', 'ves', 'ven', 've'], nameKey: 'Venezuela' },
  ];

  for (const cp of countryPatterns) {
    if (tokens.some(token => cp.keywords.includes(token))) {
      const match = dbPaises.find(p => normalizeTextServer(p.nombre) === normalizeTextServer(cp.nameKey));
      if (match) {
        return match.id;
      }
    }
  }

  return null;
};

// ----------------------------------------------------
// PRODUCT CATALOG ENDPOINTS (Supabase Service Role)
// ----------------------------------------------------

// GET /api/catalog/products
app.get('/api/catalog/products', async (req, res) => {
  try {
    const [prodRes, ppRes] = await Promise.all([
      supabaseAdmin.from('productos').select('*').order('nombre'),
      supabaseAdmin.from('productos_paises').select('*'),
    ]);

    if (prodRes.error) throw prodRes.error;

    const productosList = prodRes.data || [];
    const ppList = ppRes.data || [];

    const products = productosList.map(p => {
      const pais_ids = ppList
        .filter(pp => pp.producto_id === p.id)
        .map(pp => pp.pais_id);

      return {
        id: p.id,
        nombre: p.nombre,
        nombre_normalizado: p.nombre_normalizado || normalizeAlphaNum(p.nombre),
        precioBase: Number(p.precio_base) || 0,
        categoria: p.categoria || 'Infoproductos',
        pais_ids,
      };
    });

    return res.json({ success: true, products });
  } catch (error: any) {
    console.error('Error fetching catalog products:', error);
    return res.status(500).json({ error: error.message || 'Error al obtener catálogo' });
  }
});

// POST /api/catalog/products
app.post('/api/catalog/products', async (req, res) => {
  try {
    const { nombre, precioBase, pais_ids, categoria } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del producto es obligatorio.' });
    }

    const nombreNormalizado = normalizeAlphaNum(nombre);
    const precio = Number(precioBase) || 0;

    // 1. Insert into productos
    const { data: newProd, error: prodErr } = await supabaseAdmin
      .from('productos')
      .insert([{
        nombre: nombre.trim(),
        nombre_normalizado: nombreNormalizado,
        precio_base: precio,
        categoria: categoria || 'Infoproductos',
      }])
      .select('*')
      .single();

    if (prodErr) throw prodErr;

    // 2. Insert into productos_paises for selected country IDs
    const selectedPaisIds: string[] = Array.isArray(pais_ids) ? pais_ids : [];
    if (selectedPaisIds.length > 0) {
      const ppPayload = selectedPaisIds.map(paisId => ({
        producto_id: newProd.id,
        pais_id: paisId,
      }));
      await supabaseAdmin.from('productos_paises').insert(ppPayload);
    }

    return res.json({
      success: true,
      product: {
        id: newProd.id,
        nombre: newProd.nombre,
        nombre_normalizado: newProd.nombre_normalizado || nombreNormalizado,
        precioBase: Number(newProd.precio_base) || 0,
        categoria: newProd.categoria,
        pais_ids: selectedPaisIds,
      }
    });
  } catch (error: any) {
    console.error('Error creating catalog product:', error);
    return res.status(500).json({ error: error.message || 'Error al guardar producto' });
  }
});

// PUT /api/catalog/products/:id
app.put('/api/catalog/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precioBase, pais_ids, categoria } = req.body;

    if (!id) return res.status(400).json({ error: 'ID de producto requerido' });

    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (nombre) {
      updatePayload.nombre = nombre.trim();
      updatePayload.nombre_normalizado = normalizeAlphaNum(nombre);
    }
    if (precioBase !== undefined) updatePayload.precio_base = Number(precioBase);
    if (categoria) updatePayload.categoria = categoria;

    const { data: updatedProd, error: updateErr } = await supabaseAdmin
      .from('productos')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (updateErr) throw updateErr;

    // Update productos_paises
    const selectedPaisIds: string[] = Array.isArray(pais_ids) ? pais_ids : [];
    await supabaseAdmin.from('productos_paises').delete().eq('producto_id', id);
    if (selectedPaisIds.length > 0) {
      const ppPayload = selectedPaisIds.map(paisId => ({
        producto_id: id,
        pais_id: paisId,
      }));
      await supabaseAdmin.from('productos_paises').insert(ppPayload);
    }

    return res.json({
      success: true,
      product: {
        id: updatedProd.id,
        nombre: updatedProd.nombre,
        nombre_normalizado: updatedProd.nombre_normalizado || normalizeAlphaNum(updatedProd.nombre),
        precioBase: Number(updatedProd.precio_base) || 0,
        categoria: updatedProd.categoria,
        pais_ids: selectedPaisIds,
      }
    });
  } catch (error: any) {
    console.error('Error updating catalog product:', error);
    return res.status(500).json({ error: error.message || 'Error al actualizar producto' });
  }
});

// DELETE /api/catalog/products/:id
app.delete('/api/catalog/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID de producto requerido' });

    await supabaseAdmin.from('productos_paises').delete().eq('producto_id', id);
    const { error } = await supabaseAdmin.from('productos').delete().eq('id', id);
    if (error) throw error;

    return res.json({ success: true, id });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ error: error.message || 'Error al eliminar producto' });
  }
});

// 7b. Meta Ads CSV Server-Side Parse & Batch Upload Endpoint (Service Role Safe)
app.post('/api/meta-ads/upload', async (req, res) => {
  try {
    const { csvText, ads } = req.body;

    // If raw CSV string is sent from client, parse and process entirely on server
    if (csvText && typeof csvText === 'string') {
      const rows = parseCSVLinesServer(csvText);
      if (rows.length < 2) {
        return res.status(400).json({ error: 'El archivo CSV parece estar vacío o sin filas de datos.' });
      }

      // Fetch countries, products and product-country relationships from Supabase
      const [paisesRes, productosRes, ppRes] = await Promise.all([
        supabaseAdmin.from('paises').select('*'),
        supabaseAdmin.from('productos').select('*'),
        supabaseAdmin.from('productos_paises').select('*'),
      ]);

      const paisesList = paisesRes.data || [];
      const productosList = productosRes.data || [];
      const productosPaisesList = ppRes.data || [];

      const header = rows[0].map(h => h.trim());

      // Find "Ad ID" column
      const adIdColIndex = header.findIndex(h => {
        const norm = normalizeTextServer(h);
        return norm === 'ad id' || norm === 'id de anuncio' || norm === 'adid';
      });

      if (adIdColIndex === -1) {
        return res.status(400).json({ error: 'Este reporte no tiene desglose por Anuncio. Exporta de nuevo con breakdown a nivel de Ad ID.' });
      }

      // Find "Ad name" column
      const adNameColIndex = header.findIndex(h => {
        const norm = normalizeTextServer(h);
        return norm === 'ad name' || norm === 'nombre del anuncio' || norm === 'adname' || norm.includes('ad name') || norm.includes('nombre del anuncio') || norm.includes('nombre de anuncio') || norm.includes('anuncio');
      });

      // Find "Amount spent" column and detect currency
      let spendColIndex = -1;
      let detectedCurrency = 'USD';

      header.forEach((colName, idx) => {
        const norm = normalizeTextServer(colName);
        if (norm.startsWith('amount spent') || norm.startsWith('importe gastado') || norm.includes('gasto')) {
          spendColIndex = idx;
          const currMatch = colName.match(/\(([A-Z]{3})\)/i);
          if (currMatch) {
            detectedCurrency = currMatch[1].toUpperCase();
          }
        }
      });

      if (spendColIndex === -1) {
        return res.status(400).json({ error: 'No se encontró la columna de gasto ("Amount spent"). Verifica las columnas del CSV.' });
      }

      const dateColIndex = header.findIndex(h => normalizeTextServer(h).includes('reporting starts') || normalizeTextServer(h).includes('inicio') || normalizeTextServer(h).includes('date'));
      const resultsColIndex = header.findIndex(h => normalizeTextServer(h) === 'results' || normalizeTextServer(h) === 'purchases' || normalizeTextServer(h).includes('compras'));
      const cpaColIndex = header.findIndex(h => normalizeTextServer(h).includes('cost per results') || normalizeTextServer(h).includes('cost per purchase') || normalizeTextServer(h).includes('cpa'));
      const impressionsColIndex = header.findIndex(h => normalizeTextServer(h).includes('impressions') || normalizeTextServer(h).includes('impresiones'));
      const clicksColIndex = header.findIndex(h => normalizeTextServer(h).includes('clicks') || normalizeTextServer(h).includes('clics'));

      let rate = 1;
      if (detectedCurrency !== 'USD') {
        const matchCountry = paisesList.find(p => p.moneda?.toUpperCase() === detectedCurrency);
        if (matchCountry && matchCountry.tasa_de_cambio) {
          rate = Number(matchCountry.tasa_de_cambio) || 1;
        } else if (detectedCurrency === 'COP') rate = 4000;
        else if (detectedCurrency === 'MXN') rate = 18.5;
        else if (detectedCurrency === 'BOB') rate = 6.9;
        else if (detectedCurrency === 'PEN') rate = 3.7;
        else if (detectedCurrency === 'VES') rate = 36;
      }

      const dbPayload: any[] = [];
      let ignoredCount = 0;
      let matchedCount = 0;
      const countryMismatchList: Array<{ adId: string; adName: string; detectedProduct: string; detectedCountry: string }> = [];
      const unrecognizedProductList: Array<{ adId: string; adName: string; detectedProductText: string; detectedCountry: string }> = [];

      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        const rawAdId = r[adIdColIndex]?.trim();
        if (!rawAdId) continue;

        const rawAdName = adNameColIndex !== -1 ? (r[adNameColIndex] || '') : 'Anuncio';
        const paisId = detectCountryIdServer(rawAdName, paisesList);

        if (!paisId) {
          ignoredCount++;
          continue;
        }

        const matchCountryObj = paisesList.find(p => p.id === paisId);
        const countryName = matchCountryObj ? matchCountryObj.nombre : 'País Desconocido';

        // Parse Ad Name: AD{número}|{ETAPA}|{PAÍS}|{PRODUCTO}
        const nameParts = rawAdName.split('|').map(p => p.trim());
        let detectedProductText = '';
        if (nameParts.length >= 4) {
          detectedProductText = nameParts.slice(3).join('|').trim();
        } else if (nameParts.length === 3) {
          detectedProductText = nameParts[2].trim();
        } else {
          detectedProductText = rawAdName;
        }

        const normProductText = normalizeAlphaNum(detectedProductText);

        // Catalog product lookup
        const matchedProduct = normProductText ? productosList.find(p => {
          const normPName = p.nombre_normalizado ? p.nombre_normalizado : normalizeAlphaNum(p.nombre);
          return normPName === normProductText;
        }) : null;

        if (matchedProduct) {
          const isCountryRegistered = productosPaisesList.some(
            pp => pp.producto_id === matchedProduct.id && pp.pais_id === paisId
          );

          if (isCountryRegistered) {
            matchedCount++;
          } else {
            countryMismatchList.push({
              adId: String(rawAdId).trim(),
              adName: String(rawAdName).trim(),
              detectedProduct: matchedProduct.nombre,
              detectedCountry: countryName,
            });
          }
        } else {
          unrecognizedProductList.push({
            adId: String(rawAdId).trim(),
            adName: String(rawAdName).trim(),
            detectedProductText: detectedProductText || rawAdName,
            detectedCountry: countryName,
          });
        }

        const rawSpend = parseFloat((r[spendColIndex] || '0').replace(/[^0-9.]/g, '')) || 0;
        const gastoUsd = rate > 0 ? rawSpend / rate : rawSpend;

        const rawDate = dateColIndex !== -1 ? r[dateColIndex] : new Date().toISOString().split('T')[0];
        const rawResults = resultsColIndex !== -1 ? parseInt(r[resultsColIndex] || '0', 10) : 0;
        const rawCpa = cpaColIndex !== -1 ? parseFloat((r[cpaColIndex] || '0').replace(/[^0-9.]/g, '')) : 0;
        const rawImpressions = impressionsColIndex !== -1 ? parseInt(r[impressionsColIndex] || '0', 10) : 0;
        const rawClicks = clicksColIndex !== -1 ? parseInt(r[clicksColIndex] || '0', 10) : 0;

        dbPayload.push({
          codigo_campana: String(rawAdId).trim(),
          nombre: String(rawAdName).trim(),
          pais_id: paisId,
          gasto: Math.round(gastoUsd * 100) / 100,
          impresiones: rawImpressions,
          clics: rawClicks,
          cpa: Math.round(rawCpa * 100) / 100,
          roas: 0,
          conversiones: rawResults,
          estado: 'active',
          fecha: rawDate,
        });
      }

      if (dbPayload.length === 0) {
        if (ignoredCount > 0) {
          return res.status(400).json({ error: `Se ignoraron ${ignoredCount} filas sin país identificable en el nombre del anuncio.` });
        }
        return res.status(400).json({ error: 'No se encontraron filas con "Ad ID" válido en el archivo.' });
      }

      // Upsert into Supabase campanas_meta via service_role client (supabaseAdmin)
      const { data, error } = await supabaseAdmin
        .from('campanas_meta')
        .upsert(dbPayload, { onConflict: 'codigo_campana,fecha' })
        .select('id, codigo_campana, pais_id');

      if (error) throw error;

      return res.json({
        success: true,
        insertedCount: dbPayload.length,
        ignoredCount,
        matchedCount,
        countryMismatchCount: countryMismatchList.length,
        countryMismatchList,
        unrecognizedProductCount: unrecognizedProductList.length,
        unrecognizedProductList,
        data
      });
    }

    // Fallback: Pre-parsed ads array payload
    if (!Array.isArray(ads) || ads.length === 0) {
      return res.status(400).json({ error: 'No se recibieron filas válidas para importar.' });
    }

    const dbPayload = ads.map(a => ({
      codigo_campana: String(a.codigoCampana).trim(),
      nombre: String(a.nombre || 'Anuncio Sin Nombre').trim(),
      pais_id: a.paisId || null,
      gasto: Number(a.gasto) || 0,
      impresiones: Number(a.impresiones) || 0,
      clics: Number(a.clics) || 0,
      cpa: Number(a.cpa) || 0,
      roas: Number(a.roas) || 0,
      conversiones: Number(a.conversiones) || 0,
      estado: a.estado || 'active',
      fecha: a.fecha || new Date().toISOString().split('T')[0],
    }));

    const { data, error } = await supabaseServer
      .from('campanas_meta')
      .upsert(dbPayload, { onConflict: 'codigo_campana,fecha' })
      .select('id, codigo_campana, pais_id');

    if (error) throw error;

    const ignoredCount = dbPayload.filter(p => !p.pais_id).length;

    return res.json({
      success: true,
      insertedCount: dbPayload.length,
      ignoredCount,
      data
    });
  } catch (error: any) {
    console.error('Error batch uploading Meta Ads CSV:', error);
    return res.status(500).json({ error: error.message || 'Error importando reporte Meta Ads.' });
  }
});

// 7c. Meta Ads Assign Country to Unidentified Ad ID
app.patch('/api/meta-ads/assign-country', async (req, res) => {
  try {
    const { codigoCampana, paisId } = req.body;
    if (!codigoCampana || !paisId) {
      return res.status(400).json({ error: 'codigoCampana y paisId son obligatorios' });
    }

    const { error } = await supabaseServer
      .from('campanas_meta')
      .update({ pais_id: paisId, updated_at: new Date().toISOString() })
      .eq('codigo_campana', codigoCampana);

    if (error) throw error;
    return res.json({ success: true, codigoCampana, paisId });
  } catch (error: any) {
    console.error('Error assigning country to Meta Ad:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 7d. Clear All Meta Ads Data
app.delete('/api/meta-ads/all', async (req, res) => {
  try {
    const { error } = await supabaseServer.from('campanas_meta').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Error clearing Meta Ads:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 8. Create or Update Product
app.post('/api/products', async (req, res) => {
  try {
    const { id, nombre, precioBase, categoria } = req.body;
    if (!nombre || precioBase === undefined) {
      return res.status(400).json({ error: 'Nombre y precioBase son requeridos' });
    }

    if (id) {
      const { data, error } = await supabaseServer.from('productos').update({
        nombre,
        precio_base: precioBase,
        categoria: categoria || 'Infoproductos',
        updated_at: new Date().toISOString()
      }).eq('id', id).select('*').single();
      if (error) throw error;
      return res.json(data);
    } else {
      const { data, error } = await supabaseServer.from('productos').insert({
        nombre,
        precio_base: precioBase,
        categoria: categoria || 'Infoproductos'
      }).select('*').single();
      if (error) throw error;
      return res.json(data);
    }
  } catch (error: any) {
    console.error('Error saving product:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 9. Update Country Exchange Rate
app.post('/api/countries', async (req, res) => {
  try {
    const { name, currency, rate } = req.body;
    if (!name || !currency || rate === undefined) {
      return res.status(400).json({ error: 'Datos de país incompletos' });
    }

    const { data, error } = await supabaseServer.from('paises').update({
      moneda: currency,
      tasa_de_cambio: rate,
      updated_at: new Date().toISOString()
    }).eq('nombre', name).select('*').single();

    if (error) throw error;
    return res.json(data);
  } catch (error: any) {
    console.error('Error updating country:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// AI ADVISOR ENDPOINT (GEMINI 3.5 FLASH)
// ----------------------------------------------------
app.post('/api/gemini/analyze', async (req, res) => {
  const { campaigns, salesSummary, countryFilter } = req.body;

  if (!campaigns || !salesSummary) {
    return res.status(400).json({ error: 'Missing campaigns or salesSummary data' });
  }

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
    return res.json({
      recommendations: getMockRecommendations(),
      isSimulated: true,
      message: 'Utilizando recomendación local optimizada. Configura tu GEMINI_API_KEY para análisis en tiempo real.'
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

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT} and http://127.0.0.1:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      const altPort = PORT + 1;
      console.log(`Port ${PORT} in use, trying ${altPort}...`);
      app.listen(altPort, '0.0.0.0', () => {
        console.log(`Server running at http://localhost:${altPort} and http://127.0.0.1:${altPort}`);
      });
    } else {
      console.error('Server error:', err);
    }
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;

