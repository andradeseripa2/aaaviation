import React, { useState, useEffect } from 'react';
import { useBlog } from '../../context/BlogContext';
import { AboutPageData, AircraftExperience } from '../../types';
import { ImageUploader } from './ImageUploader';
import {
  User,
  Shield,
  Plane,
  GraduationCap,
  Sparkles,
  Save,
  RotateCcw,
  Eye,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText
} from 'lucide-react';

export const EditAboutSection: React.FC = () => {
  const { aboutData, updateAboutData, resetAboutData, navigate } = useBlog();

  const [formData, setFormData] = useState<AboutPageData>(aboutData);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  // Sync state whenever aboutData changes from context/Firestore
  useEffect(() => {
    if (aboutData) {
      setFormData(aboutData);
    }
  }, [aboutData]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      await updateAboutData(formData);
      setFeedback({
        type: 'success',
        message: 'Página "Sobre o Autor" atualizada com sucesso no banco de dados!'
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
    await resetAboutData();
    setIsSaving(false);
    setFeedback({
      type: 'success',
      message: 'Conteúdo padrão restaurado com sucesso!'
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Bio paragraphs helpers
  const handleBioParagraphChange = (index: number, value: string) => {
    const updated = [...formData.bioParagraphs];
    updated[index] = value;
    setFormData({ ...formData, bioParagraphs: updated });
  };

  const addBioParagraph = () => {
    setFormData({
      ...formData,
      bioParagraphs: [...formData.bioParagraphs, '']
    });
  };

  const removeBioParagraph = (index: number) => {
    const updated = formData.bioParagraphs.filter((_, i) => i !== index);
    setFormData({ ...formData, bioParagraphs: updated });
  };

  // Aircraft list helpers
  const handleAircraftChange = (index: number, field: keyof AircraftExperience, value: string) => {
    const updated = [...formData.aircraftList];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, aircraftList: updated });
  };

  const addAircraft = () => {
    const newAircraft: AircraftExperience = {
      id: `ac-${Date.now()}`,
      model: 'Novo Modelo de Aeronave',
      role: 'Função / Categoria Operacional',
      details: 'Descreva a vivência prática, sistemas mecânicos ou tipo de manutenção realizada nesta aeronave.',
      imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80'
    };
    setFormData({
      ...formData,
      aircraftList: [...formData.aircraftList, newAircraft]
    });
  };

  const removeAircraft = (index: number) => {
    const updated = formData.aircraftList.filter((_, i) => i !== index);
    setFormData({ ...formData, aircraftList: updated });
  };

  // Credentials list helpers
  const handleCredentialChange = (index: number, value: string) => {
    const updated = [...formData.credentialsList];
    updated[index] = value;
    setFormData({ ...formData, credentialsList: updated });
  };

  const addCredential = () => {
    setFormData({
      ...formData,
      credentialsList: [...formData.credentialsList, '']
    });
  };

  const removeCredential = (index: number) => {
    const updated = formData.credentialsList.filter((_, i) => i !== index);
    setFormData({ ...formData, credentialsList: updated });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-[#070F1E] rounded-3xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#EFF6FF] dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-400 text-xs font-bold font-['Outfit'] uppercase tracking-wider mb-2">
            <User className="w-3.5 h-3.5" />
            Editor Institucional
          </div>
          <h2 className="text-2xl font-black text-[#0A192F] dark:text-white font-['Outfit']">
            Editar Página "Sobre o Autor"
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1">
            Personalize os textos biográficos, pilares técnicos, credenciais e faça upload de imagens em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('about')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Ver Página</span>
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
        {/* SEÇÃO NOVO: CARTÃO DE AUTORIDADE DA HOMEPAGE */}
        <div className="bg-white dark:bg-[#070F1E] rounded-3xl border border-amber-200 dark:border-amber-900/40 p-6 sm:p-8 space-y-6 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3 pb-4 border-b border-[#F1F5F9] dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit']">
                  Cartão de Autoridade (Homepage)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold uppercase">
                  HOME
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Personalize os textos e títulos do bloco de autoridade que aparece no final da página inicial.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
                Tag / Etiqueta
              </label>
              <input
                type="text"
                value={formData.homeAuthorityTag || ''}
                onChange={e => setFormData({ ...formData, homeAuthorityTag: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: Autor & Editor"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
                Título / Nome Exibido
              </label>
              <input
                type="text"
                value={formData.homeAuthorityTitle || ''}
                onChange={e => setFormData({ ...formData, homeAuthorityTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: Alexandre Andrade"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
                Especialidade / Cargo
              </label>
              <input
                type="text"
                value={formData.homeAuthorityRole || ''}
                onChange={e => setFormData({ ...formData, homeAuthorityRole: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: Especialista em Manutenção Aeronáutica & Investigação SIPAER"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
              Texto Descritivo / Resumo do Cartão da Home
            </label>
            <textarea
              rows={3}
              value={formData.homeAuthorityBio || ''}
              onChange={e => setFormData({ ...formData, homeAuthorityBio: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              placeholder="Ex: Mais de 20 anos de vivência técnica na Força Aérea Brasileira e aviação civil, dedicados à manutenção estrutural, motores, fatores humanos e segurança de voo."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
                Subtítulo / Selo Abaixo da Contagem
              </label>
              <input
                type="text"
                value={formData.homeAuthorityBadgeText || ''}
                onChange={e => setFormData({ ...formData, homeAuthorityBadgeText: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: Doutrina Técnica & Hangar"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
                Texto do Botão
              </label>
              <input
                type="text"
                value={formData.homeAuthorityButtonText || ''}
                onChange={e => setFormData({ ...formData, homeAuthorityButtonText: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: Ver Trajetória Completa"
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO 1: CABEÇALHO & BIOGRAFIA PRINCIPAL */}
        <div className="bg-white dark:bg-[#070F1E] rounded-3xl border border-[#E2E8F0] dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-[#F1F5F9] dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit']">
                1. Biografia e Apresentação do Autor
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Informações principais exibidas no topo da página de apresentação.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
                Nome do Autor
              </label>
              <input
                type="text"
                value={formData.authorName}
                onChange={e => setFormData({ ...formData, authorName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Alexandre Andrade"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
                Badge / Etiqueta Superior
              </label>
              <input
                type="text"
                value={formData.heroBadge}
                onChange={e => setFormData({ ...formData, heroBadge: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Perfil Técnico & Biografia"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
              Frase de Destaque / Lead da Carreira
            </label>
            <textarea
              rows={3}
              value={formData.heroHighlight}
              onChange={e => setFormData({ ...formData, heroHighlight: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              placeholder="Resumo de alto impacto sobre sua atuação..."
            />
          </div>

          {/* Parágrafos da Biografia */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                Parágrafos da Trajetória (Biografia Detalhada)
              </label>
              <button
                type="button"
                onClick={addBioParagraph}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Parágrafo
              </button>
            </div>

            {formData.bioParagraphs.map((p, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 mt-3 w-6 shrink-0">
                  #{idx + 1}
                </span>
                <textarea
                  rows={2}
                  value={p}
                  onChange={e => handleBioParagraphChange(idx, e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder={`Parágrafo ${idx + 1}...`}
                />
                {formData.bioParagraphs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBioParagraph(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer mt-1"
                    title="Remover parágrafo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SEÇÃO 2: FOTO DO AUTOR & BADGES DA FOTO */}
        <div className="bg-white dark:bg-[#070F1E] rounded-3xl border border-[#E2E8F0] dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-[#F1F5F9] dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit']">
                2. Foto Oficial do Autor & Legenda
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Faça o upload da foto oficial (ou insira uma URL) e personalize a identificação técnica do card.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <ImageUploader
                label="Foto de Perfil do Autor"
                value={formData.photoUrl}
                onChange={url => setFormData({ ...formData, photoUrl: url })}
                placeholder="Insira a URL ou faça upload da sua foto..."
                helperText="Dica: fotos verticais ou em traje técnico/operacional têm excelente enquadramento."
              />
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
                  Etiqueta / Badge da Foto
                </label>
                <input
                  type="text"
                  value={formData.photoBadge}
                  onChange={e => setFormData({ ...formData, photoBadge: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: INSPETOR ILA • SIPAER"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
                  Subtítulo / Especialidade da Foto
                </label>
                <input
                  type="text"
                  value={formData.photoSubtitle}
                  onChange={e => setFormData({ ...formData, photoSubtitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Força Aérea Brasileira & Segurança de Voo"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: PILARES TÉCNICOS (2 CARDS) */}
        <div className="bg-white dark:bg-[#070F1E] rounded-3xl border border-[#E2E8F0] dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-[#F1F5F9] dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit']">
                3. Cards dos Pilares de Atuação (SIPAER & Prevenção)
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Edite os 2 blocos de destaque técnico (Card Claro e Card Navy).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1 */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">
              <div className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">
                Card 1 (Certificação / Formação)
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título do Card 1
                </label>
                <input
                  type="text"
                  value={formData.pillar1Title}
                  onChange={e => setFormData({ ...formData, pillar1Title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold"
                  placeholder="Ex: Certificação SIPAER"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Texto Descritivo
                </label>
                <textarea
                  rows={4}
                  value={formData.pillar1Description}
                  onChange={e => setFormData({ ...formData, pillar1Description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Rodapé Esquerdo</label>
                  <input
                    type="text"
                    value={formData.pillar1FooterLeft}
                    onChange={e => setFormData({ ...formData, pillar1FooterLeft: e.target.value })}
                    className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Rodapé Direito</label>
                  <input
                    type="text"
                    value={formData.pillar1FooterRight}
                    onChange={e => setFormData({ ...formData, pillar1FooterRight: e.target.value })}
                    className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-blue-600 dark:text-blue-400"
                  />
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#0A192F] text-white space-y-4">
              <div className="font-mono text-xs font-bold text-sky-400 uppercase">
                Card 2 (Investigação & Prevenção)
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Título do Card 2
                </label>
                <input
                  type="text"
                  value={formData.pillar2Title}
                  onChange={e => setFormData({ ...formData, pillar2Title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs font-bold"
                  placeholder="Ex: Investigação & Prevenção"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Texto Descritivo
                </label>
                <textarea
                  rows={4}
                  value={formData.pillar2Description}
                  onChange={e => setFormData({ ...formData, pillar2Description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Rodapé Esquerdo</label>
                  <input
                    type="text"
                    value={formData.pillar2FooterLeft}
                    onChange={e => setFormData({ ...formData, pillar2FooterLeft: e.target.value })}
                    className="w-full px-2 py-1.5 rounded border border-slate-700 bg-slate-900 text-xs font-mono text-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Rodapé Direito</label>
                  <input
                    type="text"
                    value={formData.pillar2FooterRight}
                    onChange={e => setFormData({ ...formData, pillar2FooterRight: e.target.value })}
                    className="w-full px-2 py-1.5 rounded border border-slate-700 bg-slate-900 text-xs font-bold text-sky-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 4: MODELOS DE AERONAVES & VIVÊNCIA TÉCNICA */}
        <div className="bg-white dark:bg-[#070F1E] rounded-3xl border border-[#E2E8F0] dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F1F5F9] dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                <Plane className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit']">
                  4. Modelos de Aeronaves & Experiência Prática
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  Gerencie as aeronaves nas quais você possui vivência técnica, inspeção e manutenção.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={addAircraft}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Aeronave</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Título da Seção de Aeronaves
              </label>
              <input
                type="text"
                value={formData.aircraftSectionTitle}
                onChange={e => setFormData({ ...formData, aircraftSectionTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Subtítulo da Seção
              </label>
              <input
                type="text"
                value={formData.aircraftSectionSubtitle}
                onChange={e => setFormData({ ...formData, aircraftSectionSubtitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />
            </div>
          </div>

          {/* Cards das aeronaves */}
          <div className="space-y-4 pt-2">
            {formData.aircraftList.map((ac, idx) => (
              <div
                key={ac.id || idx}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-4 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold">
                    Aeronave #{idx + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeAircraft(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                    title="Remover esta aeronave"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Modelo da Aeronave
                    </label>
                    <input
                      type="text"
                      value={ac.model}
                      onChange={e => handleAircraftChange(idx, 'model', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      placeholder="Ex: C-95 Bandeirante (EMB-110)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Papel / Categoria Operacional
                    </label>
                    <input
                      type="text"
                      value={ac.role}
                      onChange={e => handleAircraftChange(idx, 'role', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                      placeholder="Ex: Transporte Leve & Ligação FAB"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Detalhes Técnicos & Sistemas
                  </label>
                  <textarea
                    rows={2}
                    value={ac.details}
                    onChange={e => handleAircraftChange(idx, 'details', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs leading-relaxed"
                    placeholder="Descreva a experiência em motores, aviônica, inspeções..."
                  />
                </div>

                {/* Imagem opcional da aeronave */}
                <div>
                  <ImageUploader
                    label="Imagem Ilustrativa da Aeronave (Opcional)"
                    value={ac.imageUrl || ''}
                    onChange={url => handleAircraftChange(idx, 'imageUrl', url)}
                    placeholder="URL ou upload da foto da aeronave..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SEÇÃO 5: CREDENCIAIS E FORMAÇÃO PROFISSIONAL */}
        <div className="bg-white dark:bg-[#070F1E] rounded-3xl border border-[#E2E8F0] dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F1F5F9] dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit']">
                  5. Credenciais & Formação Profissional
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  Destaque certificados, cursos ILA, qualificações SIPAER e especializações técnicas.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={addCredential}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Credencial</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">
              Título da Seção de Credenciais
            </label>
            <input
              type="text"
              value={formData.credentialsSectionTitle}
              onChange={e => setFormData({ ...formData, credentialsSectionTitle: e.target.value })}
              className="w-full max-w-md px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold"
            />
          </div>

          <div className="space-y-3">
            {formData.credentialsList.map((cred, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <input
                  type="text"
                  value={cred}
                  onChange={e => handleCredentialChange(idx, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                  placeholder="Ex: Formação como Inspetor de Aeronaves..."
                />
                {formData.credentialsList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCredential(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                    title="Remover credencial"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SEÇÃO 6: CHAMADA PARA AÇÃO (CTA / CONTATO) */}
        <div className="bg-white dark:bg-[#070F1E] rounded-3xl border border-[#E2E8F0] dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-[#F1F5F9] dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit']">
                6. Bloco de Chamada para Ação (CTA de Contato & Consultoria)
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Banner exibido na parte inferior da página convidando para contato técnico ou consultorias.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Título do Banner
              </label>
              <input
                type="text"
                value={formData.ctaTitle}
                onChange={e => setFormData({ ...formData, ctaTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Texto do Botão
              </label>
              <input
                type="text"
                value={formData.ctaButtonText}
                onChange={e => setFormData({ ...formData, ctaButtonText: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Subtítulo do Banner
            </label>
            <textarea
              rows={2}
              value={formData.ctaSubtitle}
              onChange={e => setFormData({ ...formData, ctaSubtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs leading-relaxed"
            />
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="sticky bottom-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 bg-white/95 dark:bg-[#070F1E]/95 backdrop-blur-md rounded-2xl border border-[#CBD5E1] dark:border-slate-700 shadow-xl">
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Valores Padrão</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => navigate('about')}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Visualizar Página
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-blue-700 text-white text-xs font-extrabold shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Modal de Confirmação de Restauração */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#070F1E] rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#E2E8F0] dark:border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-2xl">
                <RotateCcw className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit']">
                  Restaurar Conteúdo Padrão
                </h3>
                <span className="text-[10px] font-mono uppercase text-amber-600 font-bold">
                  Página Sobre o Autor
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#334155] dark:text-slate-300 leading-relaxed">
              Tem certeza que deseja restaurar o texto e fotos padrão da biografia do autor Alexandre Andrade? Quaisquer modificações não salvas serão substituídas.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-slate-700 text-[#64748B] dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-sm"
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
