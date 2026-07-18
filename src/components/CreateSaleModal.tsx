/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, RefreshCw, DollarSign } from 'lucide-react';
import { Sale, Product } from '../types';
import { BOTS } from '../data/mockData';

interface CreateSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sale: Omit<Sale, 'id'>) => void;
  initialSale?: Sale | null;
  products: Product[];
  countriesConfig: Record<string, { currency: string; rate: number }>;
}

export default function CreateSaleModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialSale,
  products,
  countriesConfig
}: CreateSaleModalProps) {
  const defaultCountry = Object.keys(countriesConfig)[0] || 'Colombia';
  const defaultProduct = products[0]?.name || '';

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<string>(defaultCountry);
  const [product, setProduct] = useState<string>(defaultProduct);
  const [bot, setBot] = useState(BOTS[0]);
  const [amountLocal, setAmountLocal] = useState<number>(0);
  
  // Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Reset/Set values on open or edit change
  useEffect(() => {
    if (isOpen) {
      if (initialSale) {
        setCustomerName(initialSale.customerName);
        setPhone(initialSale.phone);
        setCountry(initialSale.country);
        setProduct(initialSale.product);
        setBot(initialSale.bot);
        setAmountLocal(initialSale.amountLocal);
      } else {
        // Set defaults
        setCustomerName('');
        setPhone('');
        const firstCountry = Object.keys(countriesConfig)[0] || 'Colombia';
        setCountry(firstCountry);
        const firstProduct = products[0];
        setProduct(firstProduct?.name || '');
        setBot(BOTS[0]);
        // Default local price
        if (firstProduct && countriesConfig[firstCountry]) {
          const rateInfo = countriesConfig[firstCountry];
          setAmountLocal(firstProduct.usdPrice * rateInfo.rate);
        } else {
          setAmountLocal(0);
        }
      }
      setErrors({});
    }
  }, [isOpen, initialSale, products, countriesConfig]);

  // Handle product or country change to auto-calculate local price recommendation
  const handleProductOrCountryChange = (newProduct: string, newCountry: string) => {
    const selectedProd = products.find(p => p.name === newProduct);
    if (selectedProd) {
      const rateInfo = countriesConfig[newCountry];
      if (rateInfo) {
        setAmountLocal(selectedProd.usdPrice * rateInfo.rate);
      }
    }
  };

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  // Validate fields
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!customerName.trim() || customerName.trim().length < 3) {
      newErrors.customerName = 'El nombre completo debe tener al menos 3 caracteres.';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Se requiere el número de teléfono/WhatsApp.';
    } else if (!/^\+?[0-9\s-]{8,15}$/.test(phone)) {
      newErrors.phone = 'Introduce un formato de teléfono válido (ej: +57 3001234567).';
    }
    if (!amountLocal || amountLocal <= 0) {
      newErrors.amountLocal = 'El monto cobrado debe ser mayor a 0.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Convert local price to USD dynamically for metrics consistency
    const rateInfo = countriesConfig[country] || { currency: 'USD', rate: 1.0 };
    const amountUsd = Math.round((amountLocal / rateInfo.rate) * 100) / 100;

    onSubmit({
      date: new Date().toISOString().split('T')[0], // log on current system date
      customerName: customerName.trim(),
      phone: phone.trim(),
      country,
      product,
      bot,
      amountLocal: Number(amountLocal),
      currency: rateInfo.currency,
      amountUsd,
    });
    
    onClose();
  };

  const currentRateInfo = countriesConfig[country] || { currency: 'USD', rate: 1.0 };
  const calculatedUsd = amountLocal > 0 ? (amountLocal / currentRateInfo.rate).toFixed(2) : '0.00';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-200">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="w-full max-w-lg bg-[#11131c] border border-[#2e354f] rounded-xl shadow-2xl overflow-hidden animate-zoom-in"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#141722] border-b border-[#1f2335] flex items-center justify-between">
          <div>
            <h2 className="text-base font-display font-bold text-white">
              {initialSale ? 'Editar Registro de Venta WA' : 'Registrar Venta de WhatsApp'}
            </h2>
            <p className="text-[11px] font-mono text-gray-500 mt-0.5">La moneda local se convierte automáticamente a USD para la analítica.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#1f2335] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
          {/* Customer Name */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Nombre del Cliente</label>
            <input
              type="text"
              placeholder="Ej: Sebastián Gómez"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className={`w-full bg-[#151926] border rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all ${
                errors.customerName ? 'border-rose-500 ring-rose-500' : 'border-[#252b42]'
              }`}
            />
            {errors.customerName && (
              <p className="text-[10px] text-rose-400 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3 h-3" /> {errors.customerName}
              </p>
            )}
          </div>

          {/* WhatsApp Phone */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">WhatsApp / Teléfono</label>
            <input
              type="text"
              placeholder="Ej: +57 312 3456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full bg-[#151926] border rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all ${
                errors.phone ? 'border-rose-500 ring-rose-500' : 'border-[#252b42]'
              }`}
            />
            {errors.phone && (
              <p className="text-[10px] text-rose-400 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3 h-3" /> {errors.phone}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Country Selector */}
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">País de Destino</label>
              <select
                value={country}
                onChange={(e) => {
                  const val = e.target.value;
                  setCountry(val);
                  handleProductOrCountryChange(product, val);
                }}
                className="w-full bg-[#151926] border border-[#252b42] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#3b82f6] cursor-pointer"
              >
                {Object.keys(countriesConfig).map(cName => (
                  <option key={cName} value={cName}>{cName}</option>
                ))}
              </select>
            </div>

            {/* WhatsApp Bot Origin */}
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Bot WhatsApp Origen</label>
              <select
                value={bot}
                onChange={(e) => setBot(e.target.value)}
                className="w-full bg-[#151926] border border-[#252b42] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#3b82f6] cursor-pointer"
              >
                {BOTS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Selector */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Infoproducto / Plano</label>
            <select
              value={product}
              onChange={(e) => {
                const val = e.target.value;
                setProduct(val);
                handleProductOrCountryChange(val, country);
              }}
              className="w-full bg-[#151926] border border-[#252b42] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#3b82f6] cursor-pointer"
            >
              {products.map(p => (
                <option key={p.name} value={p.name}>
                  {p.name} (${p.usdPrice} USD)
                </option>
              ))}
            </select>
          </div>

          {/* Local Price Input */}
          <div className="space-y-1 bg-[#151926] border border-[#1f2335] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-semibold text-gray-300 uppercase tracking-wider">Monto Cobrado Local</label>
              <span className="text-[10px] font-mono text-gray-500">Tasa: 1 USD = {currentRateInfo.rate} {currentRateInfo.currency}</span>
            </div>
            
            <div className="relative mt-2 rounded-lg shadow-sm">
              <input
                type="number"
                value={amountLocal || ''}
                onChange={(e) => setAmountLocal(Number(e.target.value))}
                className="w-full bg-[#0b0c10] border border-[#252b42] rounded-lg pl-3 pr-14 py-2 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                placeholder="0"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-xs font-mono font-bold text-[#3b82f6]">{currentRateInfo.currency}</span>
              </div>
            </div>

            {/* Simulated Conversion Info */}
            <div className="mt-3 pt-3 border-t border-[#1f2335] flex items-center justify-between text-xs font-mono text-gray-400">
              <span className="flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" /> Conversión Atribuida</span>
              <span className="font-bold text-white flex items-center"><DollarSign className="w-3 h-3 text-emerald-400" /> {calculatedUsd} USD</span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#1f2335]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1c2132] hover:bg-[#252b42] text-xs font-medium text-gray-300 rounded-lg border border-[#2d3450] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-xs font-medium text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-500/10"
            >
              <Save className="w-3.5 h-3.5" /> {initialSale ? 'Actualizar' : 'Guardar Venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
