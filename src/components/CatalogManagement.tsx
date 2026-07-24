import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Globe, 
  Plus, 
  Trash2, 
  Edit3,
  Check,
  X,
  PlusCircle, 
  AlertTriangle,
  CheckSquare,
  Square,
  Tag,
  Save,
  RefreshCw
} from 'lucide-react';
import { Product } from '../types';
import { 
  fetchCatalogProductsApi, 
  createCatalogProductApi, 
  updateCatalogProductApi, 
  deleteCatalogProductApi,
  CatalogProduct 
} from '../lib/api';

interface CatalogManagementProps {
  products: Product[];
  onSaveProduct?: (prod: { id?: string; nombre: string; precioBase: number; categoria?: string }) => Promise<any>;
  countriesConfig: Record<string, { currency: string; rate: number; id?: string }>;
  onUpdateCountryRate?: (country: { name: string; currency: string; rate: number }) => Promise<any>;
  onShowToast: (message: string, type?: 'success' | 'warning' | 'info') => void;
  onRefreshData?: () => void;
}

export default function CatalogManagement({
  products: initialProducts,
  countriesConfig,
  onUpdateCountryRate,
  onShowToast,
  onRefreshData
}: CatalogManagementProps) {
  // Catalog products from Supabase API
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  // New Product Form State
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState<number | ''>(0);
  const [selectedPaisIds, setSelectedPaisIds] = useState<string[]>([]);
  const [productError, setProductError] = useState('');
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Edit Product State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductPrice, setEditProductPrice] = useState<number | ''>(0);
  const [editSelectedPaisIds, setEditSelectedPaisIds] = useState<string[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Country rate form state
  const [newCountryName, setNewCountryName] = useState('');
  const [newCountryCurrency, setNewCountryCurrency] = useState('');
  const [newCountryRate, setNewCountryRate] = useState<number | ''>('');
  const [countryError, setCountryError] = useState('');

  // Extract available countries list with IDs from countriesConfig
  const availableCountries = Object.entries(countriesConfig).map(([name, info]) => ({
    name,
    currency: info.currency,
    rate: info.rate,
    id: info.id || '',
  })).filter(c => Boolean(c.id));

  // Load catalog products from server
  const loadCatalog = async () => {
    setIsLoadingCatalog(true);
    try {
      const data = await fetchCatalogProductsApi();
      setCatalogProducts(data);
    } catch (err: any) {
      console.error('Error loading catalog products:', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Toggle country checkbox for new product
  const toggleCountryForNewProduct = (paisId: string) => {
    setSelectedPaisIds(prev => 
      prev.includes(paisId) ? prev.filter(id => id !== paisId) : [...prev, paisId]
    );
  };

  // Toggle country checkbox for editing product
  const toggleCountryForEditProduct = (paisId: string) => {
    setEditSelectedPaisIds(prev => 
      prev.includes(paisId) ? prev.filter(id => id !== paisId) : [...prev, paisId]
    );
  };

  // Select/Deselect All Countries for New Product
  const toggleSelectAllNewCountries = () => {
    if (selectedPaisIds.length === availableCountries.length) {
      setSelectedPaisIds([]);
    } else {
      setSelectedPaisIds(availableCountries.map(c => c.id));
    }
  };

  // Add Product Handler
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductError('');

    if (!newProductName.trim()) {
      setProductError('El nombre del producto es obligatorio.');
      return;
    }

    setIsSubmittingProduct(true);

    try {
      const created = await createCatalogProductApi({
        nombre: newProductName.trim(),
        precioBase: Number(newProductPrice) || 0,
        pais_ids: selectedPaisIds,
      });

      onShowToast(`Producto "${created.nombre}" creado exitosamente en el catálogo.`, 'success');
      setNewProductName('');
      setNewProductPrice(0);
      setSelectedPaisIds([]);
      await loadCatalog();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setProductError(err.message || 'Error guardando el producto en Supabase');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Start Editing Product
  const handleStartEdit = (prod: CatalogProduct) => {
    setEditingProductId(prod.id);
    setEditProductName(prod.nombre);
    setEditProductPrice(prod.precioBase);
    setEditSelectedPaisIds(prod.pais_ids || []);
  };

  // Cancel Editing
  const handleCancelEdit = () => {
    setEditingProductId(null);
  };

  // Save Edited Product
  const handleSaveEdit = async (productId: string) => {
    if (!editProductName.trim()) {
      onShowToast('El nombre del producto no puede estar vacío.', 'warning');
      return;
    }

    setIsSavingEdit(true);

    try {
      await updateCatalogProductApi(productId, {
        nombre: editProductName.trim(),
        precioBase: Number(editProductPrice) || 0,
        pais_ids: editSelectedPaisIds,
      });

      onShowToast('Producto actualizado correctamente.', 'success');
      setEditingProductId(null);
      await loadCatalog();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      onShowToast(err.message || 'Error al actualizar el producto.', 'warning');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar "${productName}" del catálogo?`)) {
      return;
    }

    try {
      await deleteCatalogProductApi(productId);
      onShowToast(`Producto "${productName}" eliminado del catálogo.`, 'info');
      await loadCatalog();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      onShowToast(err.message || 'Error al eliminar producto', 'warning');
    }
  };

  // Add/Update Country Rate Handler
  const handleAddCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    setCountryError('');

    if (!newCountryName.trim()) {
      setCountryError('El nombre del país es obligatorio.');
      return;
    }

    if (!newCountryCurrency.trim() || newCountryCurrency.trim().length !== 3) {
      setCountryError('La divisa debe tener exactamente 3 caracteres (ej: COP, USD, MXN).');
      return;
    }

    if (newCountryRate === '' || newCountryRate <= 0) {
      setCountryError('La tasa de cambio debe ser un número positivo.');
      return;
    }

    const formattedCountryName = newCountryName.trim();
    const formattedCurrency = newCountryCurrency.trim().toUpperCase();

    try {
      if (onUpdateCountryRate) {
        await onUpdateCountryRate({
          name: formattedCountryName,
          currency: formattedCurrency,
          rate: Number(newCountryRate)
        });
      }
      onShowToast(`País "${formattedCountryName}" (${formattedCurrency}) actualizado en Supabase.`, 'success');
      setNewCountryName('');
      setNewCountryCurrency('');
      setNewCountryRate('');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setCountryError(err.message || 'Error actualizando el país');
    }
  };

  return (
    <div id="catalog-management-section" className="space-y-6">
      
      {/* Information Header */}
      <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 shadow-lg flex items-start gap-4">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white shadow-md">
          <ShoppingBag className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-bold text-white">
              Catálogo de Productos y Asignación por País
            </h2>
            <button 
              onClick={loadCatalog}
              disabled={isLoadingCatalog}
              className="px-3 py-1 bg-[#151926] hover:bg-[#1f2335] text-gray-300 rounded-lg text-xs font-mono flex items-center gap-1.5 border border-[#252b42] transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCatalog ? 'animate-spin text-[#3b82f6]' : ''}`} />
              <span>Sincronizar</span>
            </button>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-1 max-w-3xl leading-relaxed">
            Administra tus productos comercializados y define en qué países está disponible cada uno. Esta lista se utiliza para validar automáticamente los nombres detectados en los reportes de Meta Ads (<code className="text-amber-400 bg-black/40 px-1 py-0.5 rounded">AD|ETAPA|PAÍS|PRODUCTO</code>).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Add New Product Form (5 cols) */}
        <div className="lg:col-span-5 bg-[#11131c] border border-[#1f2335] rounded-xl overflow-hidden shadow-lg flex flex-col">
          <div className="p-5 border-b border-[#1f2335] bg-[#141722] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-display font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-[#3b82f6]" /> Agregar Producto Nuevo
              </h3>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">Se normalizará automáticamente para cruzarse con Meta Ads</p>
            </div>
          </div>

          <form onSubmit={handleAddProduct} className="p-5 space-y-4 flex-1">
            {/* Product Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-gray-300 font-semibold flex items-center justify-between">
                <span>Nombre del Producto *</span>
                <span className="text-[10px] text-gray-500 font-normal">Ej: Sábana Premium</span>
              </label>
              <input
                type="text"
                placeholder="Ingresa el nombre del producto..."
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                className="w-full bg-[#0b0c10] border border-[#252b42] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all font-mono"
              />
              {newProductName.trim() && (
                <p className="text-[10px] text-gray-500 font-mono flex items-center gap-1 mt-1">
                  <Tag className="w-3 h-3 text-[#3b82f6]" />
                  <span>Nombre normalizado: </span>
                  <code className="text-emerald-400 font-bold bg-emerald-950/40 px-1 py-0.5 rounded">
                    {newProductName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "")}
                  </code>
                </p>
              )}
            </div>

            {/* Base Price (USD) */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-gray-300 font-semibold">
                Precio Base Referencial (USD)
              </label>
              <input
                type="number"
                step="any"
                placeholder="Ej: 25"
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#0b0c10] border border-[#252b42] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all font-mono"
              />
            </div>

            {/* Country Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-[#1f2335]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-gray-300 font-semibold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#3b82f6]" />
                  <span>¿En qué países se vende ahora mismo?</span>
                </label>
                <button
                  type="button"
                  onClick={toggleSelectAllNewCountries}
                  className="text-[10px] font-mono text-[#3b82f6] hover:underline cursor-pointer"
                >
                  {selectedPaisIds.length === availableCountries.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-[#0b0c10] p-3 rounded-lg border border-[#252b42] max-h-48 overflow-y-auto">
                {availableCountries.map(country => {
                  const isChecked = selectedPaisIds.includes(country.id);
                  return (
                    <label 
                      key={country.id}
                      onClick={() => toggleCountryForNewProduct(country.id)}
                      className={`flex items-center gap-2 p-2 rounded-md border text-xs font-mono cursor-pointer transition-all ${
                        isChecked 
                          ? 'bg-blue-950/40 border-blue-500/50 text-white font-semibold' 
                          : 'bg-[#151926] border-[#22273b] text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent label click
                        className="hidden"
                      />
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-[#3b82f6] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-600 shrink-0" />
                      )}
                      <span className="truncate">{country.name}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[10px] font-mono text-gray-500">
                Seleccionados: <strong className="text-emerald-400">{selectedPaisIds.length}</strong> de {availableCountries.length} países
              </p>
            </div>

            {/* Error Message */}
            {productError && (
              <p className="text-[11px] text-rose-400 font-mono flex items-center gap-1.5 bg-rose-950/50 p-2.5 rounded-lg border border-rose-800/40">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {productError}
              </p>
            )}

            {/* Save Button */}
            <button
              type="submit"
              disabled={isSubmittingProduct}
              className="w-full py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50 mt-2"
            >
              {isSubmittingProduct ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Guardando en Supabase...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> Guardar Producto en Catálogo
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Existing Products List & Edit (7 cols) */}
        <div className="lg:col-span-7 bg-[#11131c] border border-[#1f2335] rounded-xl overflow-hidden shadow-lg flex flex-col">
          <div className="p-5 border-b border-[#1f2335] bg-[#141722] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-display font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#3b82f6]" /> Productos Registrados ({catalogProducts.length})
              </h3>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">Puedes agregar o quitar países de un producto ya creado</p>
            </div>
          </div>

          {/* Products List */}
          <div className="p-5 space-y-3.5 flex-1 overflow-y-auto max-h-[600px]">
            {isLoadingCatalog ? (
              <div className="py-12 text-center text-xs font-mono text-gray-500 flex flex-col items-center gap-2">
                <span className="w-5 h-5 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin"></span>
                <span>Cargando productos del catálogo...</span>
              </div>
            ) : catalogProducts.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-gray-500 border border-dashed border-[#252b42] rounded-xl p-6">
                <ShoppingBag className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-50" />
                <p>No hay productos registrados en el catálogo aún.</p>
                <p className="text-[10px] text-gray-600 mt-1">Agrega tu primer producto utilizando el formulario de la izquierda.</p>
              </div>
            ) : (
              catalogProducts.map((prod) => {
                const isEditing = editingProductId === prod.id;

                if (isEditing) {
                  return (
                    <div 
                      key={prod.id}
                      className="p-4 bg-[#151926] border-2 border-[#3b82f6] rounded-xl space-y-3 shadow-xl animate-fade-in"
                    >
                      <div className="flex items-center justify-between border-b border-[#252b42] pb-2">
                        <span className="text-xs font-mono font-bold text-[#3b82f6] flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5" /> Editando Producto
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCancelEdit}
                            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <X className="w-3 h-3" /> Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveEdit(prod.id)}
                            disabled={isSavingEdit}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Save className="w-3.5 h-3.5" /> Guardar
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-1">
                          <label className="text-[10px] font-mono text-gray-400 uppercase">Nombre</label>
                          <input
                            type="text"
                            value={editProductName}
                            onChange={(e) => setEditProductName(e.target.value)}
                            className="w-full bg-[#0b0c10] border border-[#252b42] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:ring-1 focus:ring-[#3b82f6]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-gray-400 uppercase">Precio (USD)</label>
                          <input
                            type="number"
                            step="any"
                            value={editProductPrice}
                            onChange={(e) => setEditProductPrice(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-[#0b0c10] border border-[#252b42] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:ring-1 focus:ring-[#3b82f6]"
                          />
                        </div>
                      </div>

                      {/* Edit Countries Checkboxes */}
                      <div className="space-y-1.5 pt-2">
                        <label className="text-[11px] font-mono text-gray-300 font-semibold block">
                          Países Asignados (Agregar o Quitar):
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 bg-[#0b0c10] p-2.5 rounded-lg border border-[#252b42]">
                          {availableCountries.map(country => {
                            const isChecked = editSelectedPaisIds.includes(country.id);
                            return (
                              <label 
                                key={country.id}
                                onClick={() => toggleCountryForEditProduct(country.id)}
                                className={`flex items-center gap-2 p-1.5 rounded border text-[11px] font-mono cursor-pointer transition-all ${
                                  isChecked 
                                    ? 'bg-blue-950/40 border-blue-500/50 text-white font-semibold' 
                                    : 'bg-[#151926] border-[#22273b] text-gray-500 hover:text-gray-300'
                                }`}
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-[#3b82f6] shrink-0" />
                                ) : (
                                  <Square className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                                )}
                                <span className="truncate">{country.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Normal Display Item
                const assignedCountryNames = availableCountries
                  .filter(c => (prod.pais_ids || []).includes(c.id))
                  .map(c => c.name);

                return (
                  <div 
                    key={prod.id}
                    className="p-4 bg-[#151926] border border-[#22273b] rounded-xl hover:border-[#2e354f] transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                          <span>{prod.nombre}</span>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded font-bold">
                            ${prod.precioBase} USD
                          </span>
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 mt-1">
                          <span>Key normalizado:</span>
                          <code className="text-blue-300 bg-[#0b0c10] px-1.5 py-0.5 rounded border border-[#252b42]">
                            {prod.nombre_normalizado}
                          </code>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(prod)}
                          className="p-1.5 bg-[#1f2335] hover:bg-[#2c324c] text-gray-300 hover:text-white rounded-lg text-xs font-mono transition-colors cursor-pointer"
                          title="Editar producto y países"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id, prod.nombre)}
                          className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 rounded-lg text-xs font-mono transition-colors cursor-pointer border border-rose-900/30"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Assigned Countries Badges */}
                    <div className="pt-2 border-t border-[#1f2335]/60 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-gray-500 uppercase mr-1">Países ({assignedCountryNames.length}):</span>
                      {assignedCountryNames.length === 0 ? (
                        <span className="text-[10px] font-mono text-amber-400/80 bg-amber-950/40 border border-amber-800/30 px-2 py-0.5 rounded">
                          Sin países asignados
                        </span>
                      ) : (
                        assignedCountryNames.map(cName => (
                          <span 
                            key={cName}
                            className="text-[10px] font-mono font-medium px-2 py-0.5 bg-blue-950/60 text-blue-300 border border-blue-800/40 rounded flex items-center gap-1"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                            {cName}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Country Rates Management Card */}
      <div className="bg-[#11131c] border border-[#1f2335] rounded-xl overflow-hidden shadow-lg p-5">
        <div className="flex items-center justify-between border-b border-[#1f2335] pb-3 mb-4">
          <h3 className="text-sm font-display font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#3b82f6]" /> Países y Tasas de Cambio en Supabase
          </h3>
          <span className="text-xs text-gray-500 font-mono">Conversión automática de divisas locales a USD</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Countries list */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(countriesConfig).map(([countryName, info]) => (
              <div 
                key={countryName}
                className="flex items-center justify-between p-2.5 bg-[#151926] border border-[#22273b] rounded-lg text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-bold text-white">{countryName}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <span>Divisa: <strong className="text-white">{info.currency}</strong></span>
                  <span>1 USD = <strong className="text-emerald-400">{info.rate.toLocaleString()} {info.currency}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Update Country Rate Form */}
          <form onSubmit={handleAddCountry} className="space-y-3 bg-[#151926] p-4 rounded-xl border border-[#22273b]">
            <h4 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">Actualizar Tasa / Moneda de País</h4>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="País (ej: Colombia)"
                value={newCountryName}
                onChange={(e) => setNewCountryName(e.target.value)}
                className="bg-[#0b0c10] border border-[#252b42] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
              />
              <input
                type="text"
                placeholder="Divisa (ej: COP)"
                maxLength={3}
                value={newCountryCurrency}
                onChange={(e) => setNewCountryCurrency(e.target.value)}
                className="bg-[#0b0c10] border border-[#252b42] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#3b82f6] uppercase font-mono"
              />
              <input
                type="number"
                step="any"
                placeholder="Tasa (ej: 4000)"
                value={newCountryRate}
                onChange={(e) => setNewCountryRate(e.target.value === '' ? '' : Number(e.target.value))}
                className="bg-[#0b0c10] border border-[#252b42] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#3b82f6] font-mono"
              />
            </div>
            {countryError && (
              <p className="text-[10px] text-rose-400 font-mono">{countryError}</p>
            )}
            <button
              type="submit"
              className="w-full py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Guardar Tasa en Supabase
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}

