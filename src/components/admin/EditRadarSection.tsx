import React, { useState, useEffect } from 'react';
import { useBlog } from '../../context/BlogContext';
import { TechnicalRadarConfig, RadarMessageItem } from '../../types';
import {
  Radio,
  Save,
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Edit3,
  Check,
  X,
  Zap,
  MousePointer,
  Layers,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

const PRESET_BADGES = [
  'COMUNICADO',
  'DIRETRIZ DA ANAC',
  'ALERTA TÉCNICO',
  'AVISO OPERACIONAL',
  'DESTAQUE',
  'BOLETIM SB'
];

export const EditRadarSection: React.FC = () => {
  const { radarConfig, updateRadarConfig, posts, getCategoryName } = useBlog();

  // Helper to extract messages list safely
  const getInitialMessages = (config?: TechnicalRadarConfig): RadarMessageItem[] => {
    if (config?.messages && Array.isArray(config.messages) && config.messages.length > 0) {
      return config.messages;
    }
    // Backward compatibility with previous single customMessage
    if (config?.customMessage && config.customMessage.trim().length > 0) {
      return [
        {
          id: 'msg-legacy-1',
          badge: config.customBadgeText?.trim() || 'COMUNICADO',
          message: config.customMessage.trim(),
          link: config.customLink?.trim() || '',
          active: true,
          createdAt: new Date().toISOString()
        }
      ];
    }
    return [];
  };

  const [enabled, setEnabled] = useState<boolean>(radarConfig?.enabled ?? true);
  const [showLatestPosts, setShowLatestPosts] = useState<boolean>(radarConfig?.showLatestPosts ?? true);
  const [messages, setMessages] = useState<RadarMessageItem[]>(() => getInitialMessages(radarConfig));

  // New message form state
  const [newMessageText, setNewMessageText] = useState('');
  const [newMessageBadge, setNewMessageBadge] = useState('COMUNICADO');
  const [newMessageLink, setNewMessageLink] = useState('');
  const [isAddingOpen, setIsAddingOpen] = useState(false);

  // Edit in-place state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editBadge, setEditBadge] = useState('');
  const [editLink, setEditLink] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (radarConfig) {
      setEnabled(radarConfig.enabled ?? true);
      setShowLatestPosts(radarConfig.showLatestPosts ?? true);
      setMessages(getInitialMessages(radarConfig));
    }
  }, [radarConfig]);

  const handleAddNewMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newMessageText.trim();
    if (!trimmed) return;

    const newItem: RadarMessageItem = {
      id: `radar-msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      badge: (newMessageBadge.trim() || 'COMUNICADO').toUpperCase(),
      message: trimmed,
      link: newMessageLink.trim(),
      active: true,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [newItem, ...prev]);
    setNewMessageText('');
    setNewMessageBadge('COMUNICADO');
    setNewMessageLink('');
    setIsAddingOpen(false);
  };

  const handleToggleMessageActive = (id: string) => {
    setMessages(prev =>
      prev.map(m => (m.id === id ? { ...m, active: m.active === false ? true : false } : m))
    );
  };

  const handleDeleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const handleMoveMessage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === messages.length - 1) return;

    setMessages(prev => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const startEditMessage = (item: RadarMessageItem) => {
    setEditingId(item.id);
    setEditText(item.message);
    setEditBadge(item.badge);
    setEditLink(item.link || '');
  };

  const saveEditMessage = (id: string) => {
    if (!editText.trim()) return;
    setMessages(prev =>
      prev.map(m =>
        m.id === id
          ? {
              ...m,
              message: editText.trim(),
              badge: (editBadge.trim() || 'COMUNICADO').toUpperCase(),
              link: editLink.trim()
            }
          : m
      )
    );
    setEditingId(null);
  };

  const cancelEditMessage = () => {
    setEditingId(null);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const payload: TechnicalRadarConfig = {
      enabled,
      showLatestPosts,
      messages,
      // Clear legacy single fields to keep database clean
      customMessage: messages.length > 0 ? messages[0].message : '',
      customBadgeText: messages.length > 0 ? messages[0].badge : 'COMUNICADO',
      customLink: messages.length > 0 ? messages[0].link : '',
      updatedAt: new Date().toISOString()
    };

    try {
      await updateRadarConfig(payload);
      setFeedback({
        type: 'success',
        message: 'Configurações e mensagens do RADAR salvas e publicadas com sucesso!'
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Erro ao salvar alterações do radar.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const publishedPosts = posts.filter(p => p.published);
  const activeMessages = messages.filter(m => m.active !== false && m.message.trim().length > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-[#0A192F] text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-mono font-bold mb-3">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>RADAR & TELEJORNAL</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-['Outfit'] mb-2">
            Gestão de Mensagens do RADAR
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-['Outfit']">
            Configure a faixa superior animada no topo do portal. Agora você pode adicionar <strong>múltiplas mensagens e comunicados simultâneos</strong> (avisos da ANAC, alertas de manutenção, notas operacionais) que rolam continuamente junto aos artigos mais recentes.
          </p>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs sm:text-sm font-['Outfit'] animate-in fade-in slide-in-from-top-2 duration-200 ${
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
          <span className="flex-1 font-medium">{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold underline opacity-75 hover:opacity-100 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* LIVE PREVIEW COMPONENT */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#1D4ED8]" />
            <h3 className="text-sm font-bold text-[#0A192F] font-['Outfit']">
              Pré-visualização Dinâmica em Tempo Real
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {enabled ? '🟢 RADAR Ativo' : '🔴 RADAR Pausado'} • {activeMessages.length} mensagem(ns) ativa(s)
          </span>
        </div>

        {/* Live Ticker Box */}
        <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#0A192F] text-white">
          <div className="flex items-center h-10 px-3 overflow-hidden">
            {/* Left badge */}
            <div className="flex items-center gap-2 pr-3 bg-[#0A192F] shrink-0 border-r border-slate-800">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="font-mono font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1">
                <Radio className="w-3 h-3 text-amber-400" />
                <span>RADAR</span>
              </span>
            </div>

            {/* Scrolling track */}
            <div className="flex-1 overflow-x-auto no-scrollbar flex items-center px-4 gap-6">
              {activeMessages.map((msg, idx) => (
                <div key={msg.id || idx} className="inline-flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    <span>{(msg.badge || 'COMUNICADO').toUpperCase()}</span>
                  </span>
                  <span className="text-xs font-bold text-amber-200 whitespace-nowrap">
                    {msg.message}
                  </span>
                  {msg.link && (
                    <ExternalLink className="w-3 h-3 text-amber-400" />
                  )}
                  <span className="text-amber-500/60 font-bold mx-2">•</span>
                </div>
              ))}

              {showLatestPosts && publishedPosts.slice(0, 3).map((post, idx) => (
                <div key={idx} className="inline-flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-950 text-blue-300 border border-blue-800/50">
                    {getCategoryName(post.category).toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-100 whitespace-nowrap">
                    {post.title}
                  </span>
                  <span className="text-amber-500/60 font-bold mx-2">•</span>
                </div>
              ))}

              {activeMessages.length === 0 && !showLatestPosts && (
                <span className="text-xs text-slate-400 italic">
                  Nenhum item ativo configurado para exibição.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-[#64748B] font-['Outfit']">
          <span className="flex items-center gap-1">
            <MousePointer className="w-3.5 h-3.5 text-blue-600" />
            No site principal, o RADAR rola automaticamente em loop infinito e pausa ao passar o mouse.
          </span>
        </div>
      </div>

      {/* Main Settings & Messages Management */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
        {/* 1. Master Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <div>
            <h4 className="text-sm font-bold text-[#0A192F] font-['Outfit']">
              Exibir RADAR no Portal
            </h4>
            <p className="text-xs text-[#64748B] mt-0.5">
              Ativa ou desativa a barra de notícias e comunicados no topo de todas as páginas do site.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={enabled}
              onChange={e => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1D4ED8]"></div>
          </label>
        </div>

        {/* 2. Messages List Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs sm:text-sm font-bold text-[#0A192F] uppercase tracking-wider font-['Outfit']">
                Mensagens & Comunicados Cadastrados ({messages.length})
              </h4>
            </div>
            {!isAddingOpen && (
              <button
                type="button"
                onClick={() => setIsAddingOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold font-['Outfit'] transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Mensagem</span>
              </button>
            )}
          </div>

          {/* Add New Message Modal / Box */}
          {isAddingOpen && (
            <div className="p-5 rounded-2xl bg-amber-50/70 border-2 border-amber-300/80 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <span className="text-xs font-bold text-amber-900 font-['Outfit'] uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  Nova Mensagem para o RADAR
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingOpen(false)}
                  className="p-1 rounded-lg text-amber-700 hover:bg-amber-100 cursor-pointer"
                  title="Cancelar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message text */}
              <div>
                <label className="block text-[11px] font-bold text-amber-950 uppercase tracking-wider mb-1 font-['Outfit']">
                  Texto do Comunicado / Mensagem *
                </label>
                <textarea
                  rows={2}
                  value={newMessageText}
                  onChange={e => setNewMessageText(e.target.value)}
                  placeholder="Ex: Nova Diretriz de Aeronavegabilidade publicada pela ANAC referente a inspeções boroscópicas."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-xs sm:text-sm text-[#0A192F] focus:ring-2 focus:ring-amber-500 font-['Outfit']"
                />
              </div>

              {/* Badge selector */}
              <div>
                <label className="block text-[11px] font-bold text-amber-950 uppercase tracking-wider mb-1 font-['Outfit']">
                  Etiqueta / Badge
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_BADGES.map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setNewMessageBadge(b)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        newMessageBadge === b
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={newMessageBadge}
                  onChange={e => setNewMessageBadge(e.target.value.toUpperCase())}
                  placeholder="Ou digite outra etiqueta..."
                  className="w-full sm:w-72 px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-xs font-mono font-bold text-[#0A192F]"
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-[11px] font-bold text-amber-950 uppercase tracking-wider mb-1 font-['Outfit']">
                  Link de Destino (Opcional)
                </label>
                <input
                  type="text"
                  value={newMessageLink}
                  onChange={e => setNewMessageLink(e.target.value)}
                  placeholder="Ex: https://gov.br/anac ou /post/slug-do-artigo"
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-xs text-[#0A192F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => setIsAddingOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-amber-300 text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleAddNewMessage()}
                  disabled={!newMessageText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold font-['Outfit'] transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Incluir Mensagem na Lista</span>
                </button>
              </div>
            </div>
          )}

          {/* List of current messages */}
          {messages.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-2xl bg-[#F8FAFC] border border-dashed border-[#CBD5E1]">
              <p className="text-xs text-[#64748B] font-['Outfit']">
                Nenhuma mensagem personalizada cadastrada no momento.
              </p>
              <button
                type="button"
                onClick={() => setIsAddingOpen(true)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#1D4ED8] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Cadastrar a primeira mensagem
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((item, index) => {
                const isEditing = editingId === item.id;
                const isActive = item.active !== false;

                if (isEditing) {
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-300 space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-blue-900 font-['Outfit']">
                        <span>Editando Mensagem #{index + 1}</span>
                      </div>
                      <textarea
                        rows={2}
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-blue-200 text-xs sm:text-sm text-[#0A192F]"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-blue-900 uppercase">Etiqueta</label>
                          <input
                            type="text"
                            value={editBadge}
                            onChange={e => setEditBadge(e.target.value.toUpperCase())}
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-blue-900 uppercase">Link (Opcional)</label>
                          <input
                            type="text"
                            value={editLink}
                            onChange={e => setEditLink(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={cancelEditMessage}
                          className="px-3 py-1 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEditMessage(item.id)}
                          className="inline-flex items-center gap-1 px-3.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Concluir Edição
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-amber-300'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-800 border border-amber-500/40">
                          {item.badge}
                        </span>
                        {!isActive && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-200 text-slate-600">
                            PAUSADA
                          </span>
                        )}
                        {item.link && (
                          <span className="text-[11px] text-blue-600 inline-flex items-center gap-1 font-mono">
                            <ExternalLink className="w-3 h-3" />
                            {item.link}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-[#0A192F] font-['Outfit'] break-words">
                        {item.message}
                      </p>
                    </div>

                    {/* Actions toolbar */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 w-full sm:w-auto justify-end">
                      {/* Active Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleMessageActive(item.id)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                        }`}
                        title={isActive ? 'Pausar esta mensagem' : 'Ativar esta mensagem'}
                      >
                        {isActive ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-emerald-600" />
                            <span className="text-[10px] hidden sm:inline">Ativa</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-slate-500" />
                            <span className="text-[10px] hidden sm:inline">Pausada</span>
                          </>
                        )}
                      </button>

                      {/* Reorder buttons */}
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveMessage(index, 'up')}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                        title="Mover para cima"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === messages.length - 1}
                        onClick={() => handleMoveMessage(index, 'down')}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                        title="Mover para baixo"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => startEditMessage(item)}
                        className="p-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 cursor-pointer"
                        title="Editar mensagem"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(item.id)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Excluir mensagem"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Show Latest Posts Checkbox */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showLatestPosts}
              onChange={e => setShowLatestPosts(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-[#1D4ED8] rounded-sm focus:ring-[#1D4ED8]"
            />
            <div>
              <span className="text-xs font-bold text-[#0A192F] font-['Outfit'] block">
                Exibir os artigos mais recentes no RADAR
              </span>
              <span className="text-[11px] text-[#64748B] block mt-0.5">
                Mantém o fluxo contínuo dos últimos artigos técnicos publicados rodando no radar junto às mensagens cadastradas acima.
              </span>
            </div>
          </label>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              if (radarConfig) {
                setEnabled(radarConfig.enabled ?? true);
                setShowLatestPosts(radarConfig.showLatestPosts ?? true);
                setMessages(getInitialMessages(radarConfig));
              }
            }}
            className="px-5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#475569] hover:bg-[#F8FAFC] transition-colors font-['Outfit'] cursor-pointer"
          >
            Reverter Alterações
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0A192F] hover:bg-[#1D4ED8] text-white text-xs font-bold font-['Outfit'] shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar e Publicar RADAR'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
