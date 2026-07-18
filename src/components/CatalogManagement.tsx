/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Globe, 
  Plus, 
  Trash2, 
  Info, 
  DollarSign, 
  Calculator, 
  Coins, 
  PlusCircle, 
  AlertTriangle 
} from 'lucide-react';
import { Product, CountryConfig } from '../types';

interface CatalogManagementProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  countriesConfig: Record<string, { currency: string; rate: number }>;
  setCountriesConfig: React.Dispatch<React.SetStateAction<Record<string, { currency: string; rate: number }>>>;
  onShowToast: (message: string, type?: 'success' | 'warning' | 'info') => void;
}

export default function CatalogManagement({
  products,
  setProducts,
  countriesConfig,
  setCountriesConfig,
  onShowToast
}: CatalogManagementProps) {
  // New Product Form State
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState<number | ''>('');
  const [productError, setProductError] = useState('');

  // New Country Form State
  const [newCountryName, setNewCountryName] = useState('');
  const [newCountryCurrency, setNewCountryCurrency] = useState('');
  const [newCountryRate, setNewCountryRate] = useState<number | ''>('');
  const [countryError, setCountryError] = useState('');

  // Add Product Handler
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setProductError('');

    if (!newProductName.trim()) {
      setProductError('El nombre del infoproducto es obligatorio.');
      return;
    }

    if (newProductPrice === '' || newProductPrice <= 0) {
      setProductError('El precio en USD debe ser mayor a 0.');
      return;
    }

    // Check duplicate
    if (products.some(p => p.name.toLowerCase() === newProductName.trim().toLowerCase())) {
      setProductError('Este infoproducto ya se encuentra registrado.');
      return;
    }

    const updated = [...products, { name: newProductName.trim(), usdPrice: Number(newProductPrice) }];
    setProducts(updated);
    onShowToast(`Infoproducto "${newProductName.trim()}" agregado correctamente.`, 'success');

    // Reset Form
    setNewProductName('');
    setNewProductPrice('');
  };

  // Remove Product Handler
  const handleRemoveProduct = (name: string) => {
    if (products.length <= 1) {
      onShowToast('Debes mantener al menos un infoproducto activo.', 'warning');
      return;
    }
    const updated = products.filter(p => p.name !== name);
    setProducts(updated);
    onShowToast(`Infoproducto "${name}" eliminado del catálogo.`, 'warning');
  };

  // Add Country Handler
  const handleAddCountry = (e: React.FormEvent) => {
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

    // Check duplicate
    if (countriesConfig[formattedCountryName]) {
      setCountryError('Este país ya está configurado en el sistema.');
      return;
    }

    const updated = {
      ...countriesConfig,
      [formattedCountryName]: {
        currency: formattedCurrency,
        rate: Number(newCountryRate)
      }
    };

    setCountriesConfig(updated);
    onShowToast(`País "${formattedCountryName}" (${formattedCurrency}) agregado correctamente.`, 'success');

    // Reset Form
    setNewCountryName('');
    setNewCountryCurrency('');
    setNewCountryRate('');
  };

  // Remove Country Handler
  const handleRemoveCountry = (countryKey: string) => {
    const keys = Object.keys(countriesConfig);
    if (keys.length <= 1) {
      onShowToast('Debes mantener al menos un país activo para la analítica.', 'warning');
      return;
    }

    const updated = { ...countriesConfig };
    delete updated[countryKey];
    setCountriesConfig(updated);
    onShowToast(`País "${countryKey}" eliminado de los parámetros.`, 'warning');
  };

  return (
    <div id="catalog-management-section" className="space-y-6">
      
      {/* Information Header */}
      <div className="bg-[#11131c] border border-[#1f2335] rounded-xl p-5 shadow-lg flex items-start gap-4">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-display font-bold text-white">
            Configuración de Catálogo e Integración Local
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-1 max-w-3xl leading-relaxed">
            Administra dinámicamente los países activos en tus embudos y los infoproductos que comercializas. Los cambios realizados se reflejarán instantáneamente en los filtros del dashboard, los formularios de registro de ventas y los cálculos de conversión de divisas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PRODUCTS MANAGEMENT */}
        <div className="bg-[#11131c] border border-[#1f2335] rounded-xl overflow-hidden shadow-lg flex flex-col">
          <div className="p-5 border-b border-[#1f2335] bg-[#141722]">
            <h3 className="text-sm font-display font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4.5 h-4.5 text-[#3b82f6]" /> Catálogo de Infoproductos
            </h3>
            <p className="text-[11px] text-gray-500 font-mono mt-0.5">Precios base establecidos en dólares americanos (USD)</p>
          </div>

          {/* List of Products */}
          <div className="p-5 space-y-3 flex-1 overflow-y-auto max-h-96">
            {products.map((prod) => (
              <div 
                key={prod.name}
                className="flex items-center justify-between p-3.5 bg-[#151926] border border-[#22273b] rounded-lg hover:border-[#2e354f] transition-all"
              >
                <div>
                  <h4 className="text-xs font-semibold text-white">{prod.name}</h4>
                  <span className="text-[10px] font-mono text-[#06b6d4] mt-0.5 block font-bold">${prod.usdPrice} USD</span>
                </div>
                <button
                  onClick={() => handleRemoveProduct(prod.name)}
                  className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                  title="Eliminar producto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Product Form */}
          <div className="p-5 border-t border-[#1f2335] bg-[#141722]">
            <h4 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider mb-3">Agregar Infoproducto</h4>
            <form onSubmit={handleAddProduct} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Nombre</label>
                  <input
                    type="text"
                    placeholder="Ej: Curso de Resina Epóxica"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="w-full bg-[#0b0c10] border border-[#252b42] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Precio (USD)</label>
                  <input
                    type="number"
                    placeholder="Ej: 25"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#0b0c10] border border-[#252b42] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all font-mono"
                  />
                </div>
              </div>

              {productError && (
                <p className="text-[10px] text-rose-400 font-mono flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" /> {productError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Agregar al Catálogo
              </button>
            </form>
          </div>
        </div>

        {/* COUNTRIES MANAGEMENT */}
        <div className="bg-[#11131c] border border-[#1f2335] rounded-xl overflow-hidden shadow-lg flex flex-col">
          <div className="p-5 border-b border-[#1f2335] bg-[#141722]">
            <h3 className="text-sm font-display font-bold text-white flex items-center gap-2">
              <Globe className="w-4.5 h-4.5 text-[#3b82f6]" /> Países y Tasas de Cambio
            </h3>
            <p className="text-[11px] text-gray-500 font-mono mt-0.5">Definición de monedas locales y paridad frente al USD</p>
          </div>

          {/* List of Countries */}
          <div className="p-5 space-y-3 flex-1 overflow-y-auto max-h-96">
            {Object.entries(countriesConfig).map(([countryName, info]) => (
              <div 
                key={countryName}
                className="flex items-center justify-between p-3.5 bg-[#151926] border border-[#22273b] rounded-lg hover:border-[#2e354f] transition-all"
              >
                <div>
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {countryName}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-gray-400">
                    <span>Divisa: <strong className="text-white">{info.currency}</strong></span>
                    <span>•</span>
                    <span>Tasa (1 USD): <strong className="text-emerald-400">{info.rate.toLocaleString()} {info.currency}</strong></span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveCountry(countryName)}
                  className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                  title="Eliminar país"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Country Form */}
          <div className="p-5 border-t border-[#1f2335] bg-[#141722]">
            <h4 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider mb-3">Agregar País / Divisa</h4>
            <form onSubmit={handleAddCountry} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">País</label>
                  <input
                    type="text"
                    placeholder="Ej: Ecuador"
                    value={newCountryName}
                    onChange={(e) => setNewCountryName(e.target.value)}
                    className="w-full bg-[#0b0c10] border border-[#252b42] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Divisa</label>
                  <input
                    type="text"
                    placeholder="Ej: USD"
                    maxLength={3}
                    value={newCountryCurrency}
                    onChange={(e) => setNewCountryCurrency(e.target.value)}
                    className="w-full bg-[#0b0c10] border border-[#252b42] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all font-mono uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Tasa (1 USD)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ej: 1.0"
                    value={newCountryRate}
                    onChange={(e) => setNewCountryRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#0b0c10] border border-[#252b42] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all font-mono"
                  />
                </div>
              </div>

              {countryError && (
                <p className="text-[10px] text-rose-400 font-mono flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" /> {countryError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Registrar País y Moneda
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
