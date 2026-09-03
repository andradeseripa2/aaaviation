import React, { useState, useRef } from 'react';
import { useBlog } from '../../context/BlogContext';
import { LeadMaterialConfig, LeadCapture } from '../../types';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Download,
  FileText,
  Trash2,
  Save,
  Copy,
  Check,
  Eye,
  Edit3,
  Users,
  Search,
  ExternalLink,
  Shield,
  Sparkles,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const EditLeadMaterialSection: React.FC = () => {
  const {
    leadMaterialConfig,
    updateLeadMaterialConfig,
    capturedLeads,
    deleteCapturedLead
  } = useBlog();

  const [formData, setFormData] = useState<LeadMaterialConfig>(() => ({
    ...leadMaterialConfig,
    bulletPoints: Array.isArray(leadMaterialConfig?.bulletPoints)
      ? leadMaterialConfig.bulletPoints
      : [
          'Itens críticos de pré-voo, hangaragem e rotinas técnicas',
          'Matriz de Risco Operacional com base na doutrina SIPAER',
          'Formato PDF e XLSX editável para fins educacionais'
        ]
  }));

  const [bulletInput, setBulletInput] = useState('');
  const [activeEditorTab, setActiveEditorTab] = useState<'write' | 'preview'>('write');
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [copyEmailsSuccess, setCopyEmailsSuccess] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<'all' | 'delivered' | 'pending'>('all');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [fileProcessing, setFileProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const markdownTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state if external leadMaterialConfig updates
  React.useEffect(() => {
    if (leadMaterialConfig) {
      setFormData(prev => ({
        ...leadMaterialConfig,
        bulletPoints: leadMaterialConfig.bulletPoints || prev.bulletPoints
      }));
    }
  }, [leadMaterialConfig]);

  // Handle File Upload (PDF, XLSX, DOCX, ZIP)
  const handleFileUpload = (file: File) => {
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('O arquivo selecionado é maior que 25MB. Recomendamos manter até 20MB para carregamento instantâneo.');
      return;
    }

    setFileProcessing(true);
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const sizeKb = Math.round(file.size / 1024);
      const displaySize = file.size > 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`;

      setFormData(prev => ({
        ...prev,
        fileUrl: dataUrl,
        fileName: file.name,
        fileSize: displaySize,
        // If file is uploaded, suggest moving to published
        status: prev.status === 'draft' ? 'published' : prev.status
      }));

      setFileProcessing(false);
    };

    reader.onerror = () => {
      alert('Erro ao carregar arquivo local.');
      setFileProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Add bullet point
  const handleAddBullet = () => {
    if (!bulletInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      bulletPoints: [...(prev.bulletPoints || []), bulletInput.trim()]
    }));
    setBulletInput('');
  };

  const handleRemoveBullet = (index: number) => {
    setFormData(prev => ({
      ...prev,
      bulletPoints: (prev.bulletPoints || []).filter((_, i) => i !== index)
    }));
  };

  // Markdown Toolbar actions
  const insertMarkdown = (prefix: string, suffix: string = '', sample: string = '') => {
    const textarea = markdownTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = formData.emailBodyMarkdown || '';
    const selected = current.substring(start, end) || sample;

    const replacement = `${prefix}${selected}${suffix}`;
    const nextVal = current.substring(0, start) + replacement + current.substring(end);

    setFormData(prev => ({ ...prev, emailBodyMarkdown: nextVal }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  // Save changes to Firestore
  const handleSave = async () => {
    setIsSaving(true);
    setSaveFeedback(null);

    const res = await updateLeadMaterialConfig(formData);
    setIsSaving(false);
    setSaveFeedback(res);

    setTimeout(() => {
      setSaveFeedback(null);
    }, 4500);
  };

  // Copy all captured emails to clipboard
  const handleCopyEmails = async () => {
    const emails = Array.from(new Set(capturedLeads.map(l => l.email.trim()))).filter(Boolean);
    if (emails.length === 0) return;

    const text = emails.join(', ');
    try {
      await navigator.clipboard.writeText(text);
      setCopyEmailsSuccess(true);
      setTimeout(() => setCopyEmailsSuccess(false), 3000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopyEmailsSuccess(true);
      setTimeout(() => setCopyEmailsSuccess(false), 3000);
    }
  };

  // Export Leads to CSV
  const handleExportCSV = () => {
    if (capturedLeads.length === 0) return;

    const headers = ['Nome', 'Email', 'Data de Cadastro', 'Status', 'Origem'];
    const rows = capturedLeads.map(l => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${new Date(l.createdAt).toLocaleString('pt-BR')}"`,
      `"${l.status === 'delivered' ? 'Entregue' : 'Aguardando Liberação'}"`,
      `"${l.postTitle || l.source}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_checklist_sgso_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Leads
  const filteredLeads = capturedLeads.filter(lead => {
    const matchesSearch =
      lead.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
      lead.email.toLowerCase().includes(leadSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (leadStatusFilter === 'delivered') return lead.status === 'delivered';
    if (leadStatusFilter === 'pending') return lead.status === 'pending';
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* SECTION 1: TOP BANNER & STATUS TOGGLE */}
      <div className="bg-white dark:bg-[#0B1528] rounded-3xl border border-[#CBD5E1] dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-900 shadow-inner">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-['Outfit'] text-[#0A192F] dark:text-white">
                  Gestão do Checklist & Material SGSO
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider font-mono ${
                    formData.status === 'published'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  }`}
                >
                  {formData.status === 'published' ? 'Liberado para Download' : 'Em Elaboração / Construção'}
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
                Configure o material técnico educacional, faça upload do arquivo e edite o texto da entrega.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Status Switcher */}
            <div className="flex items-center bg-[#F1F5F9] dark:bg-slate-800/80 p-1 rounded-2xl border border-[#CBD5E1] dark:border-slate-700">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, status: 'draft' }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all font-['Outfit'] cursor-pointer ${
                  formData.status === 'draft'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Em Construção
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, status: 'published' }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all font-['Outfit'] cursor-pointer ${
                  formData.status === 'published'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Liberado (Ativo)
              </button>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A192F] dark:bg-blue-600 hover:bg-[#0E2954] dark:hover:bg-blue-500 text-white text-xs font-bold font-['Outfit'] uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </div>

        {/* Feedback Message */}
        {saveFeedback && (
          <div
            className={`mt-4 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-in fade-in duration-200 ${
              saveFeedback.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {saveFeedback.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{saveFeedback.message}</span>
          </div>
        )}

        {/* Status Explanation Card */}
        <div className="mt-6 p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-950 dark:text-blue-200 space-y-1">
          <div className="font-bold font-['Outfit'] flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Como este material funciona para o visitante:</span>
          </div>
          <p className="leading-relaxed">
            {formData.status === 'draft' ? (
              <>
                <strong>Modo &quot;Em Construção&quot; ativo:</strong> O leitor preenche o formulário para ter acesso prioritário. Ao clicar em baixar, o sistema <strong>salva o e-mail na sua base</strong> e exibe uma mensagem polida informando que o checklist está em fase final de elaboração técnica, garantindo que nenhum leitor seja perdido.
              </>
            ) : (
              <>
                <strong>Modo &quot;Liberado&quot; ativo:</strong> O leitor preenche nome e e-mail. Ao enviar, o sistema salva o contato e <strong>disponibiliza imediatamente o botão de download</strong> do arquivo anexado, além de exibir a sua Carta Técnica em formato Markdown.
              </>
            )}
          </p>
        </div>
      </div>

      {/* SECTION 2: FILE UPLOAD & ATTACHMENT */}
      <div className="bg-white dark:bg-[#0B1528] rounded-3xl border border-[#CBD5E1] dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#0A192F] dark:text-white">
            <HardDrive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-base font-['Outfit']">Arquivo do Checklist (Download)</h3>
          </div>
          {formData.fileName && (
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Arquivo Anexado
            </span>
          )}
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
            isDraggingFile
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={e => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            accept=".pdf,.xlsx,.xls,.docx,.doc,.zip,.csv"
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-3 shadow-xs">
            {fileProcessing ? (
              <RefreshCw className="w-7 h-7 animate-spin" />
            ) : (
              <Upload className="w-7 h-7" />
            )}
          </div>

          <h4 className="text-sm font-bold font-['Outfit'] text-slate-800 dark:text-slate-200 mb-1">
            Arraste seu arquivo aqui ou clique para selecionar
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Formatos recomendados: <strong>PDF</strong>, <strong>XLSX (Planilha)</strong>, <strong>DOCX</strong> ou <strong>ZIP</strong> (até 25MB).
          </p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer font-['Outfit']"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Selecionar Arquivo do Computador</span>
          </button>
        </div>

        {/* Current Attached File Details & External Link Alternative */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-['Outfit']">
              Arquivo Atual Configurado
            </span>

            {formData.fileUrl ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {formData.fileName || 'Checklist_Auditoria_SGSO.pdf'}
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {formData.fileSize || 'Tamanho estimado: 1.8 MB'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={formData.fileUrl}
                      download={formData.fileName || 'Checklist_SGSO.pdf'}
                      className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-all cursor-pointer"
                      title="Testar download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          fileUrl: '',
                          fileName: '',
                          fileSize: ''
                        }))
                      }
                      className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-all cursor-pointer"
                      title="Remover anexo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Pronto para entrega imediata aos leitores</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-400 italic">
                Nenhum arquivo anexado ainda. Faça upload acima ou insira um link externo ao lado.
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-['Outfit']">
              Ou Insira Link Externo (Google Drive / Nuvem)
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Se preferir hospedar o arquivo no Google Drive, Dropbox ou OneDrive, cole o link direto aqui:
            </p>
            <input
              type="url"
              value={formData.fileUrl && !formData.fileUrl.startsWith('data:') ? formData.fileUrl : ''}
              onChange={e => {
                const url = e.target.value.trim();
                setFormData(prev => ({
                  ...prev,
                  fileUrl: url,
                  fileName: prev.fileName || 'Checklist_Auditoria_SGSO_Link.pdf'
                }));
              }}
              placeholder="https://drive.google.com/file/d/.../view"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: TEXTOS DO CARD & MENSAGENS INFORMATIVAS */}
      <div className="bg-white dark:bg-[#0B1528] rounded-3xl border border-[#CBD5E1] dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-2 text-[#0A192F] dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
          <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-base font-['Outfit']">Textos de Apresentação no Site</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 font-['Outfit']">
                Título do Material *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 font-['Outfit']">
                Selo / Badge Superior
              </label>
              <input
                type="text"
                value={formData.badgeText}
                onChange={e => setFormData(prev => ({ ...prev, badgeText: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 font-['Outfit']">
                Subtítulo / Descrição Resumida
              </label>
              <textarea
                rows={3}
                value={formData.subtitle}
                onChange={e => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Bullet Points */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-['Outfit']">
              Tópicos de Destaque (Itens com Check)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={bulletInput}
                onChange={e => setBulletInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddBullet();
                  }
                }}
                placeholder="Ex: Matriz de Risco Operacional com base no RBAC"
                className="flex-1 px-3 py-2 text-xs bg-[#F8FAFC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddBullet}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer font-['Outfit']"
              >
                Adicionar
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {(formData.bulletPoints || []).map((bullet, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{bullet}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveBullet(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notification Messages for Visitor Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-1 font-['Outfit']">
              Mensagem exibida quando estiver &quot;Em Construção&quot;
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Mensagem amigável que o usuário lê após preencher o e-mail enquanto você finaliza o material:
            </p>
            <textarea
              rows={4}
              value={formData.underConstructionMessage}
              onChange={e => setFormData(prev => ({ ...prev, underConstructionMessage: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-xs bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1 font-['Outfit']">
              Mensagem exibida quando estiver &quot;Liberado&quot;
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Mensagem de sucesso confirmando a liberação e download imediato:
            </p>
            <textarea
              rows={4}
              value={formData.publishedSuccessMessage}
              onChange={e => setFormData(prev => ({ ...prev, publishedSuccessMessage: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-xs bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: CORPO DO E-MAIL & CARTA TÉCNICA COM MARKDOWN */}
      <div className="bg-white dark:bg-[#0B1528] rounded-3xl border border-[#CBD5E1] dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-[#0A192F] dark:text-white">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-base font-['Outfit']">Carta Técnica & Corpo do E-mail (Markdown)</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Esta mensagem é exibida para o usuário e serve como modelo de envio oficial da doutrina SGSO.
            </p>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveEditorTab('write')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all font-['Outfit'] cursor-pointer ${
                activeEditorTab === 'write'
                  ? 'bg-white dark:bg-slate-900 text-[#0A192F] dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar Markdown</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveEditorTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all font-['Outfit'] cursor-pointer ${
                activeEditorTab === 'preview'
                  ? 'bg-white dark:bg-slate-900 text-[#0A192F] dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Pré-visualização</span>
            </button>
          </div>
        </div>

        {/* Email Subject Line */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 font-['Outfit']">
            Assunto do E-mail / Carta
          </label>
          <input
            type="text"
            value={formData.emailSubject}
            onChange={e => setFormData(prev => ({ ...prev, emailSubject: e.target.value }))}
            className="w-full px-3.5 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Markdown Toolbar */}
        {activeEditorTab === 'write' && (
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => insertMarkdown('**', '**', 'texto em negrito')}
              className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-100 cursor-pointer"
              title="Negrito"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('*', '*', 'texto em itálico')}
              className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 italic hover:bg-slate-100 cursor-pointer"
              title="Itálico"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('### ', '', 'Título da Seção')}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-100 cursor-pointer text-[11px]"
              title="Título H3"
            >
              H3
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('- ', '', 'Item da lista')}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 cursor-pointer text-[11px]"
              title="Lista de Itens"
            >
              • Lista
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('> ⚠️ ', '', 'Nota ou citação de segurança operacional')}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 cursor-pointer text-[11px]"
              title="Citação / Nota"
            >
              &ldquo; Citação
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('[', '](https://aaaviation.com.br)', 'Link Texto')}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 cursor-pointer text-[11px]"
              title="Inserir Link"
            >
              Link
            </button>

            <span className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

            <span className="text-[10px] font-mono text-slate-400">Variáveis:</span>
            <button
              type="button"
              onClick={() => insertMarkdown('{{nome}}', '', '')}
              className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-[10px] hover:bg-blue-100 cursor-pointer"
              title="Nome do leitor"
            >
              {`{{nome}}`}
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('{{email}}', '', '')}
              className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-[10px] hover:bg-blue-100 cursor-pointer"
              title="Email do leitor"
            >
              {`{{email}}`}
            </button>
          </div>
        )}

        {/* Textarea or Preview */}
        {activeEditorTab === 'write' ? (
          <textarea
            ref={markdownTextareaRef}
            rows={14}
            value={formData.emailBodyMarkdown}
            onChange={e => setFormData(prev => ({ ...prev, emailBodyMarkdown: e.target.value }))}
            placeholder="Digite o texto com formatação markdown..."
            className="w-full px-4 py-3 text-xs sm:text-sm font-mono bg-[#F8FAFC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 leading-relaxed"
          />
        ) : (
          <div className="p-6 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {(formData.emailBodyMarkdown || '').replace(/\{\{nome\}\}/g, 'Carlos Mendes')}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: LEADS CAPTURADOS (LISTA DE INTERESSADOS NO SGSO) */}
      <div className="bg-white dark:bg-[#0B1528] rounded-3xl border border-[#CBD5E1] dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base font-['Outfit'] text-[#0A192F] dark:text-white">
                  Leads Capturados pelo Checklist SGSO
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  {capturedLeads.length} contatos
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pessoas que solicitaram o checklist de segurança de voo no blog.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyEmails}
              disabled={capturedLeads.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer font-['Outfit'] disabled:opacity-50"
            >
              {copyEmailsSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copiados!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Todos os E-mails</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={capturedLeads.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer font-['Outfit'] disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={leadSearch}
              onChange={e => setLeadSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-[#F8FAFC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'delivered', 'pending'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setLeadStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all font-['Outfit'] cursor-pointer ${
                  leadStatusFilter === tab
                    ? 'bg-[#0A192F] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {tab === 'all' && 'Todos'}
                {tab === 'delivered' && 'Entregues'}
                {tab === 'pending' && 'Aguardando'}
              </button>
            ))}
          </div>
        </div>

        {/* Table of Leads */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="p-3.5 rounded-l-xl">Nome</th>
                <th className="p-3.5">E-mail</th>
                <th className="p-3.5">Data de Cadastro</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 rounded-r-xl text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLeads.length > 0 ? (
                filteredLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white font-['Outfit']">
                      {lead.name || 'Leitor(a)'}
                    </td>
                    <td className="p-3.5 font-mono text-blue-600 dark:text-blue-400">
                      {lead.email}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {new Date(lead.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          lead.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {lead.status === 'delivered' ? 'Download Realizado' : 'Aguardando Liberação'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remover lead ${lead.email}?`)) {
                            deleteCapturedLead(lead.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition-all cursor-pointer"
                        title="Remover lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                    Nenhum lead encontrado com os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
