import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { INITIAL_CONTACT_INFO } from '../../data/seedData';
import {
  Mail,
  Send,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  MapPin,
  Linkedin,
  Instagram,
  Clock,
  Phone,
  ExternalLink,
  MessageCircle,
  Inbox
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { sendContactMessage, contactInfo } = useBlog();

  const info = contactInfo || INITIAL_CONTACT_INFO;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Consultoria Técnica / MRO',
    message: ''
  });
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to format clean digits for WhatsApp URL
  const formatWhatsAppNumber = (phoneStr?: string) => {
    if (!phoneStr) return '5511999999999';
    const digits = phoneStr.replace(/\D/g, '');
    if (!digits) return '5511999999999';
    if (digits.length <= 11 && !digits.startsWith('55')) {
      return `55${digits}`;
    }
    return digits;
  };

  const rawPhone = info.phoneWhatsapp || '5511999999999';
  const cleanPhone = formatWhatsAppNumber(rawPhone);

  const directWhatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    'Olá Alexandre! Gostaria de conversar sobre consultoria e segurança de voo.'
  )}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    // Save contact message in Firestore / Administrator Inbox
    const res = await sendContactMessage(
      formData.name,
      formData.email,
      formData.subject,
      formData.message
    );

    if (res.success) {
      setStatus({
        success: true,
        message: 'Sua mensagem foi enviada com sucesso para a caixa de entrada do Administrador!'
      });
      setFormData({
        name: '',
        email: '',
        subject: 'Consultoria Técnica / MRO',
        message: ''
      });
    } else {
      setStatus({
        success: false,
        message: res.message || 'Erro ao enviar mensagem. Tente novamente.'
      });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-300">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-400 text-xs font-bold font-['Outfit'] uppercase tracking-wider mb-3">
          <MessageSquare className="w-3.5 h-3.5" />
          Consultoria, Treinamentos & Contato
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0A192F] dark:text-white font-['Outfit'] tracking-tight">
          Consultoria Técnica & Palestras
        </h1>
        <p className="text-sm sm:text-base text-[#64748B] dark:text-slate-400 mt-3 leading-relaxed">
          Atendimento especializado para operadores executivos, companhias aéreas, oficinas homologadas RBAC 145 e instituições de ensino aeronáutico em todo o Brasil.
        </p>
      </div>

      {/* Services Grid Showcase */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#070F1E] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-[#0A192F] dark:text-white font-['Outfit']">
            Auditorias SGSO & RBAC
          </h4>
          <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
            Diagnóstico de conformidade, matriz de risco operacional e preparação para inspeções da ANAC.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#070F1E] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-400 flex items-center justify-center">
            <MessageCircle className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-[#0A192F] dark:text-white font-['Outfit']">
            Palestras CRM & MRM
          </h4>
          <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
            Treinamentos em Fatores Humanos, comunicação em cabine e manutenção, gestão de fadiga e Cultura Justa.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#070F1E] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-[#0A192F] dark:text-white font-['Outfit']">
            Consultoria em MRO
          </h4>
          <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
            Otimização de processos de manutenção, confiabilidade, rotinas de boroscopia e controle técnico.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#070F1E] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-400 flex items-center justify-center">
            <Inbox className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-[#0A192F] dark:text-white font-['Outfit']">
            Apoio Técnico & Pareceres
          </h4>
          <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
            Pareceres técnicos em aeronavegabilidade continuada e doutrina de prevenção SIPAER.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Direct Info & Social Channels (Titles only, no raw URLs) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 sm:p-8 bg-[#0A192F] text-white rounded-3xl shadow-lg space-y-6">
            <div>
              <h3 className="text-xl font-bold font-['Outfit']">Alexandre Andrade</h3>
              <p className="text-xs text-[#93C5FD] font-mono mt-0.5">Especialista em Manutenção & Investigador SIPAER</p>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm text-slate-300">
              {/* WhatsApp Item */}
              {info.phoneWhatsapp && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/40">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-900/60 text-emerald-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-emerald-300 font-['Outfit']">WhatsApp</span>
                  </div>
                  <a
                    href={directWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                  >
                    <span>Conversar</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* LinkedIn Item */}
              {info.linkedinUrl && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-950/40 border border-blue-800/40">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#0A66C2]/30 text-[#60A5FA]">
                      <Linkedin className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-blue-300 font-['Outfit']">LinkedIn</span>
                  </div>
                  <a
                    href={info.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0A66C2] hover:bg-blue-600 text-white font-bold text-xs transition-colors"
                  >
                    <span>Acessar Perfil</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Instagram Item */}
              {info.instagramUrl && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-pink-950/30 border border-pink-800/40">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-pink-900/40 text-pink-400">
                      <Instagram className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-pink-300 font-['Outfit']">Instagram</span>
                  </div>
                  <a
                    href={info.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-white font-bold text-xs transition-opacity"
                  >
                    <span>Acessar Perfil</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* E-mail */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="p-2 rounded-xl bg-slate-800 text-[#93C5FD]">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">E-mail</div>
                  <a
                    href={`mailto:${info.email || 'andradeseripa2@gmail.com'}`}
                    className="hover:text-white transition-colors truncate block text-xs"
                    title="Enviar e-mail"
                  >
                    {info.email || 'andradeseripa2@gmail.com'}
                  </a>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="p-2 rounded-xl bg-slate-800 text-[#93C5FD]">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Localização</div>
                  <span className="text-xs">{info.location || 'Brasil • Atuação Nacional'}</span>
                </div>
              </div>

              {/* Response Time */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="p-2 rounded-xl bg-slate-800 text-[#93C5FD]">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Atendimento</div>
                  <span className="text-xs">{info.responseTime || 'Resposta média em até 24h úteis'}</span>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Call to Action on the Left Side */}
            <div className="pt-2">
              <a
                href={directWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all font-['Outfit']"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Conversar no WhatsApp Agora</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-[#93C5FD] shrink-0" />
                <span>Sigilo profissional e conformidade regulatória</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Form that Sends Directly to Admin Inbox */}
        <div className="lg:col-span-7">
          <div className="p-6 sm:p-8 bg-white dark:bg-[#070F1E] rounded-3xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-[#0A192F] dark:text-white font-['Outfit']">
                  Envie sua Mensagem
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Preencha o formulário para enviar sua mensagem diretamente para o painel do autor.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-400 text-xs font-bold font-['Outfit']">
                <Inbox className="w-3.5 h-3.5" />
                <span>Painel Administrativo</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 uppercase tracking-wider mb-1.5 font-['Outfit']">
                  Seu Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Carlos Eduardo Silveira"
                  className="w-full px-4 py-3 text-sm bg-[#F8FAFC] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 uppercase tracking-wider mb-1.5 font-['Outfit']">
                  Seu E-mail Corporativo ou Pessoal *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: carlos@empresa.com.br"
                  className="w-full px-4 py-3 text-sm bg-[#F8FAFC] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 uppercase tracking-wider mb-1.5 font-['Outfit']">
                  Assunto da Mensagem
                </label>
                <select
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 text-sm bg-[#F8FAFC] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954]"
                >
                  <option value="Consultoria Técnica / MRO">Consultoria Técnica / MRO</option>
                  <option value="Palestras & Treinamentos SIPAER">Palestras & Treinamentos SIPAER</option>
                  <option value="Dúvida Técnica sobre Artigo">Dúvida Técnica sobre Artigo</option>
                  <option value="Sugestão de Pauta / Conteúdo">Sugestão de Pauta / Conteúdo</option>
                  <option value="Imprensa / Outros">Imprensa / Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 uppercase tracking-wider mb-1.5 font-['Outfit']">
                  Mensagem Detalhada *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Descreva o contexto, objetivos da consultoria ou sua pergunta..."
                  className="w-full p-4 text-sm bg-[#F8FAFC] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 bg-[#0A192F] hover:bg-[#0E2954] text-white font-bold text-sm tracking-wider uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-2 font-['Outfit'] cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Enviando Mensagem...' : 'Enviar Mensagem'}</span>
              </button>
            </form>

            {status && (
              <div
                className={`mt-4 p-4 rounded-xl flex items-center gap-3 text-xs font-medium ${
                  status.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {status.success && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
                <span>{status.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
