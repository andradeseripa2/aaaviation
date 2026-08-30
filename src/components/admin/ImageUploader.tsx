import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Link as LinkIcon, Check, AlertCircle, Plane } from 'lucide-react';
import { uploadImageMedia, resolveImageUrl, AVIATION_PRESET_IMAGES, AviationImagePreset } from '../../services/mediaService';

interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (urlOrDataUrl: string) => void;
  caption?: string;
  onCaptionChange?: (caption: string) => void;
  placeholder?: string;
  helperText?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  value,
  onChange,
  caption = '',
  onCaptionChange,
  placeholder = 'https://images.unsplash.com/...',
  helperText = 'Formatos suportados: PNG, JPG, WEBP, GIF. Imagens são otimizadas para carregamento rápido.'
}) => {
  const [mode, setMode] = useState<'upload' | 'preset' | 'url'>(
    value.startsWith('/api/media/') || value.startsWith('data:') ? 'upload' : 'url'
  );
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload and optimize image via media service
  const handleFile = async (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('A imagem deve ter menos de 15MB para garantir boa performance.');
      return;
    }

    setIsProcessing(true);
    try {
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const result = await uploadImageMedia(file, cleanTitle);
      onChange(result.url);
      if (onCaptionChange && !caption) {
        onCaptionChange(`Foto de Capa: ${cleanTitle}`);
      }
    } catch {
      setErrorMsg('Falha ao processar a imagem. Tente novamente com outro arquivo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectPreset = (preset: AviationImagePreset) => {
    onChange(preset.url);
    if (onCaptionChange) {
      onCaptionChange(preset.caption);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider font-['Outfit']">
          {label}
        </label>
        
        {/* Toggle Mode: Upload vs Presets vs URL */}
        <div className="inline-flex rounded-lg p-0.5 bg-[#E2E8F0] text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
              mode === 'upload'
                ? 'bg-white text-[#0A192F] shadow-xs'
                : 'text-[#64748B] hover:text-[#0A192F]'
            }`}
          >
            <Upload className="w-3 h-3" />
            Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('preset')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
              mode === 'preset'
                ? 'bg-white text-[#0A192F] shadow-xs'
                : 'text-[#64748B] hover:text-[#0A192F]'
            }`}
          >
            <Plane className="w-3 h-3 text-[#1D4ED8]" />
            Fotos Aviação
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
              mode === 'url'
                ? 'bg-white text-[#0A192F] shadow-xs'
                : 'text-[#64748B] hover:text-[#0A192F]'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            URL Externa
          </button>
        </div>
      </div>

      {/* Mode 1: Upload Zone */}
      {mode === 'upload' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/gif"
            onChange={handleFileChange}
            className="hidden"
          />

          {!value ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-[#1D4ED8] bg-blue-50/50 scale-[1.01]'
                  : 'border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#1D4ED8] hover:bg-slate-50'
              }`}
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-50 text-[#1D4ED8] flex items-center justify-center border border-blue-100">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#0A192F] font-['Outfit']">
                {isProcessing ? 'Otimizando e preparando imagem...' : 'Clique para selecionar ou arraste sua imagem aqui'}
              </p>
              <p className="text-[11px] text-[#64748B] mt-1">{helperText}</p>
            </div>
          ) : (
            <div className="relative rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] overflow-hidden p-2">
              <div className="relative aspect-video max-h-56 w-full rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                <img
                  src={resolveImageUrl(value)}
                  alt="Prévia da Imagem"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white text-[#0A192F] text-xs font-bold rounded-lg shadow-md hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Trocar Imagem
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange('')}
                    className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-md hover:bg-rose-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remover
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 px-1 text-[11px] text-[#64748B]">
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <Check className="w-3.5 h-3.5" /> Imagem carregada e pronta
                </span>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="text-rose-600 hover:underline font-bold cursor-pointer"
                >
                  Excluir imagem
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Presets */}
      {mode === 'preset' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-1 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
            {AVIATION_PRESET_IMAGES.map(preset => {
              const isSelected = value === preset.url;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`relative rounded-xl overflow-hidden border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#1D4ED8] ring-2 ring-[#1D4ED8] shadow-md scale-[1.02]'
                      : 'border-[#CBD5E1] hover:border-blue-300 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="aspect-video bg-slate-900">
                    <img src={preset.url} alt={preset.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-1.5 bg-white">
                    <span className="text-[11px] font-bold text-[#0A192F] block truncate leading-tight">
                      {preset.title}
                    </span>
                    <span className="text-[9px] text-[#1D4ED8] font-semibold uppercase block truncate">
                      {preset.category}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1 right-1 p-1 bg-[#1D4ED8] text-white rounded-full">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode 3: URL Input */}
      {mode === 'url' && (
        <div className="space-y-3">
          <div className="relative">
            <input
              type="url"
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#0E2954]"
            />
            <ImageIcon className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
          </div>

          {value && (
            <div className="relative aspect-video max-h-48 w-full rounded-xl overflow-hidden border border-[#CBD5E1] bg-slate-100">
              <img
                src={resolveImageUrl(value)}
                alt="Prévia da URL"
                className="w-full h-full object-cover"
                onError={e => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <p className="text-xs text-rose-600 flex items-center gap-1.5 font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          {errorMsg}
        </p>
      )}

      {/* Caption input if callback provided */}
      {onCaptionChange && (
        <div className="pt-1">
          <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
            Legenda Técnica da Imagem (Exibida abaixo da foto)
          </label>
          <input
            type="text"
            value={caption}
            onChange={e => onCaptionChange(e.target.value)}
            placeholder="Ex: Vista seccional das pás de turbina e câmara de combustão..."
            className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#0E2954]"
          />
        </div>
      )}
    </div>
  );
};
