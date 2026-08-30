import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import {
  FileCheck2,
  Mail,
  Send,
  CheckCircle2,
  PhoneCall,
  ShieldCheck,
  Award,
  ArrowRight,
  Download,
  Sparkles
} from 'lucide-react';

interface LeadCaptureCTAProps {
  postTitle?: string;
  category?: string;
}

export const LeadCaptureCTA: React.FC<LeadCaptureCTAProps> = ({ postTitle, category }) => {
  const { subscribeNewsletter, navigate, contactInfo } = useBlog();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'checklist' | 'consultoria'>('checklist');

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setStatus(null);

    // Save lead subscriber to database with metadata
    const res = await subscribeNewsletter(email.trim());
    setIsSubmitting(false);

    if (res.success) {
      setStatus({
        success: true,
        message: 'Material liberado! Enviamos a confirmação e o link de download para seu e-mail.'
      });
      setEmail('');
      setName('');
    } else {
      setStatus({
        success: false,
        message: res.message || 'Erro ao processar cadastro. Tente novamente.'
      });
    }
  };

  const whatsappPhone = contactInfo?.phoneWhatsapp?.replace(/\D/g, '') || '5511999999999';
  const whatsappConsultoriaUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
    `Olá Alexandre! Li o artigo "${postTitle || 'no blog'}" e gostaria de solicitar uma proposta de consultoria técnica / treinamento corporativo.`
  )}`;

  return (
    <aside
      aria-label="Material Técnico e Consultoria Especializada"
      className="my-10 overflow-hidden rounded-3xl border border-blue-200 dark:border-blue-900/60 bg-linear-to-br from-white via-blue-50/40 to-slate-50 dark:from-[#0B1528] dark:via-[#0E1B33] dark:to-[#070F1E] shadow-lg"
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
                Recurso Profissional
              </span>
              <span className="text-xs text-blue-200 font-mono">SIPAER • RBAC</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold font-['Outfit'] text-white mt-0.5">
              Próximos Passos Operacionais & Segurança de Voo
            </h3>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#070F1E] p-1 rounded-xl border border-blue-900/80 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('checklist');
              setStatus(null);
            }}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold font-['Outfit'] transition-all cursor-pointer ${
              activeTab === 'checklist'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Checklist Técnico (Grátis)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('consultoria');
              setStatus(null);
            }}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold font-['Outfit'] transition-all cursor-pointer ${
              activeTab === 'consultoria'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Consultoria & Treinamento
          </button>
        </div>
      </div>

      {/* Tab 1: Checklist & Technical Kit Download */}
      {activeTab === 'checklist' && (
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center gap-2 text-[#1D4ED8] dark:text-blue-400">
                <FileCheck2 className="w-5 h-5" />
                <h4 className="font-extrabold text-lg sm:text-xl font-['Outfit'] text-[#0A192F] dark:text-white">
                  Baixe o Checklist de Auditoria & Segurança SGSO
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-[#475569] dark:text-slate-300 leading-relaxed">
                Planilha técnica executiva e guia de verificação rápida com os 12 pilares mandatórios da ANAC/OACI para oficinas homologadas RBAC 145 e operadores RBAC 91/135.
              </p>
              <ul className="space-y-1.5 text-xs text-[#334155] dark:text-slate-300 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Itens críticos de pré-voo, hangaragem e boroscopia</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Matriz de Risco Operacional com base na doutrina SIPAER</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Formato PDF e XLSX editável para uso imediato</span>
                </li>
              </ul>
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
                    placeholder="Ex: Inspetor Carlos Mendes"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A192F] dark:text-slate-200 mb-1 font-['Outfit']">
                    Seu Melhor E-mail Corporativo *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="carlos@operador.com.br"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[44px] py-2.5 px-4 bg-[#0A192F] dark:bg-blue-600 hover:bg-[#0E2954] dark:hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 font-['Outfit'] cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isSubmitting ? 'Gerando Acesso...' : 'Baixar Material Gratuito'}</span>
                </button>

                <p className="text-[11px] text-center text-[#64748B] dark:text-slate-400 pt-1">
                  🔒 Seus dados estão seguros. Sem spam. Cancele quando quiser.
                </p>
              </form>

              {status && (
                <div
                  className={`mt-3 p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
                    status.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {status.success && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />}
                  <span>{status.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Direct Consulting & Corporate Lectures */}
      {activeTab === 'consultoria' && (
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center gap-2 text-[#1D4ED8] dark:text-blue-400">
                <Award className="w-5 h-5 text-amber-500" />
                <h4 className="font-extrabold text-lg sm:text-xl font-['Outfit'] text-[#0A192F] dark:text-white">
                  Consultoria Especializada & Palestras com Alexandre Andrade
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-[#475569] dark:text-slate-300 leading-relaxed">
                Leve para o seu hangar, oficina ou empresa aérea uma avaliação independente de conformidade técnica e cultura de segurança:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#334155] dark:text-slate-300">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <strong className="text-[#0A192F] dark:text-white block font-['Outfit']">Auditorias SGSO & RBAC</strong>
                  <span className="text-[#64748B] dark:text-slate-400 text-[11px]">Diagnóstico e preparação para inspeções ANAC</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <strong className="text-[#0A192F] dark:text-white block font-['Outfit']">Palestras & CRM / MRM</strong>
                  <span className="text-[#64748B] dark:text-slate-400 text-[11px]">Fatores Humanos, Fadiga e Cultura Justa</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-3">
              <a
                href={whatsappConsultoriaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold font-['Outfit'] flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Conversar pelo WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => navigate('contact')}
                className="min-h-[44px] px-5 py-3 rounded-xl bg-[#0A192F] dark:bg-blue-600 hover:bg-[#0E2954] dark:hover:bg-blue-500 text-white text-xs sm:text-sm font-bold font-['Outfit'] flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span>Solicitar Proposta Formal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
