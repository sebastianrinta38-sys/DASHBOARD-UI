import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDashboardData,
  createSaleApi,
  updateSaleApi,
  deleteSaleApi,
  toggleCampaignStatusApi,
  bulkCampaignStatusApi,
  bulkDeleteCampaignsApi,
  saveProductApi,
  updateCountryRateApi,
} from '../lib/api';
import { Sale, AdCampaign, Product } from '../types';

export function useDashboardData() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
    staleTime: 1000 * 60 * 2, // 2 minutos (Make actualiza Supabase cada 15 min)
    refetchOnWindowFocus: true, // Auto-refresco al volver a la pestaña
    refetchInterval: 1000 * 60 * 3, // 3 minutos respaldo en background
  });

  // Map paises by ID for instant 100% reliable fallback lookup
  const countryMapById: Record<string, string> = {};
  (query.data?.paises || []).forEach(p => {
    countryMapById[p.id] = p.nombre;
  });

  // Mappings
  const sales: Sale[] = (query.data?.ventas || []).map(v => ({
    id: v.id,
    code: v.codigo_venta,
    date: v.fecha,
    customerName: v.cliente_nombre,
    phone: v.cliente_telefono,
    country: v.paises?.nombre || countryMapById[v.pais_id] || 'Colombia',
    product: v.productos?.nombre || 'Producto Desconocido',
    bot: v.bots_whatsapp?.nombre || 'Bot Soporte Ventas',
    amountLocal: Number(v.monto_local),
    currency: v.moneda,
    amountUsd: Number(v.monto_usd),
    paisId: v.pais_id,
    productoId: v.producto_id,
    botId: v.bot_id,
    tipoVenta: v.tipo_venta,
    diaSemana: v.dia_semana,
    hora: v.hora,
    banco: v.banco,
    idAnuncio: v.id_anuncio,
    linkMedia: v.link_media,
    linkSource: v.link_source,
  }));

  const campaigns: AdCampaign[] = (query.data?.campanas || []).map(c => ({
    id: c.id,
    codigoCampana: c.codigo_campana,
    campaignName: c.nombre,
    country: c.paises?.nombre || 'Todos',
    spend: Number(c.gasto),
    impressions: c.impresiones,
    clicks: c.clics,
    cpa: Number(c.cpa),
    roas: Number(c.roas),
    conversions: c.conversiones,
    status: c.estado,
    paisId: c.pais_id,
  }));

  const products: Product[] = (query.data?.productos || []).map(p => ({
    id: p.id,
    name: p.nombre,
    usdPrice: Number(p.precio_base),
    category: p.categoria,
  }));

  const countriesConfig: Record<string, { currency: string; rate: number; id?: string }> = {};
  (query.data?.paises || []).forEach(p => {
    countriesConfig[p.nombre] = {
      id: p.id,
      currency: p.moneda,
      rate: Number(p.tasa_de_cambio),
    };
  });

  const rawPaises = query.data?.paises || [];
  const rawProductos = query.data?.productos || [];
  const rawBots = query.data?.bots || [];
  const resumenPorAnuncio = (query.data?.resumenPorAnuncio || []).map(r => ({
    idAnuncio: r.id_anuncio,
    pais: r.pais,
    bot: r.bot,
    numeroVentas: Number(r.numero_ventas),
    facturacion: Number(r.facturacion),
    ticketPromedio: Number(r.ticket_promedio),
  }));

  // Mutations
  const createSaleMutation = useMutation({
    mutationFn: createSaleApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboardData'] }),
  });

  const updateSaleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateSaleApi>[1] }) =>
      updateSaleApi(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboardData'] }),
  });

  const deleteSaleMutation = useMutation({
    mutationFn: deleteSaleApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboardData'] }),
  });

  const toggleCampaignMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'paused' }) =>
      toggleCampaignStatusApi(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboardData'] }),
  });

  const bulkCampaignStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: 'active' | 'paused' }) =>
      bulkCampaignStatusApi(ids, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboardData'] }),
  });

  const bulkDeleteCampaignsMutation = useMutation({
    mutationFn: bulkDeleteCampaignsApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboardData'] }),
  });

  const saveProductMutation = useMutation({
    mutationFn: saveProductApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboardData'] }),
  });

  const updateCountryRateMutation = useMutation({
    mutationFn: updateCountryRateApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboardData'] }),
  });

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    sales,
    campaigns,
    products,
    countriesConfig,
    rawPaises,
    rawProductos,
    rawBots,
    resumenPorAnuncio,
    createSale: createSaleMutation.mutateAsync,
    updateSale: updateSaleMutation.mutateAsync,
    deleteSale: deleteSaleMutation.mutateAsync,
    toggleCampaign: toggleCampaignMutation.mutateAsync,
    bulkCampaignStatus: bulkCampaignStatusMutation.mutateAsync,
    bulkDeleteCampaigns: bulkDeleteCampaignsMutation.mutateAsync,
    saveProduct: saveProductMutation.mutateAsync,
    updateCountryRate: updateCountryRateMutation.mutateAsync,
  };
}
