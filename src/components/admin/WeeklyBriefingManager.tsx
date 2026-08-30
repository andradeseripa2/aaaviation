import React, { useState, useEffect, useMemo } from 'react';
import { useBlog } from '../../context/BlogContext';
import { useAuth } from '../../context/AuthContext';
import { Post, BriefingCampaign, NewsletterSubscriber } from '../../types';
import { generateBriefingHtml } from '../../lib/emailTemplate';
import { CoverImage } from '../common/CoverImage';
import {
  Mail,
  Send,
  Sparkles,
  Users,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Plus,
  Download,
  Search,
  ExternalLink,
  Smartphone,
  Monitor,
  RefreshCw,
  FileCheck,
  ShieldCheck,
  Zap,
  Info,
  History,
  Copy,
  ChevronRight,
  Loader2,
  Calendar
} from 'lucide-react';

export const WeeklyBriefingManager: React.FC = () => {
  const { user } = useAuth();
  const {
    posts,
    newsletterSubscribers,
    briefingCampaigns,
    saveBriefingCampaign,
    deleteBriefingCampaign,
    removeNewsletterSubscriber,
    addManualSubscriber
  } = useBlog();

  // Active sub-tab inside the Briefing Manager
  const [activeSubTab, setActiveSubTab] = useState<'composer' | 'preview' | 'subscribers' | 'history' | 'settings'>('composer');

  // Preview device mode
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Campaign Form State
  const [editionNumber, setEditionNumber] = useState(`Edição #${briefingCampaigns.length + 1}`);
  const [editionDate, setEditionDate] = useState(() =>
    new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  );
  const [subject, setSubject] = useState(`Briefing Semanal #${briefingCampaigns.length + 1}: Destaques Técnicos & Segurança`);
  const [preheader, setPreheader] = useState('Confira as principais atualizações em manutenção aeronáutica e segurança de voo.');
  const [editorGreeting, setEditorGreeting] = useState('Prezados aviadores, mecânicos e especialistas em aviação,');
  const [customMessage, setCustomMessage] = useState(
    'Nesta edição do Briefing Semanal, trazemos análises aprofundadas sobre manutenção, conformidade regulatória e cultura SIPAER para fortalecer as melhores práticas na aviação.'
  );
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>(() => {
    // Default to first 3 published posts
    return posts.filter(p => p.published).slice(0, 3).map(p => p.id);
  });

  // Scheduling State
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [isSchedulingCampaign, setIsSchedulingCampaign] = useState(false);

  // Test & Dispatch States
  const [testEmail, setTestEmail] = useState(user?.email || 'andradeseripa2@gmail.com');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSendingMass, setIsSendingMass] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Subscribers Management State
  const [subSearch, setSubSearch] = useState('');
  const [newSubEmail, setNewSubEmail] = useState('');
  const [isAddingSub, setIsAddingSub] = useState(false);

  // Server health status (checks if RESEND_API_KEY is configured)
  const [serverStatus, setServerStatus] = useState<{ resendConfigured: boolean; geminiConfigured: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setServerStatus(data))
      .catch(() => setServerStatus({ resendConfigured: false, geminiConfigured: true }));
  }, []);

  // Auto-calculate next edition helper
  const handleAutoSuggestEdition = () => {
    const nextCount = briefingCampaigns.length + 1;
    const nextLabel = `Edição #${nextCount}`;
    const todayStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    setEditionNumber(nextLabel);
    setEditionDate(todayStr);
    setSubject(`Briefing Semanal #${nextCount}: Destaques Técnicos & Segurança`);
    setFeedback({ type: 'info', text: `Edição configurada para #${nextCount} com a data atual.` });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Filtered posts for selection
  const publishedPosts = useMemo(() => posts.filter(p => p.published), [posts]);
  const selectedPosts = useMemo(() => {
    return posts.filter(p => selectedPostIds.includes(p.id));
  }, [posts, selectedPostIds]);

  // Generated Email HTML
  const emailHtml = useMemo(() => {
    return generateBriefingHtml({
      subject,
      preheader,
      editorGreeting,
      customMessage,
      posts: selectedPosts,
      appUrl: window.location.origin || 'https://aaaviation.com.br',
      editionNumber: editionNumber || `Edição #${briefingCampaigns.length + 1}`,
      dateStr: editionDate
    });
  }, [subject, preheader, editorGreeting, customMessage, selectedPosts, editionNumber, editionDate, briefingCampaigns.length]);

  // Toggle post selection
  const togglePostSelection = (postId: string) => {
    setSelectedPostIds(prev =>
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const selectRecentPosts = (count: number) => {
    const recent = publishedPosts.slice(0, count).map(p => p.id);
    setSelectedPostIds(recent);
  };

  // Generate Intro with Gemini AI
  const handleGenerateWithAi = async () => {
    if (selectedPosts.length === 0) {
      setFeedback({ type: 'error', text: 'Selecione pelo menos um artigo para a IA sintetizar o briefing.' });
      return;
    }

    setIsGeneratingAi(true);
    setFeedback({ type: 'info', text: 'Gerando mensagem editorial técnica com inteligência artificial...' });

    try {
      const resp = await fetch('/api/briefing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: selectedPosts.map(p => ({
            title: p.title,
            category: p.category,
            technicalBadge: p.technicalBadge
          })),
          authorName: 'Alexandre Andrade',
          themeFocus: 'Manutenção Aeronáutica e Cultura de Segurança SIPAER'
        })
      });

      const data = await resp.json();
      if (data.success && data.generatedIntro) {
        setCustomMessage(data.generatedIntro);
        setFeedback({ type: 'success', text: 'Mensagem editorial gerada com sucesso pelo Gemini!' });
      } else {
        setFeedback({ type: 'error', text: data.error || 'Não foi possível gerar com IA.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Falha de conexão com o gerador.' });
    } finally {
      setIsGeneratingAi(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  // Send Single Test Email
  const handleSendTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      setFeedback({ type: 'error', text: 'Informe um e-mail de teste válido.' });
      return;
    }

    setIsSendingTest(true);
    setFeedback({ type: 'info', text: `Enviando e-mail de teste para ${testEmail}...` });

    try {
      const resp = await fetch('/api/briefing/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: [{ email: testEmail }],
          subject: `[TESTE] ${subject}`,
          htmlContent: emailHtml,
          testMode: true
        })
      });

      const data = await resp.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          text: `Teste enviado para ${testEmail}! ${data.simulated ? '(Modo Demonstração ativo)' : '(Enviado via Resend)'}`
        });
      } else {
        setFeedback({ type: 'error', text: data.error || 'Erro ao enviar teste.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Erro na requisição de envio de teste.' });
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  // Dispatch Mass Briefing to All Subscribers
  const handleSendMassBriefing = async () => {
    if (newsletterSubscribers.length === 0) {
      setFeedback({ type: 'error', text: 'Não há assinantes cadastrados na lista para envio.' });
      setShowConfirmModal(false);
      return;
    }

    setIsSendingMass(true);
    setShowConfirmModal(false);
    setFeedback({ type: 'info', text: `Iniciando disparo para ${newsletterSubscribers.length} assinante(s)...` });

    const campaignId = `camp-${Date.now()}`;
    const newCampaign: BriefingCampaign = {
      id: campaignId,
      subject,
      preheader,
      editorGreeting,
      customMessage,
      featuredPostIds: selectedPostIds,
      editionNumber: editionNumber || `Edição #${briefingCampaigns.length + 1}`,
      dateStr: editionDate,
      status: 'sending',
      recipientCount: newsletterSubscribers.length,
      successCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: user?.name || 'Alexandre Andrade'
    };

    await saveBriefingCampaign(newCampaign);

    try {
      const resp = await fetch('/api/briefing/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: newsletterSubscribers.map(s => ({ email: s.email, id: s.id })),
          subject,
          htmlContent: emailHtml,
          testMode: false
        })
      });

      const data = await resp.json();

      const finishedCampaign: BriefingCampaign = {
        ...newCampaign,
        status: data.success ? 'sent' : 'failed',
        sentAt: new Date().toISOString(),
        successCount: data.successCount || 0,
        errorLog: data.errors ? data.errors.join('\n') : undefined
      };

      await saveBriefingCampaign(finishedCampaign);

      if (data.success) {
        setFeedback({
          type: 'success',
          text: `Briefing Semanal disparado com sucesso para ${data.successCount} assinante(s)!`
        });
      } else {
        setFeedback({
          type: 'error',
          text: data.error || 'Houve falhas no disparo do briefing.'
        });
      }
    } catch (err: any) {
      console.error('Error dispatching briefing:', err);
      setFeedback({ type: 'error', text: err?.message || 'Falha de comunicação no envio do briefing.' });
    } finally {
      setIsSendingMass(false);
      setTimeout(() => setFeedback(null), 8000);
    }
  };

  // Schedule Briefing Campaign for Future Time
  const handleScheduleBriefing = async () => {
    if (!scheduledDateTime) {
      setFeedback({ type: 'error', text: 'Selecione a data e o horário para o agendamento do briefing.' });
      return;
    }

    const scheduledDateObj = new Date(scheduledDateTime);
    if (isNaN(scheduledDateObj.getTime())) {
      setFeedback({ type: 'error', text: 'Data de agendamento inválida.' });
      return;
    }

    setIsSchedulingCampaign(true);
    const campaignId = `camp-sched-${Date.now()}`;
    const newCampaign: BriefingCampaign = {
      id: campaignId,
      subject,
      preheader,
      editorGreeting,
      customMessage,
      featuredPostIds: selectedPostIds,
      editionNumber: editionNumber || `Edição #${briefingCampaigns.length + 1}`,
      dateStr: editionDate,
      status: 'scheduled',
      scheduledFor: scheduledDateObj.toISOString(),
      recipientCount: newsletterSubscribers.length,
      successCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: user?.name || 'Alexandre Andrade'
    };

    try {
      await saveBriefingCampaign(newCampaign);
      setFeedback({
        type: 'success',
        text: `Briefing agendado com sucesso para ${scheduledDateObj.toLocaleString('pt-BR')}! O sistema disparará automaticamente no horário previsto.`
      });
      setIsScheduled(false);
      setScheduledDateTime('');
      setActiveSubTab('history');
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Erro ao salvar agendamento do briefing.' });
    } finally {
      setIsSchedulingCampaign(false);
      setTimeout(() => setFeedback(null), 8000);
    }
  };

  // Add manual subscriber
  const handleAddManualSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubEmail) return;
    setIsAddingSub(true);
    const res = await addManualSubscriber(newSubEmail);
    if (res.success) {
      setNewSubEmail('');
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setIsAddingSub(false);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Export Subscribers to CSV
  const handleExportCSV = () => {
    if (newsletterSubscribers.length === 0) return;
    const csvContent = [
      'Email,Data Inscrição,Interesse',
      ...newsletterSubscribers.map(s => `"${s.email}","${s.subscribedAt}","${s.categoryInterest || 'Geral'}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `assinantes-alexandre-andrade-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered subscribers list
  const filteredSubscribers = newsletterSubscribers.filter(s =>
    s.email.toLowerCase().includes(subSearch.toLowerCase()) ||
    (s.categoryInterest && s.categoryInterest.toLowerCase().includes(subSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Status Overview */}
      <div className="bg-gradient-to-r from-[#0A192F] via-[#0E2954] to-[#1E3A8A] text-white p-6 sm:p-8 rounded-3xl shadow-md border border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-amber-500/30">
              <Zap className="w-3.5 h-3.5" /> Motor de Disparos de Briefing
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-['Outfit'] tracking-tight">
              Briefing Semanal de Aviação
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mt-1 max-w-2xl">
              Crie, personalize, gere com IA e dispare o briefing técnico semanal diretamente para a caixa de entrada dos seus leitores e aviadores.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
              <span className="text-xs text-slate-300 font-medium block">Assinantes Ativos</span>
              <span className="text-2xl font-black text-white font-['Outfit']">
                {newsletterSubscribers.length}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
              <span className="text-xs text-slate-300 font-medium block">Edições Disparadas</span>
              <span className="text-2xl font-black text-amber-400 font-['Outfit']">
                {briefingCampaigns.length}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10 flex flex-col justify-center">
              <span className="text-xs text-slate-300 font-medium block">Status do Provedor</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2.5 h-2.5 rounded-full ${serverStatus?.resendConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
                <span className="text-xs font-bold text-white">
                  {serverStatus?.resendConfigured ? 'Resend Ativo' : 'Modo Demonstração'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Feedback notification */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-sm font-medium flex items-center gap-3 transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          {feedback.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          {feedback.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          {feedback.type === 'info' && <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('composer')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
            activeSubTab === 'composer'
              ? 'bg-[#0A192F] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Send className="w-4 h-4" /> Compor & Disparar
        </button>

        <button
          onClick={() => setActiveSubTab('preview')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
            activeSubTab === 'preview'
              ? 'bg-[#0A192F] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Eye className="w-4 h-4" /> Pré-Visualização ({selectedPosts.length} Artigos)
        </button>

        <button
          onClick={() => setActiveSubTab('subscribers')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
            activeSubTab === 'subscribers'
              ? 'bg-[#0A192F] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> Assinantes ({newsletterSubscribers.length})
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
            activeSubTab === 'history'
              ? 'bg-[#0A192F] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <History className="w-4 h-4" /> Histórico de Envios ({briefingCampaigns.length})
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
            activeSubTab === 'settings'
              ? 'bg-[#0A192F] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Info className="w-4 h-4" /> Guia de Provedor & Chaves
        </button>
      </div>

      {/* ================= COMPOSER TAB ================= */}
      {activeSubTab === 'composer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form & Configuration */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Configurações do E-mail
              </h3>

              {/* Edition Number & Display Date Configuration */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Contagem da Edição & Data de Cabeçalho
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoSuggestEdition}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline self-start sm:self-auto cursor-pointer"
                  >
                    Auto-calcular Próxima (Edição #{briefingCampaigns.length + 1})
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Rótulo / Número da Edição *
                    </label>
                    <input
                      type="text"
                      value={editionNumber}
                      onChange={e => setEditionNumber(e.target.value)}
                      placeholder="Ex: Edição #1, Edição Especial"
                      className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-sm font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Data Exibida no Topo *
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditionDate(new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }))}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800"
                      >
                        Usar Hoje
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editionDate}
                      onChange={e => setEditionDate(e.target.value)}
                      placeholder="Ex: 19 de agosto de 2026"
                      className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  ℹ️ O sistema conta e sugere automaticamente a numeração com base nos briefings já disparados. Você pode alterar para qualquer número ou formato a qualquer momento.
                </p>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Assunto da Mensagem (Subject)
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Ex: Briefing Semanal #12: Boas Práticas de Manutenção e Segurança"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-medium text-slate-800"
                />
              </div>

              {/* Preheader */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Texto de Pré-Visualização (Preheader)
                </label>
                <input
                  type="text"
                  value={preheader}
                  onChange={e => setPreheader(e.target.value)}
                  placeholder="Aparece antes de abrir o e-mail na caixa de entrada..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-slate-700 text-sm"
                />
              </div>

              {/* Greeting */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Saudação Inicial
                </label>
                <input
                  type="text"
                  value={editorGreeting}
                  onChange={e => setEditorGreeting(e.target.value)}
                  placeholder="Ex: Prezados aviadores e especialistas..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-slate-700 text-sm"
                />
              </div>

              {/* Custom Editorial Message with AI Generator Button */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Mensagem Editorial do Autor
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateWithAi}
                    disabled={isGeneratingAi || selectedPosts.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isGeneratingAi ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    {isGeneratingAi ? 'Escrevendo...' : 'Gerar com IA (Gemini)'}
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  placeholder="Escreva uma breve introdução ou reflexão técnica sobre a semana..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-slate-700 text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Dica: Selecione os artigos abaixo e clique em "Gerar com IA" para obter um resumo editorial pronto.
                </p>
              </div>
            </div>

            {/* Post Selection */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
                    Artigos Técnicos da Semana ({selectedPostIds.length} selecionados)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Escolha os artigos do blog que aparecerão em destaque no e-mail.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => selectRecentPosts(3)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                  >
                    +3 Mais Recentes
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPostIds([])}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {publishedPosts.map(post => {
                  const isSelected = selectedPostIds.includes(post.id);
                  return (
                    <div
                      key={post.id}
                      onClick={() => togglePostSelection(post.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {post.coverImage ? (
                          <CoverImage
                            src={post.coverImage}
                            alt=""
                            category={post.category}
                            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                            <Mail className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="inline-block text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-100/70 px-2 py-0.5 rounded-md mb-0.5">
                            {post.category}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {post.title}
                          </h4>
                          <p className="text-xs text-slate-500 truncate">
                            {post.excerpt}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by parent div
                          className="w-5 h-5 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300 pointer-events-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Actions, Test Email & Live Summary */}
          <div className="lg:col-span-5 space-y-6">
            {/* Scheduling & Automation Card */}
            <div className="bg-white p-6 rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/50 to-white shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Agendamento Automático
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                  Automação
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Defina uma data e horário futuro para que o sistema dispare o briefing semanal automaticamente para todos os assinantes.
              </p>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={e => {
                      setIsScheduled(e.target.checked);
                      if (e.target.checked && !scheduledDateTime) {
                        const nextDate = new Date();
                        nextDate.setDate(nextDate.getDate() + 1);
                        nextDate.setHours(9, 0, 0, 0);
                        setScheduledDateTime(nextDate.toISOString().slice(0, 16));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded-sm"
                  />
                  <span>Agendar disparo para data/hora específica</span>
                </label>

                {isScheduled && (
                  <div className="pt-2 border-t border-blue-100 space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Data e Hora do Disparo *
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduledDateTime}
                        onChange={e => setScheduledDateTime(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleScheduleBriefing}
                      disabled={isSchedulingCampaign || !scheduledDateTime}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {isSchedulingCampaign ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4 text-amber-300" />}
                      <span>
                        {isSchedulingCampaign ? 'Salvando Agendamento...' : 'Salvar Agendamento do Briefing'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Test Box */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-600" />
                Enviar E-mail de Teste
              </h3>
              <p className="text-xs text-slate-600">
                Teste a formatação e visualização enviando uma cópia para seu endereço antes do disparo oficial.
              </p>

              <div>
                <input
                  type="email"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  placeholder="seu-email@dominio.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isSendingTest || !testEmail}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isSendingTest ? 'Enviando Teste...' : 'Enviar Teste para Mim'}
              </button>
            </div>

            {/* Mass Dispatch Card */}
            <div className="bg-gradient-to-br from-slate-900 to-[#0A192F] text-white p-6 rounded-3xl shadow-md border border-slate-800 space-y-5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Zap className="w-4 h-4" /> Disparo em Massa
              </div>

              <div>
                <h4 className="text-xl font-bold font-['Outfit'] text-white">
                  Pronto para enviar?
                </h4>
                <p className="text-slate-300 text-xs mt-1">
                  O e-mail será enviado para todos os <strong className="text-amber-300">{newsletterSubscribers.length} assinantes</strong> ativos da sua lista com {selectedPosts.length} artigos destacados.
                </p>
              </div>

              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Destinatários:</span>
                  <strong className="text-white">{newsletterSubscribers.length} leitores</strong>
                </div>
                <div className="flex justify-between">
                  <span>Artigos inclusos:</span>
                  <strong className="text-white">{selectedPosts.length} publicações</strong>
                </div>
                <div className="flex justify-between">
                  <span>Provedor:</span>
                  <strong className={serverStatus?.resendConfigured ? 'text-emerald-400' : 'text-blue-300'}>
                    {serverStatus?.resendConfigured ? 'Resend (API Ativa)' : 'Simulação Instantânea'}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={isSendingMass || newsletterSubscribers.length === 0}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSendingMass ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {isSendingMass ? 'Disparando Briefing...' : `Disparar para ${newsletterSubscribers.length} Assinantes`}
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('preview')}
                className="w-full py-2 bg-transparent hover:bg-white/10 text-slate-300 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" /> Abrir Pré-Visualização Completa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PREVIEW TAB ================= */}
      {activeSubTab === 'preview' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Modo de Visualização:
              </span>
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  previewDevice === 'desktop' ? 'bg-[#0A192F] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Monitor className="w-4 h-4" /> Desktop (600px)
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  previewDevice === 'mobile' ? 'bg-[#0A192F] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4" /> Celular (380px)
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isSendingTest}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" /> Enviar Teste
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={isSendingMass || newsletterSubscribers.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" /> Disparar para {newsletterSubscribers.length} Assinantes
              </button>
            </div>
          </div>

          {/* Email Preview Frame */}
          <div className="flex justify-center bg-slate-200 p-4 sm:p-8 rounded-3xl overflow-x-auto">
            <div
              className="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 border border-slate-300"
              style={{ width: previewDevice === 'desktop' ? '640px' : '390px' }}
            >
              <iframe
                title="Preview do Briefing Semanal"
                srcDoc={emailHtml}
                className="w-full h-[750px] border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= SUBSCRIBERS TAB ================= */}
      {activeSubTab === 'subscribers' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            {/* Header and Add Form */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Lista de Assinantes ({newsletterSubscribers.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  E-mails cadastrados através do portal que recebem o Briefing Semanal.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={newsletterSubscribers.length === 0}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" /> Exportar CSV
                </button>
              </div>
            </div>

            {/* Manual Add Subscriber */}
            <form onSubmit={handleAddManualSubscriber} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={newSubEmail}
                  onChange={e => setNewSubEmail(e.target.value)}
                  placeholder="Adicionar novo e-mail manualmente..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <button
                type="submit"
                disabled={isAddingSub || !newSubEmail}
                className="px-5 py-2.5 bg-[#0A192F] hover:bg-[#0E2954] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shrink-0"
              >
                {isAddingSub ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Adicionar Assinante
              </button>
            </form>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={subSearch}
                onChange={e => setSubSearch(e.target.value)}
                placeholder="Pesquisar assinante por e-mail ou categoria..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">E-mail</th>
                    <th className="p-3.5">Interesse</th>
                    <th className="p-3.5">Data de Inscrição</th>
                    <th className="p-3.5 rounded-r-xl text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubscribers.length > 0 ? (
                    filteredSubscribers.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{sub.email}</td>
                        <td className="p-3.5 text-xs text-slate-600">
                          <span className="px-2.5 py-1 bg-slate-100 rounded-md font-medium">
                            {sub.categoryInterest || 'Geral'}
                          </span>
                        </td>
                        <td className="p-3.5 text-xs text-slate-500">
                          {new Date(sub.subscribedAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => removeNewsletterSubscriber(sub.id)}
                            title="Remover Assinante"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-slate-400 text-sm">
                        Nenhum assinante encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= HISTORY TAB ================= */}
      {activeSubTab === 'history' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xl font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Histórico de Edições Enviadas ({briefingCampaigns.length})
          </h3>

          {briefingCampaigns.length > 0 ? (
            <div className="space-y-3">
              {briefingCampaigns.map(camp => (
                <div
                  key={camp.id}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {camp.editionNumber && (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200">
                          {camp.editionNumber}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          camp.status === 'sent'
                            ? 'bg-emerald-100 text-emerald-800'
                            : camp.status === 'scheduled'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : camp.status === 'failed'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {camp.status === 'sent'
                          ? 'Enviado'
                          : camp.status === 'scheduled'
                          ? 'Agendado'
                          : camp.status === 'failed'
                          ? 'Falhou'
                          : 'Processando'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {camp.status === 'scheduled' && camp.scheduledFor
                          ? `Para: ${new Date(camp.scheduledFor).toLocaleString('pt-BR')}`
                          : camp.sentAt
                          ? new Date(camp.sentAt).toLocaleString('pt-BR')
                          : new Date(camp.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{camp.subject}</h4>
                    <p className="text-xs text-slate-600 line-clamp-1">{camp.customMessage}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      {camp.dateStr && <span>Data Cabeçalho: <strong>{camp.dateStr}</strong></span>}
                      <span>Destinatários: <strong>{camp.recipientCount}</strong></span>
                      <span>Entregues: <strong className="text-emerald-700">{camp.successCount}</strong></span>
                      <span>Artigos: <strong>{camp.featuredPostIds?.length || 0}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSubject(camp.subject);
                        if (camp.editionNumber) setEditionNumber(camp.editionNumber);
                        if (camp.dateStr) setEditionDate(camp.dateStr);
                        setCustomMessage(camp.customMessage || '');
                        if (camp.featuredPostIds) setSelectedPostIds(camp.featuredPostIds);
                        setActiveSubTab('composer');
                        setFeedback({ type: 'info', text: 'Campanha carregada para o editor.' });
                      }}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" /> Reutilizar
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteBriefingCampaign(camp.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Mail className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-medium">Nenhum briefing foi disparado ainda.</p>
              <p className="text-xs text-slate-400">Quando você disparar uma edição, ela ficará arquivada aqui com as métricas de entrega.</p>
            </div>
          )}
        </div>
      )}

      {/* ================= SETTINGS & GUIDE TAB ================= */}
      {activeSubTab === 'settings' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-2xl text-amber-800">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 font-['Outfit']">
                Como Funciona o Envio de E-mails
              </h3>
              <p className="text-xs text-slate-500">
                Configurações de infraestrutura e disparo real via API.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                1. Modo Demonstração & Prévia (Ativo)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Você pode criar, editar, testar em tempo real e salvar todas as edições no banco de dados. O sistema simula o envio instantâneo e registra as métricas perfeitamente.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                2. Ativar Envio Real (Resend)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Para que os e-mails cheguem de verdade nas caixas de entrada de qualquer leitor externo:
              </p>
              <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
                <li>Acesse <strong>resend.com</strong> e crie uma conta gratuita (3.000 e-mails/mês).</li>
                <li>Gere sua chave de API (ex: <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">re_123456...</code>).</li>
                <li>Adicione a variável <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">RESEND_API_KEY</code> no arquivo <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">.env</code>.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Mass Dispatch */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-black font-['Outfit'] text-slate-900">
                Confirmar Disparo do Briefing
              </h3>
              <p className="text-xs text-slate-600">
                Você está prestes a disparar a edição <strong>"{subject}"</strong> para todos os <strong>{newsletterSubscribers.length} assinantes</strong> da lista.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span>Artigos incluídos:</span>
                <strong>{selectedPosts.length}</strong>
              </div>
              <div className="flex justify-between">
                <span>Total de destinatários:</span>
                <strong>{newsletterSubscribers.length}</strong>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendMassBriefing}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md"
              >
                Sim, Disparar Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
