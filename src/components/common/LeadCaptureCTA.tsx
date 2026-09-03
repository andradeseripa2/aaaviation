import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import {
  FileCheck2,
  CheckCircle2,
  ShieldCheck,
  Download,
  BookOpen,
  Clock,
  Sparkles,
  AlertCircle,
  FileText,
  Mail,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { INITIAL_LEAD_MATERIAL_CONFIG } from '../../types';

interface LeadCaptureCTAProps {
  postTitle?: string;
  category?: string;
}

export const LeadCaptureCTA: React.FC<LeadCaptureCTAProps> = ({ postTitle }) => {
  const { leadMaterialConfig = INITIAL_LEAD_MATERIAL_CONFIG, captureLead } = useBlog();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    isDraft: boolean;
    message: string;
    userName: string;
  } | null>(null);

  const config = leadMaterialConfig || INITIAL_LEAD_MATERIAL_CONFIG;
  const isDraftState = config.status === 'draft' || !config.fileUrl;

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);

    const result = await captureLead(name.trim(), email.trim(), postTitle);
    setIsSubmitting(false);

    setSubmissionResult({
      success: result.success,
      isDraft: result.isDraft,
      message: result.message,
      userName: name.trim() || 'Comandante / Especialista'
    });
  };

  const handleResetForm = () => {
    setSubmissionResult(null);
    setEmail('');
    setName('');
  };

  return (
    <aside
      aria-label="Material Técnico Educacional SGSO"
      className="my-10 overflow-hidden rounded-3xl border border-blue-200 dark:border-blue-900/60 bg-linear-to-br from-white via-blue-50/40 to-slate-50 dark:from-[#0B1528] dark:via-[#0E1B33] dark:to-[#070F1E] shadow-lg transition-all"
    >
      {/* Top Banner Header */}
      <div className="bg-[#0A192F] dark:bg-[#070F1E] text-white p-5 sm:p-6 border-b border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/60">
                {config.badgeText || 'Recurso Educacional Gratuito'}
              </span>
              <span className="text-xs text-blue-200 font-mono">SIPAER • RBAC</span>
              {isDraftState ? (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-900/40 px-2 py-0.5 rounded-full border border-amber-700/50">
                  <Clock className="w-3 h-3" /> Em Elaboração Técnica
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded-full border border-emerald-700/50">
                  <CheckCircle2 className="w-3 h-3" /> Disponível para Download
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold font-['Outfit'] text-white mt-0.5">
              Material Técnico & Segurança de Voo
            </h3>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-900/40 border border-blue-800/50 text-blue-200 text-xs font-mono">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{config.fileName ? config.fileName.split('.').pop()?.toUpperCase() : 'Guia Prático PDF'}</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-6 sm:p-8">
        {/* CASE A: SUBMISSION SUCCESS (DRAFT OR PUBLISHED) */}
        {submissionResult && submissionResult.success ? (
          <div className="animate-in fade-in zoom-in-95 duration-300 space-y-6">
            {submissionResult.isDraft ? (
              /* DRAFT / UNDER CONSTRUCTION CONFIRMATION */
              <div className="p-6 sm:p-8 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 bg-amber-200/80 dark:bg-amber-900/50 px-2.5 py-0.5 rounded-full mb-1">
                      Cadastro Prioritário Confirmado
                    </span>
                    <h4 className="text-lg font-bold font-['Outfit'] text-amber-950 dark:text-amber-100">
                      Material em Fase Final de Elaboração Técnica
                    </h4>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-amber-200/80 dark:border-amber-900/40 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Olá, {submissionResult.userName}!
                  </p>
                  <p>
                    {submissionResult.message}
                  </p>
                  <div className="flex items-center gap-2 pt-2 text-xs text-amber-800 dark:text-amber-300 font-medium">
                    <Sparkles className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Seu e-mail está registrado na lista prioritária de envio direto da equipe técnica.</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Alexandre Andrade • Segurança de Voo SIPAER
                  </span>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs font-bold text-[#0047AB] dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Cadastrar outro e-mail
                  </button>
                </div>
              </div>
            ) : (
              /* PUBLISHED / INSTANT DOWNLOAD AVAILABLE */
              <div className="p-6 sm:p-8 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 bg-emerald-200/80 dark:bg-emerald-900/50 px-2.5 py-0.5 rounded-full mb-1">
                        Download Liberado
                      </span>
                      <h4 className="text-lg font-bold font-['Outfit'] text-emerald-950 dark:text-emerald-100">
                        Checklist Homologado e Pronto para Download
                      </h4>
                    </div>
                  </div>

                  {config.fileUrl && (
                    <a
                      href={config.fileUrl}
                      download={config.fileName || 'Checklist_Auditoria_SGSO.pdf'}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold font-['Outfit'] shadow-md transition-all cursor-pointer shrink-0 uppercase tracking-wider"
                    >
                      <Download className="w-4 h-4" />
                      <span>Baixar Arquivo Agora ({config.fileName || 'Checklist SGSO'})</span>
                    </a>
                  )}
                </div>

                {/* Author's Technical Letter (Markdown) */}
                {config.emailBodyMarkdown && (
                  <div className="p-5 sm:p-6 bg-white dark:bg-[#0B1528] rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 font-mono">
                      <Mail className="w-4 h-4 text-emerald-600" />
                      <span>Nota do Autor & Doutrina Operacional:</span>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {config.emailBodyMarkdown.replace(/\{\{nome\}\}/g, submissionResult.userName)}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Tamanho do arquivo: {config.fileSize || '1.8 MB'} • Formato técnico
                  </span>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer"
                  >
                    Voltar ao formulário
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* CASE B: DEFAULT LEAD CAPTURE FORM */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center gap-2 text-[#1D4ED8] dark:text-blue-400">
                <FileCheck2 className="w-5 h-5" />
                <h4 className="font-extrabold text-lg sm:text-xl font-['Outfit'] text-[#0A192F] dark:text-white">
                  {config.title || 'Baixe o Checklist de Auditoria & Segurança SGSO'}
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-[#475569] dark:text-slate-300 leading-relaxed">
                {config.subtitle ||
                  'Planilha técnica educativa e guia de verificação rápida com os pilares recomendados da ANAC/OACI para estudos de conformidade e padronização.'}
              </p>

              {/* Bullet Points */}
              <ul className="space-y-1.5 text-xs text-[#334155] dark:text-slate-300 font-medium pt-1">
                {(config.bulletPoints && config.bulletPoints.length > 0
                  ? config.bulletPoints
                  : [
                      'Itens críticos de pré-voo, hangaragem e rotinas técnicas',
                      'Matriz de Risco Operacional com base na doutrina SIPAER',
                      'Formato PDF e XLSX editável para fins educacionais'
                    ]
                ).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Status Note */}
              <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                {isDraftState ? (
                  <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    Material em fase de revisão final técnica. Cadastre-se para receber em primeira mão.
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Material homologado e liberado para download imediato.
                  </span>
                )}
              </div>
            </div>

            <div className="lg:col-span-6 bg-white dark:bg-[#0B1528] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <form onSubmit={handleSubmitLead} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#0A192F] dark:text-slate-200 mb-1 font-['Outfit']">
                    Seu Nome Completo
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Carlos Mendes"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A192F] dark:text-slate-200 mb-1 font-['Outfit']">
                    Seu E-mail Profissional *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="carlos@exemplo.com"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[44px] py-2.5 px-4 bg-[#0A192F] dark:bg-blue-600 hover:bg-[#0E2954] dark:hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 font-['Outfit'] cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processando Acesso...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>{isDraftState ? 'Receber em Primeira Mão' : 'Baixar Material Gratuito'}</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-[#64748B] dark:text-slate-400 pt-1">
                  🔒 Seus dados estão seguros. Sem spam. Cancele quando quiser.
                </p>
              </form>

              {submissionResult && !submissionResult.success && (
                <div className="mt-3 p-3 rounded-xl text-xs font-medium flex items-start gap-2 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{submissionResult.message}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
