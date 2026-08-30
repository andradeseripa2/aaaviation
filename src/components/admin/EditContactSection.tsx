import React, { useState, useEffect } from 'react';
import { useBlog } from '../../context/BlogContext';
import { ContactInfoData } from '../../types';
import {
  Mail,
  Phone,
  Linkedin,
  Instagram,
  MapPin,
  Clock,
  Save,
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

export const EditContactSection: React.FC = () => {
  const { contactInfo, updateContactInfo, resetContactInfo, navigate } = useBlog();

  const [formData, setFormData] = useState<ContactInfoData>(contactInfo);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    if (contactInfo) {
      setFormData(contactInfo);
    }
  }, [contactInfo]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      await updateContactInfo(formData);
      setFeedback({
        type: 'success',
        message: 'Informações de contato e redes sociais atualizadas com sucesso!'
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Erro ao salvar alterações. Tente novamente.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmReset = async () => {
    setIsSaving(true);
    setShowResetModal(false);
    await resetContactInfo();
    setIsSaving(false);
    setFeedback({
      type: 'success',
      message: 'Configurações de contato restauradas para o padrão!'
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Helper to extract clean digits for WhatsApp
  const cleanPhone = formData.phoneWhatsapp.replace(/\D/g, '');
  const waTestUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone}?text=${encodeURIComponent(
        'Olá! Teste de integração do WhatsApp pelo Blog de Aviação.'
      )}`
    : '';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-[#070F1E] rounded-3xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#EFF6FF] dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-400 text-xs font-bold font-['Outfit'] uppercase tracking-wider mb-2">
            <Smartphone className="w-3.5 h-3.5" />
            Canais de Atendimento & Redes
          </div>
          <h2 className="text-2xl font-black text-[#0A192F] dark:text-white font-['Outfit']">
            Gerenciador de Contato & Redes Sociais
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1">
            Configure seu número de WhatsApp, LinkedIn, Instagram e e-mail exibidos no portal e na página de contato.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('contact')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Ver Página de Contato</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* SEÇÃO 1: WHATSAPP E MENSAGENS DIRETAS */}
        <div className="bg-white dark:bg-[#070F1E] rounded-3xl border border-[#E2E8F0] dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-[#F1F5F9] dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit']">
                1. WhatsApp Oficial & Redirecionamento de Mensagens
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Quando o visitante enviar uma mensagem na área de contato, o sistema irá direcioná-lo diretamente para este WhatsApp.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
                Número de Telefone / WhatsApp (Com DDD e Código do País) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.phoneWhatsapp}
                  onChange={e => setFormData({ ...formData, phoneWhatsapp: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: 5511999999999 ou (11) 99999-9999"
                  required
                />
                <div className="absolute left-3.5 top-3.5 text-emerald-600 dark:text-emerald-400">
                  <Phone className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Recomendamos inserir com o DDD (Ex: 11987654321 ou 5511987654321). O sistema formata automaticamente para link do WhatsApp (wa.me).
              </p>
            </div>

            <div className="md:col-span-4 flex flex-col justify-end">
              {waTestUrl ? (
                <a
                  href={waTestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  <Phone className="w-4 h-4" />
                  <span>Testar Link do WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <div className="text-xs text-slate-400 italic py-3 text-center border border-dashed rounded-xl border-slate-300 dark:border-slate-700">
                  Insira o número para testar
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: REDES SOCIAIS (LINKEDIN & INSTAGRAM) */}
        <div className="bg-white dark:bg-[#070F1E] rounded-3xl border border-[#E2E8F0] dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-[#F1F5F9] dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Linkedin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit']">
                2. Redes Profissionais (LinkedIn & Instagram)
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Links oficiais aplicados nos botões do rodapé, página de contato e cartões do autor.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LinkedIn */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0A66C2] dark:text-blue-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Linkedin className="w-4 h-4" />
                  Perfil do LinkedIn
                </label>
                {formData.linkedinUrl && (
                  <a
                    href={formData.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>Abrir Perfil</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="url"
                value={formData.linkedinUrl}
                onChange={e => setFormData({ ...formData, linkedinUrl: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0A66C2]"
                placeholder="https://www.linkedin.com/in/seu-perfil"
              />
              <p className="text-[11px] text-slate-500">
                Ex: https://www.linkedin.com/in/alexandre-andrade-389360144/
              </p>
            </div>

            {/* Instagram */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Instagram className="w-4 h-4" />
                  Perfil do Instagram
                </label>
                {formData.instagramUrl && (
                  <a
                    href={formData.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>Abrir Perfil</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="url"
                value={formData.instagramUrl}
                onChange={e => setFormData({ ...formData, instagramUrl: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                placeholder="https://www.instagram.com/seu.usuario"
              />
              <p className="text-[11px] text-slate-500">
                Ex: https://www.instagram.com/alexandre.andrade
              </p>
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: E-MAIL E INFORMAÇÕES DE ATENDIMENTO */}
        <div className="bg-white dark:bg-[#070F1E] rounded-3xl border border-[#E2E8F0] dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-[#F1F5F9] dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit']">
                3. E-mail Institucional & Localização
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Informações de suporte corporativo exibidas no card principal da página de contato.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
                E-mail Principal *
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  placeholder="andradeseripa2@gmail.com"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
                Localização / Base Operacional
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  placeholder="Brasil • Atuação Nacional"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
                Tempo Médio de Resposta
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.responseTime}
                  onChange={e => setFormData({ ...formData, responseTime: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  placeholder="Resposta média em até 24h úteis"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-[#070F1E] rounded-3xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Valores Padrão</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-[#1D4ED8] hover:bg-blue-700 text-white text-sm font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50 font-['Outfit']"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando Alterações...' : 'Salvar Alterações de Contato'}</span>
          </button>
        </div>
      </form>

      {/* CONFIRM RESET MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0B1528] rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/50">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold font-['Outfit'] text-slate-900 dark:text-white">
                Restaurar Contato Padrão?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Tem certeza que deseja restaurar as informações de contato originais? Suas alterações salvas serão substituídas pelos dados técnicos padrão.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Sim, Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
