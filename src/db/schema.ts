import { pgTable, uuid, text, numeric, integer, date, timestamp, pgView, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';

// 1. Paises
export const paises = pgTable('paises', {
  id: uuid('id').defaultRandom().primaryKey(),
  nombre: text('nombre').unique().notNull(),
  moneda: text('moneda').notNull(),
  tasaDeCambio: numeric('tasa_de_cambio', { precision: 12, scale: 4 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Productos
export const productos = pgTable('productos', {
  id: uuid('id').defaultRandom().primaryKey(),
  nombre: text('nombre').notNull(),
  nombreNormalizado: text('nombre_normalizado'),
  precioBase: numeric('precio_base', { precision: 10, scale: 2 }).default('0.00').notNull(),
  categoria: text('categoria').default('Infoproductos').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2b. Productos Países (Relación M:N)
export const productosPaises = pgTable('productos_paises', {
  id: uuid('id').defaultRandom().primaryKey(),
  productoId: uuid('producto_id').references(() => productos.id, { onDelete: 'cascade' }),
  paisId: uuid('pais_id').references(() => paises.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Bots WhatsApp
export const botsWhatsapp = pgTable('bots_whatsapp', {
  id: uuid('id').defaultRandom().primaryKey(),
  nombre: text('nombre').notNull(),
  numero: text('numero').default('').notNull(),
  paisId: uuid('pais_id').references(() => paises.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 4. Campañas Meta
export const campanasMeta = pgTable('campanas_meta', {
  id: uuid('id').defaultRandom().primaryKey(),
  codigoCampana: text('codigo_campana'),
  nombre: text('nombre').notNull(),
  paisId: uuid('pais_id').references(() => paises.id, { onDelete: 'set null' }),
  gasto: numeric('gasto', { precision: 10, scale: 2 }).default('0.00').notNull(),
  impresiones: integer('impresiones').default(0).notNull(),
  clics: integer('clics').default(0).notNull(),
  cpa: numeric('cpa', { precision: 10, scale: 2 }).default('0.00').notNull(),
  roas: numeric('roas', { precision: 10, scale: 2 }).default('0.00').notNull(),
  conversiones: integer('conversiones').default(0).notNull(),
  estado: text('estado').default('active').notNull(),
  fecha: date('fecha').defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  codigoFechaUnique: unique('campanas_meta_codigo_fecha_unique').on(t.codigoCampana, t.fecha),
}));

// 5. Ventas
export const ventas = pgTable('ventas', {
  id: uuid('id').defaultRandom().primaryKey(),
  codigoVenta: text('codigo_venta').unique(),
  clienteNombre: text('cliente_nombre').notNull(),
  clienteTelefono: text('cliente_telefono').notNull(),
  productoId: uuid('producto_id').references(() => productos.id, { onDelete: 'restrict' }),
  paisId: uuid('pais_id').references(() => paises.id, { onDelete: 'restrict' }),
  botId: uuid('bot_id').references(() => botsWhatsapp.id, { onDelete: 'set null' }),
  montoLocal: numeric('monto_local', { precision: 12, scale: 2 }).notNull(),
  montoUsd: numeric('monto_usd', { precision: 10, scale: 2 }).notNull(),
  moneda: text('moneda').notNull(),
  fecha: date('fecha').defaultNow().notNull(),
  estado: text('estado').default('completada').notNull(),
  tipoVenta: text('tipo_venta').default('contribucion_inicial'),
  diaSemana: text('dia_semana'),
  hora: text('hora'),
  banco: text('banco'),
  idAnuncio: text('id_anuncio'),
  linkMedia: text('link_media'),
  linkSource: text('link_source'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 6. Vista Resumen por Anuncio
export const resumenPorAnuncio = pgView('resumen_por_anuncio', {
  idAnuncio: text('id_anuncio'),
  pais: text('pais'),
  bot: text('bot'),
  numeroVentas: integer('numero_ventas'),
  facturacion: numeric('facturacion', { precision: 12, scale: 2 }),
  ticketPromedio: numeric('ticket_promedio', { precision: 12, scale: 2 }),
}).existing();

// Relations
export const paisesRelations = relations(paises, ({ many }) => ({
  bots: many(botsWhatsapp),
  campanas: many(campanasMeta),
  ventas: many(ventas),
}));

export const productosRelations = relations(productos, ({ many }) => ({
  ventas: many(ventas),
}));

export const botsRelations = relations(botsWhatsapp, ({ one, many }) => ({
  pais: one(paises, { fields: [botsWhatsapp.paisId], references: [paises.id] }),
  ventas: many(ventas),
}));

export const campanasRelations = relations(campanasMeta, ({ one }) => ({
  pais: one(paises, { fields: [campanasMeta.paisId], references: [paises.id] }),
}));

export const ventasRelations = relations(ventas, ({ one }) => ({
  producto: one(productos, { fields: [ventas.productoId], references: [productos.id] }),
  pais: one(paises, { fields: [ventas.paisId], references: [paises.id] }),
  bot: one(botsWhatsapp, { fields: [ventas.botId], references: [botsWhatsapp.id] }),
}));

// Zod Validation Schemas
export const insertVentaSchema = z.object({
  clienteNombre: z.string().min(1, 'El nombre del cliente es requerido'),
  clienteTelefono: z.string().min(1, 'El teléfono es requerido'),
  productoId: z.string().uuid(),
  paisId: z.string().uuid(),
  botId: z.string().uuid().optional().nullable(),
  montoLocal: z.number().positive(),
  montoUsd: z.number().positive(),
  moneda: z.string().min(1),
  fecha: z.string().optional(),
  estado: z.enum(['completada', 'pendiente', 'cancelada']).default('completada'),
  tipoVenta: z.string().optional().nullable(),
  diaSemana: z.string().optional().nullable(),
  hora: z.string().optional().nullable(),
  banco: z.string().optional().nullable(),
  idAnuncio: z.string().optional().nullable(),
  linkMedia: z.string().optional().nullable(),
  linkSource: z.string().optional().nullable(),
});

export const updateVentaSchema = insertVentaSchema.partial();

