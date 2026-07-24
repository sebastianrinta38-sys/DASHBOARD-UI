// server.ts
import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv2 from "dotenv";

// src/db/index.ts
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// src/db/schema.ts
import { pgTable, uuid, text, numeric, integer, date, timestamp, pgView, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { z } from "zod";
var paises = pgTable("paises", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").unique().notNull(),
  moneda: text("moneda").notNull(),
  tasaDeCambio: numeric("tasa_de_cambio", { precision: 12, scale: 4 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var productos = pgTable("productos", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull(),
  nombreNormalizado: text("nombre_normalizado"),
  precioBase: numeric("precio_base", { precision: 10, scale: 2 }).default("0.00").notNull(),
  categoria: text("categoria").default("Infoproductos").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var productosPaises = pgTable("productos_paises", {
  id: uuid("id").defaultRandom().primaryKey(),
  productoId: uuid("producto_id").references(() => productos.id, { onDelete: "cascade" }),
  paisId: uuid("pais_id").references(() => paises.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var botsWhatsapp = pgTable("bots_whatsapp", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull(),
  numero: text("numero").default("").notNull(),
  paisId: uuid("pais_id").references(() => paises.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var campanasMeta = pgTable("campanas_meta", {
  id: uuid("id").defaultRandom().primaryKey(),
  codigoCampana: text("codigo_campana"),
  nombre: text("nombre").notNull(),
  paisId: uuid("pais_id").references(() => paises.id, { onDelete: "set null" }),
  gasto: numeric("gasto", { precision: 10, scale: 2 }).default("0.00").notNull(),
  impresiones: integer("impresiones").default(0).notNull(),
  clics: integer("clics").default(0).notNull(),
  cpa: numeric("cpa", { precision: 10, scale: 2 }).default("0.00").notNull(),
  roas: numeric("roas", { precision: 10, scale: 2 }).default("0.00").notNull(),
  conversiones: integer("conversiones").default(0).notNull(),
  estado: text("estado").default("active").notNull(),
  fecha: date("fecha").defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  codigoFechaUnique: unique("campanas_meta_codigo_fecha_unique").on(t.codigoCampana, t.fecha)
}));
var ventas = pgTable("ventas", {
  id: uuid("id").defaultRandom().primaryKey(),
  codigoVenta: text("codigo_venta").unique(),
  clienteNombre: text("cliente_nombre").notNull(),
  clienteTelefono: text("cliente_telefono").notNull(),
  productoId: uuid("producto_id").references(() => productos.id, { onDelete: "restrict" }),
  paisId: uuid("pais_id").references(() => paises.id, { onDelete: "restrict" }),
  botId: uuid("bot_id").references(() => botsWhatsapp.id, { onDelete: "set null" }),
  montoLocal: numeric("monto_local", { precision: 12, scale: 2 }).notNull(),
  montoUsd: numeric("monto_usd", { precision: 10, scale: 2 }).notNull(),
  moneda: text("moneda").notNull(),
  fecha: date("fecha").defaultNow().notNull(),
  estado: text("estado").default("completada").notNull(),
  tipoVenta: text("tipo_venta").default("contribucion_inicial"),
  diaSemana: text("dia_semana"),
  hora: text("hora"),
  banco: text("banco"),
  idAnuncio: text("id_anuncio"),
  linkMedia: text("link_media"),
  linkSource: text("link_source"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var resumenPorAnuncio = pgView("resumen_por_anuncio", {
  idAnuncio: text("id_anuncio"),
  pais: text("pais"),
  bot: text("bot"),
  numeroVentas: integer("numero_ventas"),
  facturacion: numeric("facturacion", { precision: 12, scale: 2 }),
  ticketPromedio: numeric("ticket_promedio", { precision: 12, scale: 2 })
}).existing();
var paisesRelations = relations(paises, ({ many }) => ({
  bots: many(botsWhatsapp),
  campanas: many(campanasMeta),
  ventas: many(ventas)
}));
var productosRelations = relations(productos, ({ many }) => ({
  ventas: many(ventas)
}));
var botsRelations = relations(botsWhatsapp, ({ one, many }) => ({
  pais: one(paises, { fields: [botsWhatsapp.paisId], references: [paises.id] }),
  ventas: many(ventas)
}));
var campanasRelations = relations(campanasMeta, ({ one }) => ({
  pais: one(paises, { fields: [campanasMeta.paisId], references: [paises.id] })
}));
var ventasRelations = relations(ventas, ({ one }) => ({
  producto: one(productos, { fields: [ventas.productoId], references: [productos.id] }),
  pais: one(paises, { fields: [ventas.paisId], references: [paises.id] }),
  bot: one(botsWhatsapp, { fields: [ventas.botId], references: [botsWhatsapp.id] })
}));
var insertVentaSchema = z.object({
  clienteNombre: z.string().min(1, "El nombre del cliente es requerido"),
  clienteTelefono: z.string().min(1, "El tel\xE9fono es requerido"),
  productoId: z.string().uuid(),
  paisId: z.string().uuid(),
  botId: z.string().uuid().optional().nullable(),
  montoLocal: z.number().positive(),
  montoUsd: z.number().positive(),
  moneda: z.string().min(1),
  fecha: z.string().optional(),
  estado: z.enum(["completada", "pendiente", "cancelada"]).default("completada"),
  tipoVenta: z.string().optional().nullable(),
  diaSemana: z.string().optional().nullable(),
  hora: z.string().optional().nullable(),
  banco: z.string().optional().nullable(),
  idAnuncio: z.string().optional().nullable(),
  linkMedia: z.string().optional().nullable(),
  linkSource: z.string().optional().nullable()
});
var updateVentaSchema = insertVentaSchema.partial();

// src/db/index.ts
dotenv.config({ path: ".env.local" });
dotenv.config();
var supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://pbckgpihujsfyvyaubro.supabase.co";
var anonKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_MHRTClHjiJZ6LEhY1SVB7g_GyvWtYg_";
var serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) {
  console.warn("\n\u26A0\uFE0F [SUPABASE WARNING]: SUPABASE_SERVICE_ROLE_KEY no est\xE1 definida en .env.local!");
  console.warn("\u26A0\uFE0F Las escrituras a Supabase fallar\xE1n por RLS hasta que pegues tu service_role key en .env.local.\n");
} else {
  console.log("\u2705 [SUPABASE SERVER]: SUPABASE_SERVICE_ROLE_KEY cargada correctamente en el servidor.");
}
var supabasePublic = createClient(supabaseUrl, anonKey);
var supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});
var supabaseServer = supabaseAdmin;

// server.ts
dotenv2.config({ path: ".env.local" });
dotenv2.config();
var app = express();
app.use(express.json());
var PORT = 3e3;
var apiKey = process.env.GEMINI_API_KEY;
var isRealApiKey = apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "";
var aiClient = null;
if (isRealApiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
app.get("/api/dashboard/all", async (req, res) => {
  try {
    const [paisesRes, productosRes, botsRes, campanasRes, ventasRes, resumenRes] = await Promise.all([
      supabaseServer.from("paises").select("*").order("nombre"),
      supabaseServer.from("productos").select("*").order("nombre"),
      supabaseServer.from("bots_whatsapp").select("*, paises(nombre)").order("nombre"),
      supabaseServer.from("campanas_meta").select("*, paises(nombre)").order("created_at", { ascending: false }),
      supabaseServer.from("ventas").select("*, paises(nombre), productos(nombre), bots_whatsapp(nombre)").order("fecha", { ascending: false }),
      supabaseServer.from("resumen_por_anuncio").select("*")
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
      resumenPorAnuncio: resumenRes.data || []
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).json({ error: error.message || "Error fetching dashboard data" });
  }
});
app.post("/api/sales", async (req, res) => {
  try {
    const parseResult = insertVentaSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Datos de venta inv\xE1lidos", details: parseResult.error.format() });
    }
    const val = parseResult.data;
    const codigoVenta = `SALE-${Math.floor(1e4 + Math.random() * 9e4)}`;
    const { data, error } = await supabaseServer.from("ventas").insert({
      codigo_venta: codigoVenta,
      cliente_nombre: val.clienteNombre,
      cliente_telefono: val.clienteTelefono,
      producto_id: val.productoId,
      pais_id: val.paisId,
      bot_id: val.botId || null,
      monto_local: val.montoLocal,
      monto_usd: val.montoUsd,
      moneda: val.moneda,
      fecha: val.fecha || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      estado: val.estado || "completada",
      tipo_venta: val.tipoVenta || "contribucion_inicial",
      dia_semana: val.diaSemana || null,
      hora: val.hora || null,
      banco: val.banco || null,
      id_anuncio: val.idAnuncio || null,
      link_media: val.linkMedia || null,
      link_source: val.linkSource || null
    }).select("*, paises(nombre), productos(nombre), bots_whatsapp(nombre)").single();
    if (error) throw error;
    return res.json(data);
  } catch (error) {
    console.error("Error creating sale:", error);
    return res.status(500).json({ error: error.message });
  }
});
app.put("/api/sales/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const parseResult = updateVentaSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Datos de venta inv\xE1lidos", details: parseResult.error.format() });
    }
    const val = parseResult.data;
    const updateData = {};
    if (val.clienteNombre !== void 0) updateData.cliente_nombre = val.clienteNombre;
    if (val.clienteTelefono !== void 0) updateData.cliente_telefono = val.clienteTelefono;
    if (val.productoId !== void 0) updateData.producto_id = val.productoId;
    if (val.paisId !== void 0) updateData.pais_id = val.paisId;
    if (val.botId !== void 0) updateData.bot_id = val.botId;
    if (val.montoLocal !== void 0) updateData.monto_local = val.montoLocal;
    if (val.montoUsd !== void 0) updateData.monto_usd = val.montoUsd;
    if (val.moneda !== void 0) updateData.moneda = val.moneda;
    if (val.fecha !== void 0) updateData.fecha = val.fecha;
    if (val.estado !== void 0) updateData.estado = val.estado;
    if (val.tipoVenta !== void 0) updateData.tipo_venta = val.tipoVenta;
    if (val.diaSemana !== void 0) updateData.dia_semana = val.diaSemana;
    if (val.hora !== void 0) updateData.hora = val.hora;
    if (val.banco !== void 0) updateData.banco = val.banco;
    if (val.idAnuncio !== void 0) updateData.id_anuncio = val.idAnuncio;
    if (val.linkMedia !== void 0) updateData.link_media = val.linkMedia;
    if (val.linkSource !== void 0) updateData.link_source = val.linkSource;
    updateData.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    const { data, error } = await supabaseServer.from("ventas").update(updateData).eq("id", id).select("*, paises(nombre), productos(nombre), bots_whatsapp(nombre)").single();
    if (error) throw error;
    return res.json(data);
  } catch (error) {
    console.error("Error updating sale:", error);
    return res.status(500).json({ error: error.message });
  }
});
app.delete("/api/sales/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseServer.from("ventas").delete().eq("id", id);
    if (error) throw error;
    return res.json({ success: true, id });
  } catch (error) {
    console.error("Error deleting sale:", error);
    return res.status(500).json({ error: error.message });
  }
});
app.patch("/api/campaigns/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !["active", "paused"].includes(status)) {
      return res.status(400).json({ error: "Estado inv\xE1lido" });
    }
    const { data, error } = await supabaseServer.from("campanas_meta").update({
      estado: status,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", id).select("*, paises(nombre)").single();
    if (error) throw error;
    return res.json(data);
  } catch (error) {
    console.error("Error updating campaign status:", error);
    return res.status(500).json({ error: error.message });
  }
});
app.post("/api/campaigns/bulk-status", async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !status || !["active", "paused"].includes(status)) {
      return res.status(400).json({ error: "Par\xE1metros inv\xE1lidos" });
    }
    const { error } = await supabaseServer.from("campanas_meta").update({
      estado: status,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).in("id", ids);
    if (error) throw error;
    return res.json({ success: true, ids, status });
  } catch (error) {
    console.error("Error bulk updating campaigns:", error);
    return res.status(500).json({ error: error.message });
  }
});
app.post("/api/campaigns/bulk-delete", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: "IDs inv\xE1lidos" });
    }
    const { error } = await supabaseServer.from("campanas_meta").delete().in("id", ids);
    if (error) throw error;
    return res.json({ success: true, ids });
  } catch (error) {
    console.error("Error bulk deleting campaigns:", error);
    return res.status(500).json({ error: error.message });
  }
});
var normalizeTextServer = (str = "") => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};
var normalizeAlphaNum = (str = "") => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
};
var parseCSVLinesServer = (text2) => {
  const lines = [];
  let curRow = [];
  let curVal = "";
  let inQuotes = false;
  for (let i = 0; i < text2.length; i++) {
    const char = text2[i];
    const nextChar = text2[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        curVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      curRow.push(curVal.trim());
      curVal = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      curRow.push(curVal.trim());
      if (curRow.some((cell) => cell.length > 0)) {
        lines.push(curRow);
      }
      curRow = [];
      curVal = "";
    } else {
      curVal += char;
    }
  }
  if (curVal || curRow.length > 0) {
    curRow.push(curVal.trim());
    if (curRow.some((cell) => cell.length > 0)) {
      lines.push(curRow);
    }
  }
  return lines;
};
var detectCountryIdServer = (adName, dbPaises) => {
  if (!adName) return null;
  const norm = normalizeTextServer(adName);
  const tokens = norm.split(/[^a-z0-9]+/).filter(Boolean);
  const countryPatterns = [
    { keywords: ["mexico", "mex", "mx"], nameKey: "M\xE9xico" },
    { keywords: ["colombia", "col", "co"], nameKey: "Colombia" },
    { keywords: ["bolivia", "bol", "bo"], nameKey: "Bolivia" },
    { keywords: ["ecuador", "ecu", "ec"], nameKey: "Ecuador" },
    { keywords: ["peru", "pen", "per", "pe"], nameKey: "Per\xFA" },
    { keywords: ["venezuela", "ves", "ven", "ve"], nameKey: "Venezuela" }
  ];
  for (const cp of countryPatterns) {
    if (tokens.some((token) => cp.keywords.includes(token))) {
      const match = dbPaises.find((p) => normalizeTextServer(p.nombre) === normalizeTextServer(cp.nameKey));
      if (match) {
        return match.id;
      }
    }
  }
  return null;
};
app.get("/api/catalog/products", async (req, res) => {
  try {
    const [prodRes, ppRes] = await Promise.all([
      supabaseAdmin.from("productos").select("*").order("nombre"),
      supabaseAdmin.from("productos_paises").select("*")
    ]);
    if (prodRes.error) throw prodRes.error;
    const productosList = prodRes.data || [];
    const ppList = ppRes.data || [];
    const products = productosList.map((p) => {
      const pais_ids = ppList.filter((pp) => pp.producto_id === p.id).map((pp) => pp.pais_id);
      return {
        id: p.id,
        nombre: p.nombre,
        nombre_normalizado: p.nombre_normalizado || normalizeAlphaNum(p.nombre),
        precioBase: Number(p.precio_base) || 0,
        categoria: p.categoria || "Infoproductos",
        pais_ids
      };
    });
    return res.json({ success: true, products });
  } catch (error) {
    console.error("Error fetching catalog products:", error);
    return res.status(500).json({ error: error.message || "Error al obtener cat\xE1logo" });
  }
});
app.post("/api/catalog/products", async (req, res) => {
  try {
    const { nombre, precioBase, pais_ids, categoria } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: "El nombre del producto es obligatorio." });
    }
    const nombreNormalizado = normalizeAlphaNum(nombre);
    const precio = Number(precioBase) || 0;
    const { data: newProd, error: prodErr } = await supabaseAdmin.from("productos").insert([{
      nombre: nombre.trim(),
      nombre_normalizado: nombreNormalizado,
      precio_base: precio,
      categoria: categoria || "Infoproductos"
    }]).select("*").single();
    if (prodErr) throw prodErr;
    const selectedPaisIds = Array.isArray(pais_ids) ? pais_ids : [];
    if (selectedPaisIds.length > 0) {
      const ppPayload = selectedPaisIds.map((paisId) => ({
        producto_id: newProd.id,
        pais_id: paisId
      }));
      await supabaseAdmin.from("productos_paises").insert(ppPayload);
    }
    return res.json({
      success: true,
      product: {
        id: newProd.id,
        nombre: newProd.nombre,
        nombre_normalizado: newProd.nombre_normalizado || nombreNormalizado,
        precioBase: Number(newProd.precio_base) || 0,
        categoria: newProd.categoria,
        pais_ids: selectedPaisIds
      }
    });
  } catch (error) {
    console.error("Error creating catalog product:", error);
    return res.status(500).json({ error: error.message || "Error al guardar producto" });
  }
});
app.put("/api/catalog/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precioBase, pais_ids, categoria } = req.body;
    if (!id) return res.status(400).json({ error: "ID de producto requerido" });
    const updatePayload = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
    if (nombre) {
      updatePayload.nombre = nombre.trim();
      updatePayload.nombre_normalizado = normalizeAlphaNum(nombre);
    }
    if (precioBase !== void 0) updatePayload.precio_base = Number(precioBase);
    if (categoria) updatePayload.categoria = categoria;
    const { data: updatedProd, error: updateErr } = await supabaseAdmin.from("productos").update(updatePayload).eq("id", id).select("*").single();
    if (updateErr) throw updateErr;
    const selectedPaisIds = Array.isArray(pais_ids) ? pais_ids : [];
    await supabaseAdmin.from("productos_paises").delete().eq("producto_id", id);
    if (selectedPaisIds.length > 0) {
      const ppPayload = selectedPaisIds.map((paisId) => ({
        producto_id: id,
        pais_id: paisId
      }));
      await supabaseAdmin.from("productos_paises").insert(ppPayload);
    }
    return res.json({
      success: true,
      product: {
        id: updatedProd.id,
        nombre: updatedProd.nombre,
        nombre_normalizado: updatedProd.nombre_normalizado || normalizeAlphaNum(updatedProd.nombre),
        precioBase: Number(updatedProd.precio_base) || 0,
        categoria: updatedProd.categoria,
        pais_ids: selectedPaisIds
      }
    });
  } catch (error) {
    console.error("Error updating catalog product:", error);
    return res.status(500).json({ error: error.message || "Error al actualizar producto" });
  }
});
app.delete("/api/catalog/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "ID de producto requerido" });
    await supabaseAdmin.from("productos_paises").delete().eq("producto_id", id);
    const { error } = await supabaseAdmin.from("productos").delete().eq("id", id);
    if (error) throw error;
    return res.json({ success: true, id });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ error: error.message || "Error al eliminar producto" });
  }
});
app.post("/api/meta-ads/upload", async (req, res) => {
  try {
    const { csvText, ads } = req.body;
    if (csvText && typeof csvText === "string") {
      const rows = parseCSVLinesServer(csvText);
      if (rows.length < 2) {
        return res.status(400).json({ error: "El archivo CSV parece estar vac\xEDo o sin filas de datos." });
      }
      const [paisesRes, productosRes, ppRes] = await Promise.all([
        supabaseAdmin.from("paises").select("*"),
        supabaseAdmin.from("productos").select("*"),
        supabaseAdmin.from("productos_paises").select("*")
      ]);
      const paisesList = paisesRes.data || [];
      const productosList = productosRes.data || [];
      const productosPaisesList = ppRes.data || [];
      const header = rows[0].map((h) => h.trim());
      const adIdColIndex = header.findIndex((h) => {
        const norm = normalizeTextServer(h);
        return norm === "ad id" || norm === "id de anuncio" || norm === "adid";
      });
      if (adIdColIndex === -1) {
        return res.status(400).json({ error: "Este reporte no tiene desglose por Anuncio. Exporta de nuevo con breakdown a nivel de Ad ID." });
      }
      const adNameColIndex = header.findIndex((h) => {
        const norm = normalizeTextServer(h);
        return norm === "ad name" || norm === "nombre del anuncio" || norm === "adname" || norm.includes("ad name") || norm.includes("nombre del anuncio") || norm.includes("nombre de anuncio") || norm.includes("anuncio");
      });
      let spendColIndex = -1;
      let detectedCurrency = "USD";
      header.forEach((colName, idx) => {
        const norm = normalizeTextServer(colName);
        if (norm.startsWith("amount spent") || norm.startsWith("importe gastado") || norm.includes("gasto")) {
          spendColIndex = idx;
          const currMatch = colName.match(/\(([A-Z]{3})\)/i);
          if (currMatch) {
            detectedCurrency = currMatch[1].toUpperCase();
          }
        }
      });
      if (spendColIndex === -1) {
        return res.status(400).json({ error: 'No se encontr\xF3 la columna de gasto ("Amount spent"). Verifica las columnas del CSV.' });
      }
      const dateColIndex = header.findIndex((h) => normalizeTextServer(h).includes("reporting starts") || normalizeTextServer(h).includes("inicio") || normalizeTextServer(h).includes("date"));
      const resultsColIndex = header.findIndex((h) => normalizeTextServer(h) === "results" || normalizeTextServer(h) === "purchases" || normalizeTextServer(h).includes("compras"));
      const cpaColIndex = header.findIndex((h) => normalizeTextServer(h).includes("cost per results") || normalizeTextServer(h).includes("cost per purchase") || normalizeTextServer(h).includes("cpa"));
      const impressionsColIndex = header.findIndex((h) => normalizeTextServer(h).includes("impressions") || normalizeTextServer(h).includes("impresiones"));
      const clicksColIndex = header.findIndex((h) => normalizeTextServer(h).includes("clicks") || normalizeTextServer(h).includes("clics"));
      let rate = 1;
      if (detectedCurrency !== "USD") {
        const matchCountry = paisesList.find((p) => p.moneda?.toUpperCase() === detectedCurrency);
        if (matchCountry && matchCountry.tasa_de_cambio) {
          rate = Number(matchCountry.tasa_de_cambio) || 1;
        } else if (detectedCurrency === "COP") rate = 4e3;
        else if (detectedCurrency === "MXN") rate = 18.5;
        else if (detectedCurrency === "BOB") rate = 6.9;
        else if (detectedCurrency === "PEN") rate = 3.7;
        else if (detectedCurrency === "VES") rate = 36;
      }
      const dbPayload2 = [];
      let ignoredCount2 = 0;
      let matchedCount = 0;
      const countryMismatchList = [];
      const unrecognizedProductList = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        const rawAdId = r[adIdColIndex]?.trim();
        if (!rawAdId) continue;
        const rawAdName = adNameColIndex !== -1 ? r[adNameColIndex] || "" : "Anuncio";
        const paisId = detectCountryIdServer(rawAdName, paisesList);
        if (!paisId) {
          ignoredCount2++;
          continue;
        }
        const matchCountryObj = paisesList.find((p) => p.id === paisId);
        const countryName = matchCountryObj ? matchCountryObj.nombre : "Pa\xEDs Desconocido";
        const nameParts = rawAdName.split("|").map((p) => p.trim());
        let detectedProductText = "";
        if (nameParts.length >= 4) {
          detectedProductText = nameParts.slice(3).join("|").trim();
        } else if (nameParts.length === 3) {
          detectedProductText = nameParts[2].trim();
        } else {
          detectedProductText = rawAdName;
        }
        const normProductText = normalizeAlphaNum(detectedProductText);
        const matchedProduct = normProductText ? productosList.find((p) => {
          const normPName = p.nombre_normalizado ? p.nombre_normalizado : normalizeAlphaNum(p.nombre);
          return normPName === normProductText;
        }) : null;
        if (matchedProduct) {
          const isCountryRegistered = productosPaisesList.some(
            (pp) => pp.producto_id === matchedProduct.id && pp.pais_id === paisId
          );
          if (isCountryRegistered) {
            matchedCount++;
          } else {
            countryMismatchList.push({
              adId: String(rawAdId).trim(),
              adName: String(rawAdName).trim(),
              detectedProduct: matchedProduct.nombre,
              detectedCountry: countryName
            });
          }
        } else {
          unrecognizedProductList.push({
            adId: String(rawAdId).trim(),
            adName: String(rawAdName).trim(),
            detectedProductText: detectedProductText || rawAdName,
            detectedCountry: countryName
          });
        }
        const rawSpend = parseFloat((r[spendColIndex] || "0").replace(/[^0-9.]/g, "")) || 0;
        const gastoUsd = rate > 0 ? rawSpend / rate : rawSpend;
        const rawDate = dateColIndex !== -1 ? r[dateColIndex] : (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const rawResults = resultsColIndex !== -1 ? parseInt(r[resultsColIndex] || "0", 10) : 0;
        const rawCpa = cpaColIndex !== -1 ? parseFloat((r[cpaColIndex] || "0").replace(/[^0-9.]/g, "")) : 0;
        const rawImpressions = impressionsColIndex !== -1 ? parseInt(r[impressionsColIndex] || "0", 10) : 0;
        const rawClicks = clicksColIndex !== -1 ? parseInt(r[clicksColIndex] || "0", 10) : 0;
        dbPayload2.push({
          codigo_campana: String(rawAdId).trim(),
          nombre: String(rawAdName).trim(),
          pais_id: paisId,
          gasto: Math.round(gastoUsd * 100) / 100,
          impresiones: rawImpressions,
          clics: rawClicks,
          cpa: Math.round(rawCpa * 100) / 100,
          roas: 0,
          conversiones: rawResults,
          estado: "active",
          fecha: rawDate
        });
      }
      if (dbPayload2.length === 0) {
        if (ignoredCount2 > 0) {
          return res.status(400).json({ error: `Se ignoraron ${ignoredCount2} filas sin pa\xEDs identificable en el nombre del anuncio.` });
        }
        return res.status(400).json({ error: 'No se encontraron filas con "Ad ID" v\xE1lido en el archivo.' });
      }
      const { data: data2, error: error2 } = await supabaseAdmin.from("campanas_meta").upsert(dbPayload2, { onConflict: "codigo_campana,fecha" }).select("id, codigo_campana, pais_id");
      if (error2) throw error2;
      return res.json({
        success: true,
        insertedCount: dbPayload2.length,
        ignoredCount: ignoredCount2,
        matchedCount,
        countryMismatchCount: countryMismatchList.length,
        countryMismatchList,
        unrecognizedProductCount: unrecognizedProductList.length,
        unrecognizedProductList,
        data: data2
      });
    }
    if (!Array.isArray(ads) || ads.length === 0) {
      return res.status(400).json({ error: "No se recibieron filas v\xE1lidas para importar." });
    }
    const dbPayload = ads.map((a) => ({
      codigo_campana: String(a.codigoCampana).trim(),
      nombre: String(a.nombre || "Anuncio Sin Nombre").trim(),
      pais_id: a.paisId || null,
      gasto: Number(a.gasto) || 0,
      impresiones: Number(a.impresiones) || 0,
      clics: Number(a.clics) || 0,
      cpa: Number(a.cpa) || 0,
      roas: Number(a.roas) || 0,
      conversiones: Number(a.conversiones) || 0,
      estado: a.estado || "active",
      fecha: a.fecha || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    }));
    const { data, error } = await supabaseServer.from("campanas_meta").upsert(dbPayload, { onConflict: "codigo_campana,fecha" }).select("id, codigo_campana, pais_id");
    if (error) throw error;
    const ignoredCount = dbPayload.filter((p) => !p.pais_id).length;
    return res.json({
      success: true,
      insertedCount: dbPayload.length,
      ignoredCount,
      data
    });
  } catch (error) {
    console.error("Error batch uploading Meta Ads CSV:", error);
    return res.status(500).json({ error: error.message || "Error importando reporte Meta Ads." });
  }
});
app.patch("/api/meta-ads/assign-country", async (req, res) => {
  try {
    const { codigoCampana, paisId } = req.body;
    if (!codigoCampana || !paisId) {
      return res.status(400).json({ error: "codigoCampana y paisId son obligatorios" });
    }
    const { error } = await supabaseServer.from("campanas_meta").update({ pais_id: paisId, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("codigo_campana", codigoCampana);
    if (error) throw error;
    return res.json({ success: true, codigoCampana, paisId });
  } catch (error) {
    console.error("Error assigning country to Meta Ad:", error);
    return res.status(500).json({ error: error.message });
  }
});
app.delete("/api/meta-ads/all", async (req, res) => {
  try {
    const { error } = await supabaseServer.from("campanas_meta").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw error;
    return res.json({ success: true });
  } catch (error) {
    console.error("Error clearing Meta Ads:", error);
    return res.status(500).json({ error: error.message });
  }
});
app.post("/api/products", async (req, res) => {
  try {
    const { id, nombre, precioBase, categoria } = req.body;
    if (!nombre || precioBase === void 0) {
      return res.status(400).json({ error: "Nombre y precioBase son requeridos" });
    }
    if (id) {
      const { data, error } = await supabaseServer.from("productos").update({
        nombre,
        precio_base: precioBase,
        categoria: categoria || "Infoproductos",
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", id).select("*").single();
      if (error) throw error;
      return res.json(data);
    } else {
      const { data, error } = await supabaseServer.from("productos").insert({
        nombre,
        precio_base: precioBase,
        categoria: categoria || "Infoproductos"
      }).select("*").single();
      if (error) throw error;
      return res.json(data);
    }
  } catch (error) {
    console.error("Error saving product:", error);
    return res.status(500).json({ error: error.message });
  }
});
app.post("/api/countries", async (req, res) => {
  try {
    const { name, currency, rate } = req.body;
    if (!name || !currency || rate === void 0) {
      return res.status(400).json({ error: "Datos de pa\xEDs incompletos" });
    }
    const { data, error } = await supabaseServer.from("paises").update({
      moneda: currency,
      tasa_de_cambio: rate,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("nombre", name).select("*").single();
    if (error) throw error;
    return res.json(data);
  } catch (error) {
    console.error("Error updating country:", error);
    return res.status(500).json({ error: error.message });
  }
});
app.post("/api/gemini/analyze", async (req, res) => {
  const { campaigns, salesSummary, countryFilter } = req.body;
  if (!campaigns || !salesSummary) {
    return res.status(400).json({ error: "Missing campaigns or salesSummary data" });
  }
  const getMockRecommendations = () => {
    return [
      {
        campaignId: "CAMP-001",
        campaignName: "Ads Carpinter\xEDa Colombia - Conversiones",
        roas: 3.4,
        cpa: 3.75,
        action: "Escalar",
        reason: "El ROAS de 3.4 supera el umbral de escala rentable (3.0). El CPA de $3.75 es extremadamente competitivo para el mercado colombiano.",
        budgetRecommendation: "Incrementar el presupuesto diario en un 20% cada 3 d\xEDas, monitoreando que el CPA se mantenga por debajo de los $4.50."
      },
      {
        campaignId: "CAMP-002",
        campaignName: "Ads Planos Bolivia - Mensajes",
        roas: 2.6,
        cpa: 2.29,
        action: "Mantener",
        reason: "Rendimiento s\xF3lido con ROAS de 2.6 en el rango intermedio (2.0 - 3.0). Gran volumen de leads desde el bot de WhatsApp.",
        budgetRecommendation: "Mantener el presupuesto estable. Realizar pruebas A/B de creativos para intentar bajar el CPA a $2.00."
      },
      {
        campaignId: "CAMP-003",
        campaignName: "Ads Cama Multifuncional Per\xFA",
        roas: 1.4,
        cpa: 4.78,
        action: "Optimizar",
        reason: "ROAS bajo de 1.4. El CPA de $4.78 est\xE1 presionando los m\xE1rgenes del producto de $20 en Per\xFA.",
        budgetRecommendation: "Detener creativos de menor rendimiento. Revisar el flujo del bot de WhatsApp para mejorar la tasa de conversi\xF3n contacto-a-venta."
      },
      {
        campaignId: "CAMP-004",
        campaignName: "Ads Combo Muebles Venezuela",
        roas: 4.2,
        cpa: 1.92,
        action: "Escalar",
        reason: "Excelente rendimiento con ROAS de 4.2. El combo de planos a $35 est\xE1 convirtiendo sumamente bien debido a la oferta empaquetada.",
        budgetRecommendation: "Duplicar el presupuesto de esta campa\xF1a de forma inmediata. Es la de mayor retorno por d\xF3lar invertido."
      },
      {
        campaignId: "CAMP-005",
        campaignName: "Ads Retargeting LATAM - Todos",
        roas: 4.8,
        cpa: 1.32,
        action: "Escalar",
        reason: "La campa\xF1a de retargeting tiene el ROAS m\xE1s alto (4.8). Aprovecha la audiencia tibia que interactu\xF3 previamente con los bots.",
        budgetRecommendation: "Aumentar presupuesto un 30% para absorber todo el tr\xE1fico tibio acumulado de los pa\xEDses activos."
      },
      {
        campaignId: "CAMP-006",
        campaignName: "Ads Banco Carpintero - Colombia Antiguo",
        roas: 0.8,
        cpa: 7,
        action: "Pausar",
        reason: "ROAS cr\xEDtico de 0.8 y un CPA insostenible de $7.00. El producto tiene baja demanda o la audiencia se satur\xF3.",
        budgetRecommendation: "Mantener pausada. Redise\xF1ar por completo la oferta o cambiar los planos promocionados por el banco cl\xE1sico."
      }
    ];
  };
  if (!aiClient) {
    return res.json({
      recommendations: getMockRecommendations(),
      isSimulated: true,
      message: "Utilizando recomendaci\xF3n local optimizada. Configura tu GEMINI_API_KEY para an\xE1lisis en tiempo real."
    });
  }
  try {
    const prompt = `
      Eres un consultor experto en Growth Marketing, Meta Ads y WhatsApp Automation para infoproductos en Latinoam\xE9rica.
      Analiza el rendimiento de las siguientes campa\xF1as de anuncios de Meta y la facturaci\xF3n correspondiente en WhatsApp.
      Pa\xEDs seleccionado en el filtro actual: ${countryFilter || "Todos"}.

      Datos de Campa\xF1as de Meta Ads:
      ${JSON.stringify(campaigns, null, 2)}

      Resumen de Ventas v\xEDa Bots de WhatsApp:
      ${JSON.stringify(salesSummary, null, 2)}

      Reglas de Sem\xE1foro de Decisiones ROAS:
      - ROAS > 3.0: "Escalar" (Sugerir aumento de presupuesto controlado).
      - ROAS 2.0 a 3.0: "Mantener" (Recomendar estabilizaci\xF3n y pruebas de creativos).
      - ROAS 1.0 a 2.0: "Optimizar" (Recomendar revisi\xF3n de copies, segmentaci\xF3n o flujo del bot de WhatsApp).
      - ROAS < 1.0: "Pausar" (Apagar temporalmente la campa\xF1a por CPA alto e insostenible).

      Genera una lista de recomendaciones de optimizaci\xF3n t\xE9cnica para cada campa\xF1a utilizando el formato estructurado requerido.
      Evita generalidades. S\xE9 directo, t\xE9cnico y ofrece acciones concretas en espa\xF1ol.
    `;
    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Eres un analista de datos de marketing con foco en optimizaci\xF3n de presupuestos de anuncios (Meta Ads) y automatizaci\xF3n de embudos de WhatsApp.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["recommendations"],
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["campaignId", "campaignName", "roas", "cpa", "action", "reason", "budgetRecommendation"],
                properties: {
                  campaignId: { type: Type.STRING },
                  campaignName: { type: Type.STRING },
                  roas: { type: Type.NUMBER },
                  cpa: { type: Type.NUMBER },
                  action: { type: Type.STRING, description: "Debe ser uno de: Escalar, Mantener, Optimizar, Pausar" },
                  reason: { type: Type.STRING, description: "Explicaci\xF3n detallada del por qu\xE9 de la acci\xF3n bas\xE1ndose en ROAS y CPA" },
                  budgetRecommendation: { type: Type.STRING, description: "Acci\xF3n presupuestaria concreta recomendada" }
                }
              }
            }
          }
        }
      }
    });
    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from Gemini");
    }
    const parsed = JSON.parse(resultText);
    return res.json({
      recommendations: parsed.recommendations,
      isSimulated: false
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.json({
      recommendations: getMockRecommendations(),
      isSimulated: true,
      error: error.message || "Error consultando a la API de Gemini"
    });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT} and http://127.0.0.1:${PORT}`);
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      const altPort = PORT + 1;
      console.log(`Port ${PORT} in use, trying ${altPort}...`);
      app.listen(altPort, "0.0.0.0", () => {
        console.log(`Server running at http://localhost:${altPort} and http://127.0.0.1:${altPort}`);
      });
    } else {
      console.error("Server error:", err);
    }
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = app;
export {
  server_default as default
};
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
