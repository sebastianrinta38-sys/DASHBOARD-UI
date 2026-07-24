/**
 * API Service layer to interact with Supabase backend
 */

export interface RawDashboardData {
  paises: Array<{ id: string; nombre: string; moneda: string; tasa_de_cambio: number }>;
  productos: Array<{ id: string; nombre: string; precio_base: number; categoria: string }>;
  bots: Array<{ id: string; nombre: string; numero: string; pais_id: string; paises?: { nombre: string } }>;
  campanas: Array<{
    id: string;
    codigo_campana: string;
    nombre: string;
    pais_id: string;
    gasto: number;
    impresiones: number;
    clics: number;
    cpa: number;
    roas: number;
    conversiones: number;
    estado: 'active' | 'paused';
    fecha: string;
    paises?: { nombre: string };
  }>;
  ventas: Array<{
    id: string;
    codigo_venta: string;
    cliente_nombre: string;
    cliente_telefono: string;
    producto_id: string;
    pais_id: string;
    bot_id: string;
    monto_local: number;
    monto_usd: number;
    moneda: string;
    fecha: string;
    estado: string;
    tipo_venta?: string;
    dia_semana?: string;
    hora?: string;
    banco?: string;
    id_anuncio?: string;
    link_media?: string;
    link_source?: string;
    paises?: { nombre: string };
    productos?: { nombre: string };
    bots_whatsapp?: { nombre: string };
  }>;
  resumenPorAnuncio?: Array<{
    id_anuncio: string;
    pais: string;
    bot: string;
    numero_ventas: number;
    facturacion: number;
    ticket_promedio: number;
  }>;
}

export async function fetchDashboardData(): Promise<RawDashboardData> {
  const res = await fetch('/api/dashboard/all');
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error fetching dashboard: ${errorText}`);
  }
  return res.json();
}

export async function createSaleApi(saleData: {
  clienteNombre: string;
  clienteTelefono: string;
  productoId: string;
  paisId: string;
  botId?: string | null;
  montoLocal: number;
  montoUsd: number;
  moneda: string;
  fecha?: string;
  tipoVenta?: string;
  diaSemana?: string;
  hora?: string;
  banco?: string;
  idAnuncio?: string;
  linkMedia?: string;
  linkSource?: string;
}) {
  const res = await fetch('/api/sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(saleData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create sale');
  }
  return res.json();
}

export async function updateSaleApi(id: string, saleData: Partial<{
  clienteNombre: string;
  clienteTelefono: string;
  productoId: string;
  paisId: string;
  botId?: string | null;
  montoLocal: number;
  montoUsd: number;
  moneda: string;
  fecha?: string;
  tipoVenta?: string;
  diaSemana?: string;
  hora?: string;
  banco?: string;
  idAnuncio?: string;
  linkMedia?: string;
  linkSource?: string;
}>) {
  const res = await fetch(`/api/sales/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(saleData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update sale');
  }
  return res.json();
}

export async function deleteSaleApi(id: string) {
  const res = await fetch(`/api/sales/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete sale');
  }
  return res.json();
}

export async function toggleCampaignStatusApi(id: string, newStatus: 'active' | 'paused') {
  const res = await fetch(`/api/campaigns/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to toggle campaign status');
  }
  return res.json();
}

export async function bulkCampaignStatusApi(ids: string[], newStatus: 'active' | 'paused') {
  const res = await fetch('/api/campaigns/bulk-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, status: newStatus }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update campaigns');
  }
  return res.json();
}

export async function bulkDeleteCampaignsApi(ids: string[]) {
  const res = await fetch('/api/campaigns/bulk-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete campaigns');
  }
  return res.json();
}

export interface CatalogProduct {
  id: string;
  nombre: string;
  nombre_normalizado?: string;
  precioBase: number;
  categoria?: string;
  pais_ids: string[];
}

export interface MetaAdsUploadResult {
  success: boolean;
  insertedCount: number;
  ignoredCount: number;
  matchedCount?: number;
  countryMismatchCount?: number;
  countryMismatchList?: Array<{ adId: string; adName: string; detectedProduct: string; detectedCountry: string }>;
  unrecognizedProductCount?: number;
  unrecognizedProductList?: Array<{ adId: string; adName: string; detectedProductText: string; detectedCountry: string }>;
}

export async function fetchCatalogProductsApi(): Promise<CatalogProduct[]> {
  const res = await fetch('/api/catalog/products');
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch catalog products');
  }
  const data = await res.json();
  return data.products || [];
}

export async function createCatalogProductApi(productData: {
  nombre: string;
  precioBase: number;
  pais_ids: string[];
  categoria?: string;
}): Promise<CatalogProduct> {
  const res = await fetch('/api/catalog/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create product');
  }
  const data = await res.json();
  return data.product;
}

export async function updateCatalogProductApi(id: string, productData: {
  nombre?: string;
  precioBase?: number;
  pais_ids?: string[];
  categoria?: string;
}): Promise<CatalogProduct> {
  const res = await fetch(`/api/catalog/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update product');
  }
  const data = await res.json();
  return data.product;
}

export async function deleteCatalogProductApi(id: string) {
  const res = await fetch(`/api/catalog/products/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete product');
  }
  return res.json();
}

export async function saveProductApi(product: { id?: string; nombre: string; precioBase: number; categoria?: string }) {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save product');
  }
  return res.json();
}

export async function updateCountryRateApi(country: { name: string; currency: string; rate: number }) {
  const res = await fetch('/api/countries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(country),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update country rate');
  }
  return res.json();
}

export async function uploadMetaAdsCSVApi(payload: string | Array<{
  codigoCampana: string;
  nombre: string;
  paisId?: string | null;
  gasto: number;
  impresiones?: number;
  clics?: number;
  cpa?: number;
  roas?: number;
  conversiones?: number;
  fecha?: string;
}>): Promise<MetaAdsUploadResult> {
  const body = typeof payload === 'string' ? { csvText: payload } : { ads: payload };
  const res = await fetch('/api/meta-ads/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to upload Meta Ads CSV');
  }
  return res.json();
}

export async function assignAdCountryApi(codigoCampana: string, paisId: string) {
  const res = await fetch('/api/meta-ads/assign-country', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigoCampana, paisId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to assign country to ad');
  }
  return res.json();
}

export async function clearMetaAdsApi() {
  const res = await fetch('/api/meta-ads/all', {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to clear Meta Ads');
  }
  return res.json();
}

