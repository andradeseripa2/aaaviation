import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { AIAgentPersona } from '../../types';
import { resolveImageUrl } from '../../services/mediaService';
import { ImageUploader } from './ImageUploader';
import {
  Bot,
  Sparkles,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Sliders,
  Send,
  Zap,
  HelpCircle,
  UserCheck,
  AlertCircle,
  Play,
  BookOpen,
  FileText,
  Camera,
  Image as ImageIcon
} from 'lucide-react';

export const AIAgentsModerationManager: React.FC = () => {
  const {
    posts,
    aiAgents,
    aiModerationConfig,
    updateAIModerationConfig,
    saveAIAgent,
    deleteAIAgent,
    resetAIAgentsToDefault,
    testGenerateAIReply
  } = useBlog();

  const [isEditingAgent, setIsEditingAgent] = useState<AIAgentPersona | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Agent Form State
  const [agentName, setAgentName] = useState('');
  const [agentRole, setAgentRole] = useState('');
  const [agentSpecialty, setAgentSpecialty] = useState('');
  const [agentTone, setAgentTone] = useState('');
  const [agentBadge, setAgentBadge] = useState('');
  const [agentAvatar, setAgentAvatar] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentKeywords, setAgentKeywords] = useState('');
  const [agentEnabled, setAgentEnabled] = useState(true);

  // Live Test Sandbox State
  const [testPostId, setTestPostId] = useState<string>(posts[0]?.id || 'custom');
  const [testCustomTitle, setTestCustomTitle] = useState('Inspeção Boroscópica e Fadiga em Motores Aeronáuticos CFM56');
  const [testCustomCategory, setTestCustomCategory] = useState('Manutenção');
  const [testComment, setTestComment] = useState('Qual é a periodicidade recomendada para inspeção boroscópica em motores CFM56 e quais os limites de perda de material nas palhetas?');
  const [testSelectedAgentId, setTestSelectedAgentId] = useState<string>('smart');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ replyText: string; agent?: AIAgentPersona } | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleOpenEdit = (agent: AIAgentPersona) => {
    setIsEditingAgent(agent);
    setIsCreatingNew(false);
    setAgentName(agent.name);
    setAgentRole(agent.role);
    setAgentSpecialty(agent.specialties?.join(', ') || '');
    setAgentTone(agent.tone);
    setAgentBadge(agent.badge);
    setAgentAvatar(agent.avatar);
    setAgentPrompt(agent.systemPrompt);
    setAgentKeywords(agent.specialties?.join(', ') || '');
    setAgentEnabled(agent.enabled);
  };

  const handleOpenCreate = () => {
    setIsEditingAgent(null);
    setIsCreatingNew(true);
    setAgentName('');
    setAgentRole('');
    setAgentSpecialty('RBACs, Manutenção Aeronáutica, Segurança');
    setAgentTone('Profissional, empático e técnico');
    setAgentBadge('ESPECIALISTA');
    setAgentAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=agent-${Date.now()}`);
    setAgentPrompt('Você é um especialista em aviação civil. Responda de forma clara, segura e referenciando boas práticas aeronáuticas.');
    setAgentKeywords('aviação, manutenção, segurança');
    setAgentEnabled(true);
  };

  const handleSaveAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName.trim() || !agentRole.trim() || !agentPrompt.trim()) {
      showNotification('error', 'Preencha o nome, cargo e instruções do agente.');
      return;
    }

    const specialtiesArray = agentSpecialty
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    const agentData: AIAgentPersona = {
      id: isEditingAgent ? isEditingAgent.id : `agent-${Date.now()}`,
      name: agentName.trim(),
      role: agentRole.trim(),
      specialties: specialtiesArray.length > 0 ? specialtiesArray : ['Aviação Geral'],
      tone: agentTone.trim(),
      badge: agentBadge.trim() || 'ESPECIALISTA',
      avatar: agentAvatar.trim() || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(agentName)}`,
      systemPrompt: agentPrompt.trim(),
      enabled: agentEnabled
    };

    await saveAIAgent(agentData);
    setIsEditingAgent(null);
    setIsCreatingNew(false);
    showNotification('success', `Agente "${agentData.name}" salvo com sucesso!`);
  };

  const handleDeleteAgent = async (agentId: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o agente "${name}"?`)) {
      await deleteAIAgent(agentId);
      showNotification('success', `Agente "${name}" excluído.`);
    }
  };

  const handleResetDefaults = async () => {
    if (confirm('Restaurar os 4 agentes padrão (Inspetor Brandão, Mestre Valter, Comandante Helena, Eng. Marcos)? Suas customizações serão sobrescritas.')) {
      await resetAIAgentsToDefault();
      showNotification('success', 'Agentes restaurados com sucesso para os padrões.');
    }
  };

  const handleRunSimulator = async () => {
    if (!testComment.trim()) return;
    setTestLoading(true);
    setTestResult(null);
    setTestError(null);

    const targetAgent = testSelectedAgentId === 'smart' ? undefined : testSelectedAgentId;
    const selectedPost = posts.find(p => p.id === testPostId);
    const title = selectedPost?.title || testCustomTitle;
    const category = selectedPost?.category || testCustomCategory;
    const content = selectedPost?.content || '';

    const res = await testGenerateAIReply(testComment, targetAgent, title, category, content);

    setTestLoading(false);
    if (res.success && res.replyText) {
      setTestResult({
        replyText: res.replyText,
        agent: res.agent
      });
    } else {
      setTestError(res.error || 'Erro ao gerar resposta.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner Info */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <Bot className="w-6 h-6" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-['Outfit']">
                Agentes de IA & Moderação Automática
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Configure múltiplos especialistas com personas distintas (regulamentação, motores, operações de voo, aviônica) para responder comentários da comunidade de forma automatizada ou com aprovação em 1 clique.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetDefaults}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Restaurar personagens padrão"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 font-['Outfit'] shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Novo Agente</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold border shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* CONFIGURATION PANEL */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#1D4ED8]" />
            <h3 className="text-base font-bold text-[#0A192F] font-['Outfit']">
              Políticas de Moderação e Disparo de Respostas
            </h3>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={aiModerationConfig.enabled}
              onChange={e => updateAIModerationConfig({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1D4ED8]"></div>
            <span className="ml-3 text-xs font-bold text-[#0A192F]">
              {aiModerationConfig.enabled ? 'Agentes Ativados' : 'Agentes Desativados'}
            </span>
          </label>
        </div>

        {/* Operating Modes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mode 1: Manual Approval */}
          <div
            onClick={() => updateAIModerationConfig({ autoReplyMode: 'manual_approval' })}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
              aiModerationConfig.autoReplyMode === 'manual_approval'
                ? 'border-[#1D4ED8] bg-blue-50/50 shadow-xs'
                : 'border-[#E2E8F0] hover:border-slate-300 bg-[#F8FAFC]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <UserCheck className="w-5 h-5" />
              </div>
              <input
                type="radio"
                name="replyMode"
                checked={aiModerationConfig.autoReplyMode === 'manual_approval'}
                onChange={() => updateAIModerationConfig({ autoReplyMode: 'manual_approval' })}
                className="w-4 h-4 text-blue-600"
              />
            </div>
            <h4 className="text-xs font-bold text-[#0A192F] uppercase font-['Outfit'] mb-1">
              Modo Manual (Recomendado)
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              A IA sugere a melhor resposta para cada comentário e você aprova, edita ou descarta com 1 clique no painel.
            </p>
          </div>

          {/* Mode 2: Auto with 2min delay */}
          <div
            onClick={() => updateAIModerationConfig({ autoReplyMode: 'auto_delay_2min' })}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
              aiModerationConfig.autoReplyMode === 'auto_delay_2min'
                ? 'border-[#1D4ED8] bg-blue-50/50 shadow-xs'
                : 'border-[#E2E8F0] hover:border-slate-300 bg-[#F8FAFC]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <Clock className="w-5 h-5" />
              </div>
              <input
                type="radio"
                name="replyMode"
                checked={aiModerationConfig.autoReplyMode === 'auto_delay_2min'}
                onChange={() => updateAIModerationConfig({ autoReplyMode: 'auto_delay_2min' })}
                className="w-4 h-4 text-blue-600"
              />
            </div>
            <h4 className="text-xs font-bold text-[#0A192F] uppercase font-['Outfit'] mb-1">
              Automático com Espera (~2 min)
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              O leitor comenta, o sistema aguarda {aiModerationConfig.delayMinutes || 2} minutos (efeito humanizado) e a IA publica a resposta técnica como especialista.
            </p>
          </div>

          {/* Mode 3: Instant Auto */}
          <div
            onClick={() => updateAIModerationConfig({ autoReplyMode: 'auto_instant' })}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
              aiModerationConfig.autoReplyMode === 'auto_instant'
                ? 'border-[#1D4ED8] bg-blue-50/50 shadow-xs'
                : 'border-[#E2E8F0] hover:border-slate-300 bg-[#F8FAFC]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <Zap className="w-5 h-5" />
              </div>
              <input
                type="radio"
                name="replyMode"
                checked={aiModerationConfig.autoReplyMode === 'auto_instant'}
                onChange={() => updateAIModerationConfig({ autoReplyMode: 'auto_instant' })}
                className="w-4 h-4 text-blue-600"
              />
            </div>
            <h4 className="text-xs font-bold text-[#0A192F] uppercase font-['Outfit'] mb-1">
              Automático Instantâneo
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Responde imediatamente assim que o comentário é enviado pelo usuário no blog.
            </p>
          </div>
        </div>

        {/* Smart Routing & Delay Config */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#F1F5F9]">
          <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#0A192F] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Roteamento Inteligente de Personas
              </span>
              <p className="text-[11px] text-[#64748B]">
                A IA analisa o comentário e escolhe automaticamente o especialista mais qualificado para responder.
              </p>
            </div>
            <input
              type="checkbox"
              checked={aiModerationConfig.smartRoutingEnabled}
              onChange={e => updateAIModerationConfig({ smartRoutingEnabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded-sm"
            />
          </div>

          <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#0A192F] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Tempo de Espera Automático
              </span>
              <p className="text-[11px] text-[#64748B]">
                Minutos antes do envio automático quando no modo com espera.
              </p>
            </div>
            <select
              value={aiModerationConfig.delayMinutes || 2}
              onChange={e => updateAIModerationConfig({ delayMinutes: Number(e.target.value) })}
              className="text-xs font-bold bg-white border border-[#CBD5E1] rounded-xl px-3 py-1.5 text-[#0A192F] focus:outline-hidden"
            >
              <option value={1}>1 minuto</option>
              <option value={2}>2 minutos (Padrão)</option>
              <option value={3}>3 minutos</option>
              <option value={5}>5 minutos</option>
              <option value={10}>10 minutos</option>
            </select>
          </div>
        </div>
      </div>

      {/* AGENTS LIST */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#0A192F] font-['Outfit'] flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#1D4ED8]" />
              Especialistas & Personas Cadastradas ({aiAgents.length})
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Cada agente possui sua própria especialidade, tom de voz, crachá técnico e regras de comportamento.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 bg-[#0A192F] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 font-['Outfit'] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Agente</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiAgents.map(agent => (
            <div
              key={agent.id}
              className={`p-5 rounded-2xl border transition-all space-y-3.5 ${
                agent.enabled
                  ? 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-blue-300'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={resolveImageUrl(agent.avatar)}
                    alt={agent.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-blue-200 bg-white shadow-2xs"
                    onError={e => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                        agent.name
                      )}`;
                    }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#0A192F] font-['Outfit']">{agent.name}</h4>
                      <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-black uppercase tracking-wide">
                        {agent.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[#1D4ED8] font-semibold">{agent.role}</p>
                    <p className="text-[11px] text-[#64748B]">{agent.specialties?.join(' • ')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(agent)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Editar Agente"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAgent(agent.id, agent.name)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Excluir Agente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs space-y-1">
                <div className="text-[11px] text-slate-400 font-mono uppercase font-semibold">Tom de voz:</div>
                <div className="text-[#334155] italic">"{agent.tone}"</div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex flex-wrap gap-1">
                  {agent.specialties?.slice(0, 3).map((kw, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-mono">
                      #{kw}
                    </span>
                  ))}
                  {(agent.specialties?.length || 0) > 3 && (
                    <span className="text-[10px] text-slate-400 font-mono">+{(agent.specialties?.length || 0) - 3}</span>
                  )}
                </div>

                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agent.enabled}
                    onChange={e => saveAIAgent({ ...agent, enabled: e.target.checked })}
                    className="w-3.5 h-3.5 text-blue-600 rounded-sm"
                  />
                  <span className="text-[11px] font-semibold text-slate-600">
                    {agent.enabled ? 'Ativo' : 'Pausado'}
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE / EDIT AGENT MODAL */}
      {(isCreatingNew || isEditingAgent) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col p-5 sm:p-7 shadow-2xl border border-slate-200 my-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-[#1D4ED8]" />
                <h3 className="text-base sm:text-lg font-bold text-[#0A192F] font-['Outfit']">
                  {isCreatingNew ? 'Criar Novo Especialista de IA' : `Editar ${isEditingAgent?.name}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(false);
                  setIsEditingAgent(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-colors"
                title="Fechar"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <form onSubmit={handleSaveAgent} className="flex-1 overflow-y-auto pr-1.5 sm:pr-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0A192F] uppercase mb-1">Nome do Agente</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Inspetor Brandão"
                    value={agentName}
                    onChange={e => setAgentName(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A192F] uppercase mb-1">Cargo / Título Técnico</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Auditor Regulatório & Inspetor ANAC"
                    value={agentRole}
                    onChange={e => setAgentRole(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A192F] uppercase mb-1">Especialidade Principal</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: RBACs, ANAC, FAA, Diretrizes de Aeronavegabilidade"
                    value={agentSpecialty}
                    onChange={e => setAgentSpecialty(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A192F] uppercase mb-1">Crachá / Badge</label>
                  <input
                    type="text"
                    placeholder="Ex: AUDITOR ANAC"
                    value={agentBadge}
                    onChange={e => setAgentBadge(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A192F] uppercase mb-1">Tom de Voz & Estilo</label>
                <input
                  type="text"
                  placeholder="Ex: Rigoroso, polido, sempre cita normas e prioriza segurança de voo."
                  value={agentTone}
                  onChange={e => setAgentTone(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Avatar Uploader & Presets */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <ImageUploader
                  label="Foto / Avatar do Especialista IA"
                  value={agentAvatar}
                  onChange={url => setAgentAvatar(url)}
                  placeholder="https://exemplo.com/avatar.jpg"
                />

                {/* Quick Avatar Presets */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Ou selecione um avatar rápido:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { label: 'Auditor', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' },
                      { label: 'Mecânico', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80' },
                      { label: 'Engenheira', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' },
                      { label: 'Comandante', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80' },
                      { label: 'Robô IA', url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(agentName || 'Agent')}` },
                      { label: 'Piloto Ilustrado', url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(agentName || 'Pilot')}` }
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAgentAvatar(preset.url)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                          agentAvatar === preset.url
                            ? 'bg-blue-100 border-blue-500 text-blue-800'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <img
                          src={resolveImageUrl(preset.url)}
                          alt={preset.label}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A192F] uppercase mb-1">
                  Instruções de Personalidade (System Prompt da IA)
                </label>
                <textarea
                  rows={4}
                  required
                  value={agentPrompt}
                  onChange={e => setAgentPrompt(e.target.value)}
                  placeholder="Defina como o agente deve raciocinar e responder..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A192F] uppercase mb-1">
                  Palavras-chave para Roteamento Automático (separadas por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="Ex: rbac, anac, diretriz, certificação, lei"
                  value={agentKeywords}
                  onChange={e => setAgentKeywords(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="agentEnabledCheckbox"
                  checked={agentEnabled}
                  onChange={e => setAgentEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-sm"
                />
                <label htmlFor="agentEnabledCheckbox" className="text-xs font-bold text-[#0A192F] cursor-pointer">
                  Habilitar este agente nas respostas do blog
                </label>
              </div>

              {/* Modal Sticky Footer */}
              <div className="sticky bottom-0 bg-white pt-3 pb-1 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setIsEditingAgent(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#1D4ED8] hover:bg-[#2563EB] text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Salvar Agente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIVE SIMULATOR / TEST SANDBOX */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-5">
        <div className="border-b border-[#F1F5F9] pb-4">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-[#0A192F] font-['Outfit']">
              Simulador em Tempo Real dos Agentes
            </h3>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Teste como cada agente ou o roteador automático responde a dúvidas técnicas antes de habilitar nos comentários.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0A192F] uppercase mb-1">
                Especialista para Testar:
              </label>
              <select
                value={testSelectedAgentId}
                onChange={e => setTestSelectedAgentId(e.target.value)}
                className="w-full p-2.5 text-xs font-bold bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0A192F] focus:outline-hidden"
              >
                <option value="smart">✨ Roteamento Inteligente (A IA escolhe o especialista ideal)</option>
                {aiAgents.map(a => (
                  <option key={a.id} value={a.id}>
                    🤖 {a.name} — ({a.badge}: {a.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A192F] uppercase mb-1">
                Artigo do Blog em Discussão (Contexto Real):
              </label>
              <select
                value={testPostId}
                onChange={e => setTestPostId(e.target.value)}
                className="w-full p-2.5 text-xs font-medium bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0A192F] focus:outline-hidden"
              >
                {posts.map(p => (
                  <option key={p.id} value={p.id}>
                    📄 [{p.category || 'Geral'}] {p.title}
                  </option>
                ))}
                <option value="custom">✏️ Artigo Personalizado / Título Manual</option>
              </select>
            </div>
          </div>

          {testPostId === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#0A192F] uppercase mb-1">
                  Título do Artigo Simulado:
                </label>
                <input
                  type="text"
                  value={testCustomTitle}
                  onChange={e => setTestCustomTitle(e.target.value)}
                  placeholder="Ex: Fadiga Estrutural e NDT em Asas"
                  className="w-full p-2 text-xs bg-white border border-[#CBD5E1] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#0A192F] uppercase mb-1">
                  Categoria:
                </label>
                <input
                  type="text"
                  value={testCustomCategory}
                  onChange={e => setTestCustomCategory(e.target.value)}
                  placeholder="Ex: Manutenção"
                  className="w-full p-2 text-xs bg-white border border-[#CBD5E1] rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Context Active Notification */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
            <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Contexto Integral Ativado:</strong> O especialista lê o artigo completo publicado no blog para elaborar uma resposta precisa, com embasamento técnico e sem fugir do tema.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0A192F] uppercase mb-1">
              Pergunta / Comentário Simulado do Leitor:
            </label>
            <textarea
              rows={3}
              value={testComment}
              onChange={e => setTestComment(e.target.value)}
              placeholder="Digite uma dúvida técnica aeronáutica sobre o artigo..."
              className="w-full p-3 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={testLoading}
              onClick={handleRunSimulator}
              className="px-5 py-2.5 bg-[#0A192F] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 font-['Outfit'] shadow-xs cursor-pointer"
            >
              {testLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gerando Resposta do Especialista...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Simular Resposta da IA</span>
                </>
              )}
            </button>
          </div>

          {testError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{testError}</span>
            </div>
          )}

          {testResult && (
            <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-200 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                {testResult.agent && (
                  <>
                    <img
                      src={resolveImageUrl(testResult.agent.avatar)}
                      alt={testResult.agent.name}
                      className="w-10 h-10 rounded-xl object-cover border border-blue-400 shadow-2xs"
                      onError={e => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                          testResult.agent?.name || 'Agent'
                        )}`;
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0A192F] font-['Outfit']">
                          {testResult.agent.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded-sm bg-blue-600 text-white text-[9px] font-black uppercase">
                          {testResult.agent.badge}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#1D4ED8] font-semibold">{testResult.agent.role}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 bg-white rounded-xl border border-blue-100 text-xs text-[#334155] leading-relaxed whitespace-pre-line shadow-2xs">
                {testResult.replyText}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
