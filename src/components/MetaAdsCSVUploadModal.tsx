import React, { useState } from 'react';
import { Upload, X, AlertCircle, CheckCircle2, FileText, AlertTriangle, Info, Check, HelpCircle, ShieldAlert } from 'lucide-react';
import { CountryConfig } from '../types';
import { uploadMetaAdsCSVApi, MetaAdsUploadResult } from '../lib/api';

interface MetaAdsCSVUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  countriesConfig: Record<string, CountryConfig>;
  onSuccess: (insertedCount: number, ignoredCount: number, result?: MetaAdsUploadResult) => void;
}

const normalizeText = (str: string = '') => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

export default function MetaAdsCSVUploadModal({
  isOpen,
  onClose,
  countriesConfig,
  onSuccess
}: MetaAdsCSVUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<MetaAdsUploadResult | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setErrorMsg(null);
    setUploadResult(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setErrorMsg('Por favor selecciona un archivo con extensión .csv');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleProcessAndUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const csvText = await file.text();
      const res = await uploadMetaAdsCSVApi(csvText);
      setUploadResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar el archivo CSV de Meta Ads.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinishSummary = () => {
    if (uploadResult) {
      onSuccess(uploadResult.insertedCount || 0, uploadResult.ignoredCount || 0, uploadResult);
    }
    setUploadResult(null);
    setFile(null);
    onClose();
  };

  // Render Post-Upload Summary View
  if (uploadResult) {
    const countryMismatch = uploadResult.countryMismatchList || [];
    const unrecognized = uploadResult.unrecognizedProductList || [];
    const matchedCount = uploadResult.matchedCount || 0;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
        <div className="bg-[#11131c] border border-[#1f2335] rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] flex flex-col overflow-hidden">
          
          {/* Summary Header */}
          <div className="flex items-center justify-between border-b border-[#1f2335] pb-4">
            <div>
              <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Resumen Post-Carga de Meta Ads
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Procesamiento y validación contra el catálogo de productos
              </p>
            </div>
            <button onClick={handleFinishSummary} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-3.5 text-center">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">Reconocidos + País</span>
              <span className="text-xl font-display font-bold text-white mt-1 block">{matchedCount}</span>
              <span className="text-[9px] font-mono text-emerald-300/80">Coincidencia perfecta</span>
            </div>

            <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-3.5 text-center">
              <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">País No Registrado</span>
              <span className="text-xl font-display font-bold text-white mt-1 block">{countryMismatch.length}</span>
              <span className="text-[9px] font-mono text-amber-300/80">Producto existe en catálogo</span>
            </div>

            <div className="bg-rose-950/40 border border-rose-800/40 rounded-xl p-3.5 text-center">
              <span className="text-[10px] font-mono text-rose-400 uppercase font-bold block">No Reconocidos</span>
              <span className="text-xl font-display font-bold text-white mt-1 block">{unrecognized.length}</span>
              <span className="text-[9px] font-mono text-rose-300/80">Sin match en catálogo</span>
            </div>
          </div>

          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            
            {/* Country Mismatch Table */}
            {countryMismatch.length > 0 && (
              <div className="bg-[#151926] border border-amber-800/30 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-mono">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Producto reconocido pero PAÍS NO REGISTRADO para ese producto ({countryMismatch.length}):</span>
                </div>
                <p className="text-[11px] text-gray-400 font-mono">
                  Estos anuncios pertenecen a un producto registrado, pero ese producto no tiene asignado el país detectado en <code className="text-white">productos_paises</code>.
                </p>

                <div className="max-h-40 overflow-y-auto border border-[#22273b] rounded-lg">
                  <table className="w-full text-left text-[11px] font-mono">
                    <thead className="bg-[#0b0c10] text-gray-400 border-b border-[#22273b] sticky top-0">
                      <tr>
                        <th className="p-2">Anuncio (Ad Name)</th>
                        <th className="p-2">Producto Detectado</th>
                        <th className="p-2">País</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f2335] text-gray-300">
                      {countryMismatch.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#1f2335]/50">
                          <td className="p-2 text-white truncate max-w-[200px]" title={item.adName}>{item.adName}</td>
                          <td className="p-2 text-emerald-400 font-semibold">{item.detectedProduct}</td>
                          <td className="p-2 text-amber-400">{item.detectedCountry}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Unrecognized Products Table */}
            {unrecognized.length > 0 && (
              <div className="bg-[#151926] border border-rose-800/30 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs font-mono">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Productos NO RECONOCIDOS en el Catálogo ({unrecognized.length}):</span>
                </div>
                <p className="text-[11px] text-gray-400 font-mono">
                  El texto detectado en el anuncio no coincide con ningún producto registrado. Puedes crear el producto en el catálogo o ajustar el nombre en Meta Ads.
                </p>

                <div className="max-h-40 overflow-y-auto border border-[#22273b] rounded-lg">
                  <table className="w-full text-left text-[11px] font-mono">
                    <thead className="bg-[#0b0c10] text-gray-400 border-b border-[#22273b] sticky top-0">
                      <tr>
                        <th className="p-2">Anuncio (Ad Name)</th>
                        <th className="p-2">Texto Detectado</th>
                        <th className="p-2">País</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f2335] text-gray-300">
                      {unrecognized.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#1f2335]/50">
                          <td className="p-2 text-white truncate max-w-[200px]" title={item.adName}>{item.adName}</td>
                          <td className="p-2 text-rose-300 font-semibold bg-rose-950/30">{item.detectedProductText}</td>
                          <td className="p-2 text-gray-400">{item.detectedCountry}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {countryMismatch.length === 0 && unrecognized.length === 0 && (
              <div className="p-6 bg-emerald-950/20 border border-emerald-800/30 rounded-xl text-center font-mono space-y-1">
                <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-300">¡Validación 100% Exitosa!</h4>
                <p className="text-xs text-gray-400">Todos los anuncios procesados tienen un producto reconocido y asignado a su país correspondiente.</p>
              </div>
            )}

          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end pt-3 border-t border-[#1f2335]">
            <button
              onClick={handleFinishSummary}
              className="px-6 py-2.5 bg-[#3b82f6] hover:bg-blue-600 text-white rounded-lg text-xs font-mono font-bold transition-all shadow-lg cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Entendido y Finalizar
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Normal Upload View
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#11131c] border border-[#1f2335] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1f2335] pb-4">
          <div>
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#3b82f6]" /> Cargar CSV de Meta Ads (Desglose por Ad ID)
            </h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              Sube el reporte diario exportado a nivel de Anuncio (Ad ID)
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 bg-rose-950/80 border border-rose-800/40 rounded-xl text-rose-300 text-xs font-mono flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-1">Error de Validación:</span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-[#151926] border border-[#252b42] rounded-xl p-4 space-y-2 text-xs font-mono text-gray-300">
          <div className="flex items-center gap-2 text-[#3b82f6] font-bold">
            <Info className="w-4 h-4" /> Requisitos del CSV de Meta:
          </div>
          <ul className="list-disc list-inside space-y-1 text-gray-400 pl-1">
            <li>Formato de anuncio recomendado: <strong className="text-amber-400 font-mono">AD01|ETAPA|PAÍS|PRODUCTO</strong></li>
            <li>Debe incluir la columna <strong className="text-white">"Ad ID"</strong> y <strong className="text-white">"Amount spent"</strong>.</li>
            <li>Detecta y valida automáticamente el producto contra el <strong className="text-emerald-400">Catálogo de Productos</strong>.</li>
          </ul>
        </div>

        {/* File Dropzone */}
        <div className="space-y-2">
          <label className="block text-xs font-mono font-semibold text-gray-300">Seleccionar Archivo CSV:</label>
          <label className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            file 
              ? 'border-emerald-500/50 bg-emerald-950/10' 
              : 'border-[#252b42] hover:border-[#3b82f6]/50 bg-[#151926]'
          }`}>
            <FileText className={`w-8 h-8 mb-2 ${file ? 'text-emerald-400' : 'text-gray-500'}`} />
            {file ? (
              <div className="text-center">
                <span className="text-xs font-mono font-bold text-white block">{file.name}</span>
                <span className="text-[10px] font-mono text-emerald-400 mt-1 block">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-xs font-mono text-gray-300 block font-semibold">Haz clic o arrastra tu archivo .csv aquí</span>
                <span className="text-[10px] font-mono text-gray-500 mt-1 block">Formatos aceptados: UTF-8 / Standard Meta Export</span>
              </div>
            )}
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange} 
              className="hidden" 
            />
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1f2335]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#151926] hover:bg-[#1f2335] text-gray-300 rounded-lg text-xs font-mono font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleProcessAndUpload}
            disabled={!file || isUploading}
            className="px-5 py-2 bg-[#3b82f6] hover:bg-blue-600 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {isUploading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Procesando CSV...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Importar y Validar CSV</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

